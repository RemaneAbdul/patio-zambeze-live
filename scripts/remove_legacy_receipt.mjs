import fs from "node:fs";
const path = "/home/ubuntu/menu-digital-restaurante/client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");
const start = source.indexOf("{false && (<section className=\"receipt-print\"");
const marker = "</section>)}<ThermalReceipt selections=";
const end = source.indexOf(marker, start);
if (start < 0 || end < 0) throw new Error("legacy receipt block not found");
source = source.slice(0, start) + "<ThermalReceipt selections=" + source.slice(end + marker.length);
fs.writeFileSync(path, source);
