import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import QRCode from "qrcode";
import { Download, Printer, QrCode, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function QrCodesPanel() {
  const [tableNumber, setTableNumber] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pngUrl, setPngUrl] = useState("");
  const [svgUrl, setSvgUrl] = useState("");
  const codes = trpc.tableHistory.qrCodes.useQuery(undefined, { retry: false });
  const generate = trpc.tableHistory.generateQrCode.useMutation({ onSuccess: (created) => { setSelectedId(created.id); setTableNumber(created.tableNumber); void codes.refetch(); } });
  const selected = useMemo(() => (codes.data ?? []).find((code) => code.id === selectedId) ?? codes.data?.[0], [codes.data, selectedId]);
  const customerUrl = selected ? `${window.location.origin}/menu?table=${encodeURIComponent(selected.qrToken)}` : "";

  useEffect(() => {
    let active = true;
    if (!customerUrl) { setPngUrl(""); setSvgUrl(""); return () => { active = false; }; }
    void QRCode.toDataURL(customerUrl, { width: 640, margin: 2, errorCorrectionLevel: "H", color: { dark: "#183A32", light: "#FFFDF8" } }).then((url) => { if (active) setPngUrl(url); });
    void QRCode.toString(customerUrl, { type: "svg", margin: 2, errorCorrectionLevel: "H", color: { dark: "#183A32", light: "#FFFDF8" } }).then((svg) => { if (active) setSvgUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`); });
    return () => { active = false; };
  }, [customerUrl]);

  const download = (url: string, extension: "png" | "svg") => { if (!url || !selected) return; const anchor = document.createElement("a"); anchor.href = url; anchor.download = `mesa-${selected.tableNumber}.${extension}`; anchor.click(); };

  return <DashboardLayout><div className="qr-shell"><header className="qr-header"><div><p className="eyebrow">Operação interna · sem limites de geração</p><h1 className="qr-title">Gerador de QR Codes</h1><p className="qr-subtitle">Associe cada código a uma mesa. O QR Code abre exclusivamente o menu do cliente com a identificação da mesa.</p></div><QrCode className="h-10 w-10 text-[#C85A3F]" /></header><section className="qr-create-card"><div><p className="eyebrow">Novo QR Code</p><h2>Identificar uma mesa</h2></div><div className="qr-create-form"><Input value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} placeholder="Ex.: 04 ou Terraço" aria-label="Número ou nome da mesa" /><Button onClick={() => generate.mutate({ tableNumber })} disabled={!tableNumber.trim() || generate.isPending}><Sparkles className="h-4 w-4" /> {generate.isPending ? "A gerar…" : "Gerar QR Code"}</Button></div></section>{selected && pngUrl && <section className="qr-preview-card"><div className="qr-preview-image"><img src={pngUrl} alt={`QR Code da mesa ${selected.tableNumber}`} /><strong>MESA {selected.tableNumber}</strong></div><div className="qr-preview-info"><p className="eyebrow">QR Code ativo</p><h2>Mesa {selected.tableNumber}</h2><p>Este código abre:</p><code>{customerUrl}</code><p className="qr-internal-id">ID interno: {selected.qrToken}</p><div className="qr-action-row"><Button onClick={() => download(pngUrl, "png")}><Download className="h-4 w-4" /> Baixar PNG</Button><Button variant="outline" onClick={() => download(svgUrl, "svg")}><Download className="h-4 w-4" /> Baixar SVG</Button><Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir</Button><Button variant="outline" onClick={() => generate.mutate({ tableNumber: selected.tableNumber })}><RefreshCw className="h-4 w-4" /> Regerar</Button></div></div></section>}<section className="qr-list-section"><div className="qr-section-heading"><div><p className="eyebrow">Mesas configuradas</p><h2>QR Codes</h2></div><span>{codes.data?.length ?? 0} configurados</span></div>{codes.isLoading ? <div className="waiter-empty">A carregar códigos…</div> : codes.error ? <div className="waiter-alert">Não foi possível carregar os QR Codes.</div> : codes.data?.length ? <div className="qr-list">{codes.data.map((code) => <button key={code.id} className={`qr-list-item ${selected?.id === code.id ? "qr-list-item-active" : ""}`} onClick={() => { setSelectedId(code.id); setTableNumber(code.tableNumber); }}><span><QrCode className="h-5 w-5" /><strong>Mesa {code.tableNumber}</strong></span><small>Atualizado em {new Date(code.updatedAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</small></button>)}</div> : <div className="waiter-empty">Ainda não há QR Codes. Crie o primeiro acima.</div>}</section><div className="qr-print-target">{pngUrl && <><img src={pngUrl} alt={`QR Code da mesa ${selected?.tableNumber ?? ""}`} /><strong>MESA {selected?.tableNumber ?? ""}</strong></>}</div></div></DashboardLayout>;
}
