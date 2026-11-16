#!/usr/bin/env python3
"""Regressione browser: footer mobile e follow-up con indice 0/1 nella chat demo."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT/'docs/verifica'

with sync_playwright() as engine:
    browser = engine.chromium.launch()
    errors = []
    for width in [320, 390, 1440]:
        page = browser.new_page(viewport={'width':width,'height':844},color_scheme='dark')
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:5173/#/anteprima')
        footer = page.locator('footer')
        footer.scroll_into_view_if_needed()
        link = footer.get_by_role('link',name='Privacy e termini')
        assert link.evaluate('(e)=>getComputedStyle(e).whiteSpace')=='nowrap'
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
        page.screenshot(path=str(OUT/f'footer-dark-{width}.png'),full_page=True)
        page.goto('http://127.0.0.1:5173/#/blog')
        page.locator('footer').scroll_into_view_if_needed()
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
        page.close()
    for question in ['Confronta con settembre','Esporta il riepilogo']:
        page = browser.new_page(viewport={'width':390,'height':844})
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.add_init_script("sessionStorage.setItem('sessione',JSON.stringify({id:'1',name:'Giulia',email:'admin@demo.it',role:'admin'}))")
        page.goto('http://127.0.0.1:5173/#/assistente/c2')
        page.get_by_role('button',name=question,exact=True).click(timeout=45000)
        page.locator('p.self-end').filter(has_text=question).wait_for()
        next_question = 'Confronta con settembre' if 'riepilogo' in question else 'Quali richieste sono ferme?'
        page.get_by_role('button',name=next_question,exact=True).last.click(timeout=45000)
        page.locator('p.self-end').filter(has_text=next_question).wait_for()
        page.wait_for_timeout(1200)
        assert page.locator('p.self-end').count()==3
        page.screenshot(path=str(OUT/('followup-'+str(len(question))+'.png')),full_page=True)
        page.close()
    browser.close()
assert not errors, errors
(OUT/'followups-footer-report.json').write_text(json.dumps({'passed':True,'footer_widths':[320,390,1440],'followups':['index 0','index 1','second consecutive follow-up'],'page_errors':errors},indent=2)+'\n')
print('PASS: footer auth/blog a 320/390/1440; entrambi i follow-up e secondo messaggio consecutivo, nessun crash')
