#!/usr/bin/env python3
"""Regressione mobile delle schede/form ed export XLSX reale della vista filtrata."""
import json
from pathlib import Path
import re
import tempfile
from playwright.sync_api import sync_playwright
from openpyxl import load_workbook

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'docs/verifica'
with sync_playwright() as engine, tempfile.TemporaryDirectory() as tmp:
    browser=engine.chromium.launch()
    errors=[]
    for width in [320,390]:
        page=browser.new_page(viewport={'width':width,'height':844},color_scheme='dark',accept_downloads=True)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script("sessionStorage.setItem('sessione',JSON.stringify({id:'1',name:'Giulia Ferraro',email:'admin@demo.it',role:'admin'}))")
        for route in ['/admin/blog','/profilo','/admin/impostazioni']:
            page.goto('http://127.0.0.1:4180/#'+route)
            page.wait_for_timeout(700)
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),route
            if route=='/admin/impostazioni':
                page.get_by_label('Sezione',exact=True).select_option('SEO')
                page.get_by_label('Modello del titolo').wait_for()
                assert page.get_by_role('tablist').is_hidden()
            if route=='/profilo':
                assert page.locator('header p').filter(has_text='admin@demo.it').count()==0
                hint=page.get_by_text('Se la cambi, ti mandiamo un link per confermarla.',exact=True).bounding_box()
                label=page.locator('label').filter(has_text='Telefono').bounding_box()
                assert label['y']-hint['y']-hint['height']>=16
            page.wait_for_timeout(250)
            page.screenshot(path=str(OUT/('mobile-'+route.strip('/').replace('/','-')+f'-{width}.png')),full_page=True)
        for route,filename in [('/richieste','richieste'),('/admin/utenti','utenti'),('/admin/blog','blog'),('/admin/registro','registro')]:
            page.goto('http://127.0.0.1:4180/#'+route)
            button=page.get_by_role('button',name='Esporta Excel',exact=True)
            button.wait_for();page.wait_for_timeout(600)
            if route=='/richieste':
                filter_button=page.get_by_role('button',name=re.compile('Completata'))
                expected_count=int(re.search(r'\d+',filter_button.inner_text()).group())
                filter_button.click()
            with page.expect_download() as downloaded:button.click()
            download=downloaded.value
            assert download.suggested_filename.endswith('.xlsx')
            path=Path(tmp)/(filename+str(width)+'.xlsx');download.save_as(path)
            sheet=load_workbook(path).active
            assert sheet.max_row>1
            if route=='/richieste':
                assert sheet.max_row==expected_count+1
                assert expected_count>20
                assert all(sheet.cell(row,4).value=='Completata' for row in range(2,sheet.max_row+1))
        page.close()
    browser.close()
assert not errors,errors
(OUT/'mobile-export-report.json').write_text(json.dumps({'passed':True,'widths':[320,390],'xlsx_downloads':8,'filtered_requests_rows':expected_count,'errors':errors},indent=2)+'\n')
print('PASS: schede/form a 320/390px, 8 download XLSX aperti, righe filtrate corrette, nessun errore JS')
