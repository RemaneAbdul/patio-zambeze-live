import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { prepareMenuImage } from "@/lib/menuImage";
import { useMemo, useRef, useState } from "react";
import { Camera, Check, Grid2X2, ImagePlus, List, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";

const money = (value: number) => `${value.toLocaleString("pt-MZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MT`;
const emptyForm = { name: "", categoryId: "", price: "", description: "", preparation: "", preparationEn: "", imageUrl: "" };

type ProductForm = typeof emptyForm;

export default function ProductsPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const products = trpc.menu.adminList.useQuery({ includeRemoved: false }, { retry: false });
  const categories = trpc.menu.categories.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const showMutationError = (error: { message?: string }) => {
    const raw = error.message || "";
    const detail = raw.includes("PRODUCT_NOT_FOUND") ? "Este prato já não existe ou foi removido." : raw.includes("CATEGORY_NOT_FOUND") ? "Seleccione uma categoria activa." : raw.includes("Database is not available") ? "A base de dados está temporariamente indisponível." : raw.includes("PRODUCT_NAME_REQUIRED") ? "Informe o nome do prato." : "Verifique os dados e tente novamente.";
    setNotice(`Não foi possível guardar: ${detail}`);
  };
  const create = trpc.menu.create.useMutation({ onSuccess: () => finish("Prato adicionado com sucesso."), onError: showMutationError });
  const update = trpc.menu.update.useMutation({ onSuccess: () => finish("Prato actualizado com sucesso."), onError: showMutationError });
  const statusMutation = trpc.menu.setStatus.useMutation({ onSuccess: (_, variables) => finish(variables.status === "ACTIVE" ? "Prato activado." : variables.status === "INACTIVE" ? "Prato desactivado." : "Prato removido."), onError: showMutationError });
  const createCategory = trpc.menu.createCategory.useMutation({ onSuccess: () => { void categories.refetch(); setNotice("Categoria criada."); }, onError: showMutationError });

  function finish(message: string) {
    setEditingId(null); setForm(emptyForm); setNotice(message);
    void Promise.all([products.refetch(), utils.menu.active.invalidate(), utils.menu.active.refetch()]);
    window.setTimeout(() => setNotice(""), 3200);
  }
  const filtered = useMemo(() => (products.data ?? []).filter(({ product, category: itemCategory }) => {
    const text = `${product.name} ${itemCategory?.name ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (category === "ALL" || String(product.categoryId) === category) && (statusFilter === "ALL" || product.status === statusFilter);
  }), [products.data, search, category, statusFilter]);
  const setField = (key: keyof ProductForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const startEdit = (entry: NonNullable<typeof products.data>[number]) => { setEditingId(entry.product.id); setForm({ name: entry.product.name, categoryId: String(entry.product.categoryId), price: String(entry.product.price), description: entry.product.description ?? "", preparation: entry.product.preparation ?? "", preparationEn: entry.product.preparationEn ?? "", imageUrl: entry.product.imageUrl ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const isSaving = create.isPending || update.isPending;
  const save = () => {
    if (isSaving || photoProcessing) return;
    const numericPrice = Number(form.price.replace(",", "."));
    if (!form.name.trim() || !form.categoryId || !form.price || !Number.isFinite(numericPrice) || numericPrice < 0) { setNotice("Preencha nome, categoria e um preço válido."); return; }
    const input = { categoryId: Number(form.categoryId), name: form.name.trim(), price: numericPrice, description: form.description || undefined, preparation: form.preparation || undefined, imageUrl: form.imageUrl || undefined };
    if (editingId) update.mutate({ id: editingId, ...input }); else create.mutate(input);
  };
  const chooseImage = async (file?: File) => {
    if (!file) return;
    setPhotoProcessing(true); setNotice("");
    try { setField("imageUrl", await prepareMenuImage(file)); setNotice("Foto preparada. Pode guardar o prato."); }
    catch (error) { const code = error instanceof Error ? error.message : ""; setNotice(code === "IMAGE_FORMAT_INVALID" ? "Escolha JPG, PNG ou WEBP." : code === "IMAGE_TOO_LARGE" ? "A foto deve ter no máximo 10 MB." : "Não foi possível ler esta foto. Tente outra imagem."); }
    finally { setPhotoProcessing(false); }
  };
  const addCategory = () => { const name = window.prompt("Nome da categoria:"); if (name?.trim()) createCategory.mutate({ name: name.trim() }); };

  return <DashboardLayout><div className="products-shell">
    <header className="products-header"><div><p className="eyebrow">Pátio Zambeze · catálogo</p><h1>Pratos</h1><p>Adicione, actualize e controle os pratos que aparecem no menu do cliente.</p></div><Button onClick={() => { setEditingId(null); setForm(emptyForm); }}><Plus className="h-4 w-4" /> Adicionar prato</Button></header>
    {notice && <div className="products-notice" data-state={notice.startsWith("Não foi possível") ? "error" : "success"} role="status"><Check className="h-4 w-4" /> {notice}</div>}
    <section className="product-form-card"><div className="products-form-heading"><div><p className="eyebrow">{editingId ? "Editar prato" : "Novo prato"}</p><h2>{editingId ? "Guardar alterações" : "Adicionar prato"}</h2></div>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}><X className="h-4 w-4" /> Cancelar</Button>}</div><div className="products-form-grid"><label>Nome do prato<Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Ex.: Frango Grelhado" /></label><label>Categoria<div className="category-field"><select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)}><option value="">Seleccionar categoria</option>{(categories.data ?? []).filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={addCategory} aria-label="Nova categoria"><Plus className="h-4 w-4" /></button></div></label><label>Preço (MT)<Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="300" /></label><label className="products-form-wide">Descrição<textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Descrição do prato" /></label><label>Preparação (PT)<Input value={form.preparation} onChange={(e) => setField("preparation", e.target.value)} placeholder="Aproximadamente 20 min" /></label><p className="products-auto-translation">A versão em inglês será apresentada automaticamente ao cliente quando seleccionar English.</p></div><div className="product-image-editor"><div className="product-image-preview" aria-live="polite">{form.imageUrl ? <img src={form.imageUrl} alt="Pré-visualização do prato" /> : <div><ImagePlus className="h-8 w-8" /><span>Sem imagem</span></div>}</div><div><p className="font-semibold">Foto do prato</p><p className="text-sm text-muted-foreground">JPG, PNG ou WEBP até 5 MB. No telemóvel pode tirar foto directamente.</p><input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { void chooseImage(e.target.files?.[0]); e.currentTarget.value = ""; }} /><input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => { void chooseImage(e.target.files?.[0]); e.currentTarget.value = ""; }} /><div className="photo-source-actions"><Button type="button" variant="outline" disabled={photoProcessing || isSaving} onClick={() => galleryRef.current?.click()}><Upload className="h-4 w-4" /> {photoProcessing ? "A preparar…" : "Galeria do dispositivo"}</Button><Button type="button" variant="outline" disabled={photoProcessing || isSaving} onClick={() => cameraRef.current?.click()}><Camera className="h-4 w-4" /> Tirar foto</Button></div>{photoProcessing && <div className="photo-processing-feedback" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /> A preparar a foto para guardar…</div>}{form.imageUrl && <Button type="button" variant="ghost" onClick={() => setField("imageUrl", "")}>Remover</Button>}</div></div><Button onClick={save} disabled={isSaving || photoProcessing}>{isSaving ? (editingId ? "Actualizando…" : "Guardando…") : photoProcessing ? "A preparar foto…" : (editingId ? "Guardar alterações" : "Guardar prato")}</Button>{isSaving && <div className="save-processing-feedback" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /> {editingId ? "A actualizar o prato na base de dados e no menu…" : "A guardar o prato na base de dados…"}</div>}</section>
    <section className="products-list-section"><div className="products-toolbar"><div className="products-search"><Search className="h-4 w-4" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar prato..." /></div><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="ALL">Todas as categorias</option>{(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">Todos os estados</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select><div className="products-view-toggle"><button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Vista em grelha"><Grid2X2 className="h-4 w-4" /></button><button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="Vista em lista"><List className="h-4 w-4" /></button></div></div>{products.isLoading ? <div className="products-empty">A carregar pratos…</div> : <div className={`products-grid ${viewMode === "list" ? "products-list-view" : ""}`}>{filtered.map(({ product, category: itemCategory }) => <article className="managed-product-card" key={product.id}><div className="managed-product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>🍽️<small>Sem imagem</small></span>}</div><div className="managed-product-body"><div className="managed-product-top"><div><h3>{product.name}</h3><p>{itemCategory?.name ?? "Sem categoria"}</p></div><strong>{money(Number(product.price))}</strong></div><span className={`product-status product-status-${product.status}`}>{product.status === "ACTIVE" ? "● Activo" : "● Inactivo"}</span>{product.preparation && <p className="managed-preparation">Preparação: {product.preparation}</p>}<div className="managed-product-actions"><Button variant="outline" size="sm" onClick={() => startEdit({ product, category: itemCategory })}><Pencil className="h-4 w-4" /> Editar</Button>{product.status === "ACTIVE" ? <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: product.id, status: "INACTIVE" })}>Desactivar</Button> : <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: product.id, status: "ACTIVE" })}>Activar</Button>}<Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Tem certeza que deseja remover este prato?")) statusMutation.mutate({ id: product.id, status: "REMOVED" }); }}><Trash2 className="h-4 w-4" /> Remover</Button></div></div></article>)}</div>}{!products.isLoading && !filtered.length && <div className="products-empty">Nenhum prato encontrado.</div>}</section>
  </div></DashboardLayout>;
}
