import { Link } from "react-router-dom";
import { Button,buttonVariants } from "@/components/atoms/Button";
import { RowList } from "@/components/app/RowList";
import { api,download,type Data } from "./api";
import { StatePill, useAction, useLoad, date, money } from "./common";

export function PatientInvoices({id}:{id:string}) {
  const load=useLoad(()=>api("/fatture/elenco",{patient_id:id}),[id]);
  const a=useAction();
  return <section className="grid gap-4"><div><Link className={buttonVariants({variant:"primary"})} to={"/fatture/nuova?paziente="+id}>Fattura prestazioni eseguite</Link></div>
    {load.loading ? <p>Caricamento fatture…</p> : load.error ? <p role="alert">{load.error} <Button onClick={load.reload}>Riprova</Button></p> : load.data?.fatture.length ?
      <RowList rows={load.data.fatture.map((f:Data)=>({key:f.id,to:"/fatture/"+f.id,title:(f.tipo==="nota_credito"?"Nota di credito ":"Fattura ")+(f.numero_testo || "in bozza"),meta:date(f.date)+" · "+money(f.totale_cents),aside:<StatePill value={f.stato}/>,actions:f.stato!=="bozza"?<Button size="sm" onClick={()=>a.act(()=>download("/fatture/scarica-pdf",{id:f.id}))}>Scarica PDF</Button>:undefined}))} /> : <p>Nessuna fattura per questo paziente.</p>}
  </section>;
}
