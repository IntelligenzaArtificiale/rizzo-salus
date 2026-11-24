export type Face = "anteriore" | "posteriore";
type Point = {key:string; label:string; x:number; y:number};
const paired = [
  ["spalla","Spalla",19,42], ["gomito","Gomito",28,70], ["polso","Polso",33,91],
  ["anca","Anca",12,99], ["ginocchio","Ginocchio",11,145], ["caviglia","Caviglia",12,183],
] as const;
export function points(face:Face):Point[] {
  const front = face==="anteriore";
  const central:Point[]=[{key:"cervicale",label:"Collo",x:50,y:33}];
  if(front) central.push({key:"torace",label:"Torace",x:50,y:54},{key:"addome",label:"Addome",x:50,y:80});
  else central.push({key:"lombare",label:"Regione lombare",x:50,y:83});
  return [...central,...paired.flatMap(([key,label,offset,y])=>
    (["dx","sx"] as const).map(side=>({key:key+"_"+side,label:label+" "+side.toUpperCase(),x:50+((side==="dx")===front?-offset:offset),y}))
  )];
}
export function regionLabel(code:string) {
  const [face,...parts]=code.split("_");
  const key=parts.join("_");
  return (points(face as Face).find(p=>p.key===key)?.label ?? key)+" · "+face;
}
