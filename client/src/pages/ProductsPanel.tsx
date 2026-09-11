import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { prepareMenuImage } from "@/lib/menuImage";
import { useMemo, useRef, useState } from "react";
import { Camera, Check, Grid2X2, ImagePlus, List, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const money = (value: number) => `${value.toLocaleString("pt-MZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MT`;
const emptyForm = { name: "", categoryId: "", price: "", description: "", preparation: "", imageUrl: "" };
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
  const [photoUploadState, setPhotoUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // The panel is intentionally public/direct-access. Authorization for mutations
  // is resolved server-side by the existing panel context; queries must not be
  // disabled merely because auth.me is unavailable in the browser.
  const products = trpc.menu.adminList.useQuery({ includeRemoved: false }, { enabled: true, retry: 1 });
  const categories = trpc.menu.categories.useQuery(undefined, { enabled: true, retry: 1 });
  const utils = trpc.useUtils();

  const showMutationError = (error: { message?: string }) => {
    const raw = error.message || "";
    const detail = raw.includes("PRODUCT_NOT_FOUND") ? "Este prato já não existe ou foi removido." : raw.includes("CATEGORY_NOT_FOUND") ? "Seleccione uma categoria activa." : raw.includes("Database is not available") || raw.includes("DATABASE_UNAVAILABLE") ? "A base de dados está temporariamente indisponível." : raw.includes("PRODUCT_NAME_REQUIRED") ? "Informe o nome do prato." : raw.includes("FORBIDDEN") || raw.includes("UNAUTHORIZED") ? "Não foi possível autorizar esta operação no servidor." : "Verifique os dados e tente novamente.";
    const message = `Não foi possível guardar: ${detail}`;
    setPhotoUploadState("error"); setNotice(message); toast.error(message, { duration: 5000 });
  };

  const finish = (message: string) => {
    setEditingId(null); setForm(emptyForm); setPhotoUploadState("success"); setNotice(message); toast.success(message, { duration: 3500 });
    void Promise.all([
      products.refetch(), categories.refetch(),
      utils.menu.active.invalidate(), utils.menu.active.refetch(),
      utils.menu.staffCatalog.invalidate(), utils.menu.publicCategories.invalidate(), utils.menu.translations.invalidate(),
    ]);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const create = trpc.menu.create.useMutation({ onSuccess: () => finish("Prato adicionado com sucesso."), onError: showMutationError });
  const update = trpc.menu.update.useMutation({ onSuccess: () => finish("Prato actualizado com sucesso."), onError: showMutationError });
  const statusMutation = trpc.menu.setStatus.useMutation({ onSuccess: (_, variables) => finish(variables.status === "ACTIVE" ? "Prato activado." : variables.status === "INACTIVE" ? "Prato desactivado." : "Prato removido."), onError: showMutationError });
  const createCategory = trpc.menu.createCategory.useMutation({ onSuccess: () => { void categories.refetch(); void Promise.all([utils.menu.publicCategories.invalidate(), utils.menu.staffCatalog.invalidate(), utils.menu.active.invalidate(), utils.menu.translations.invalidate()]); setNotice("Categoria criada."); toast.success("Categoria criada.", { duration: 3500 }); }, onError: showMutationError });
  const updateCategory = trpc.menu.updateCategory.useMutation({ onSuccess: () => { void categories.refetch(); void Promise.all([utils.menu.publicCategories.invalidate(), utils.menu.staffCatalog.invalidate(), utils.menu.active.invalidate(), utils.menu.translations.invalidate()]); setNotice("Categoria actualizada."); toast.success("Categoria actualizada.", { duration: 3500 }); }, onError: showMutationError });
  const deleteCategory = trpc.menu.deleteCategory.useMutation({ onSuccess: () => { void categories.refetch(); void Promise.all([utils.menu.publicCategories.invalidate(), utils.menu.staffCatalog.invalidate(), utils.menu.active.invalidate(), utils.menu.translations.invalidate()]); setNotice("Categoria removida."); toast.success("Categoria removida.", { duration: 3500 }); }, onError: showMutationError });

  const filtered = useMemo(() => (products.data ?? []).filter(({ product, category: itemCategory }) => {
    const text = `${product.name} ${itemCategory?.name ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (category === "ALL" || String(product.categoryId) === category) && (statusFilter === "ALL" || product.status === statusFilter);
  }), [products.data, search, category, statusFilter]);
  const setField = (key: keyof ProductForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const startEdit = (entry: NonNullable<typeof products.data>[number]) => { setEditingId(entry.product.id); setForm({ name: entry.product.name, categoryId: String(entry.product.categoryId), price: String(entry.product.price), description: entry.product.description ?? "", preparation: entry.product.preparation ?? "", imageUrl: entry.product.imageUrl ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const isSaving = create.isPending || update.isPending;
  const save = () => {
    if (isSaving || photoProcessing) return;
    const numericPrice = Number(form.price.replace(",", "."));
    if (!form.name.trim() || !form.categoryId || !form.price || !Number.isFinite(numericPrice) || numericPrice < 0) { setNotice("Preencha nome, categoria e um preço válido."); return; }
    const input = { categoryId: Number(form.categoryId), name: form.name.trim(), price: numericPrice, description: form.description || undefined, preparation: form.preparation || undefined, imageUrl: form.imageUrl || undefined };
    if (form.imageUrl.startsWith("data:")) setPhotoUploadState("uploading");
    if (editingId) update.mutate({ id: editingId, ...input }); else create.mutate(input);
  };
  const chooseImage = async (file?: File) => {
    if (!file) return;
    setPhotoProcessing(true); setPhotoUploadState("idle"); setNotice("");
    try { setField("imageUrl", await prepareMenuImage(file)); setNotice("Foto preparada. Pode guardar o prato."); }
    catch (error) { const code = error instanceof Error ? error.message : ""; setNotice(code === "IMAGE_FORMAT_INVALID" ? "Escolha JPG, PNG ou WEBP." : code === "IMAGE_TOO_LARGE" ? "A foto deve ter no máximo 10 MB." : "Não foi possível ler esta foto. Tente outra imagem."); }
    finally { setPhotoProcessing(false); }
  };
  const addCategory = () => { const name = window.prompt("Nome da categoria:"); if (name?.trim()) createCategory.mutate({ name: name.trim(), displayOrder: (categories.data?.length ?? 0) + 1 }); };
  const editCategory = (item: NonNullable<typeof categories.data>[number]) => { const name = window.prompt("Nome da categoria:", item.name); if (name?.trim()) updateCategory.mutate({ id: item.id, name: name.trim(), description: item.description ?? undefined, displayOrder: item.displayOrder, status: item.status === "ACTIVE" ? "ACTIVE" : "INACTIVE" }); };

  return <DashboardLayout><div className="products-shell">
    <header className="products-header"><div><p className="eyebrow">Pátio Zambeze · catálogo</p><h1>Pratos</h1><p>Adicione, actualize e controle os pratos que aparecem no menu do cliente.</p></div><Button onClick={() => { setEditingId(null); setForm(emptyForm); }}><Plus className="h-4 w-4" /> Adicionar prato</Button></header>
    {notice && <div className="products-notice" data-state={notice.startsWith("Não foi possível") ? "error" : "success"} role="status"><Check className="h-4 w-4" /> {notice}</div>}
    <section className="product-form-card"><div className="products-form-heading"><div><p className="eyebrow">Organização do catálogo</p><h2>Categorias</h2></div><Button variant="outline" onClick={addCategory}><Plus className="h-4 w-4" /> Nova categoria</Button></div><div className="category-management-list">{(categories.data ?? []).filter(item => item.status !== "REMOVED").map(item => <div className="category-management-row" key={item.id}><span><strong>{item.name}</strong><small>{item.status === "ACTIVE" ? "Activa" : "Inactiva"}</small></span><div><Button variant="outline" size="sm" onClick={() => editCategory(item)}><Pencil className="h-4 w-4" /> Editar</Button><Button variant="outline" size="sm" onClick={() => updateCategory.mutate({ id: item.id, name: item.name, description: item.description ?? undefined, displayOrder: item.displayOrder, status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{item.status === "ACTIVE" ? "Desactivar" : "Activar"}</Button><Button variant="destructive" size="sm" onClick={() => { if (window.confirm("Remover esta categoria? Só é possível quando não há pratos activos.")) deleteCategory.mutate({ id: item.id }); }}><Trash2 className="h-4 w-4" /> Remover</Button></div></div>)}</div></section>
    <section className="product-form-card"><div className="products-form-heading"><div><p className="eyebrow">{editingId ? "Editar prato" : "Novo prato"}</p><h2>{editingId ? "Guardar alterações" : "Adicionar prato"}</h2></div>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}><X className="h-4 w-4" /> Cancelar</Button>}</div><div className="products-form-grid"><label>Nome do prato<Input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Ex.: Frango Grelhado" /></label><div className="products-auto-translation" role="note">A tradução inglesa é gerada automaticamente quando o cliente selecciona English.</div><label>Categoria<div className="category-field"><select value={form.categoryId} onChange={e => setField("categoryId", e.target.value)}><option value="">Seleccionar categoria</option>{(categories.data ?? []).filter(item => item.status === "ACTIVE").map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={addCategory} aria-label="Nova categoria"><Plus className="h-4 w-4" /></button></div></label><label>Preço (MT)<Input type="number" min="0" step="0.01" value={form.price} onChange={e => setField("price", e.target.value)} placeholder="300" /></label><label className="products-form-wide">Descrição<textarea value={form.description} onChange={e => setField("description", e.target.value)} placeholder="Descrição do prato" /></label><label>Preparação (PT)<Input value={form.preparation} onChange={e => setField("preparation", e.target.value)} placeholder="Aproximadamente 20 min" /></label></div><div className="product-image-editor"><div className="product-image-preview" aria-live="polite">{form.imageUrl ? <img src={form.imageUrl} alt="Pré-visualização do prato" /> : <div><ImagePlus className="h-8 w-8" /><span>Sem imagem</span></div>}</div><div><p className="font-semibold">Foto do prato</p><p className="text-sm text-muted-foreground">JPG, PNG ou WEBP até 10 MB. No telemóvel pode tirar foto directamente.</p><input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { void chooseImage(e.target.files?.[0]); e.currentTarget.value = ""; }} /><input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={e => { void chooseImage(e.target.files?.[0]); e.currentTarget.value = ""; }} /><div className="photo-source-actions"><Button type="button" variant="outline" disabled={photoProcessing || isSaving} onClick={() => galleryRef.current?.click()}><Upload className="h-4 w-4" /> {photoProcessing ? "A preparar…" : "Galeria do dispositivo"}</Button><Button type="button" variant="outline" disabled={photoProcessing || isSaving} onClick={() => cameraRef.current?.click()}><Camera className="h-4 w-4" /> Tirar foto</Button></div>{photoProcessing && <div className="photo-processing-feedback" role="status"><span className="loading-spinner" /> A preparar a foto para guardar…</div>}{isSaving && form.imageUrl.startsWith("data:") && <div className="photo-upload-feedback" role="status"><div className="photo-upload-feedback-heading"><span className="loading-spinner" /> <strong>A enviar a fotografia…</strong><span className="photo-upload-status">Não feche esta página</span></div><div className="photo-upload-progress" role="progressbar"><span /></div></div>}{form.imageUrl && <Button type="button" variant="destructive" onClick={() => setField("imageUrl", "")}>Remover</Button>}</div></div><Button onClick={save} disabled={isSaving || photoProcessing}>{isSaving ? (editingId ? "Actualizando…" : "Guardando…") : photoProcessing ? "A preparar foto…" : (editingId ? "Guardar alterações" : "Guardar prato")}</Button>{isSaving && <div className="save-processing-feedback" role="status"><span className="loading-spinner" /> {editingId ? "A actualizar o prato na base de dados e no menu…" : "A guardar o prato na base de dados…"}</div>}</section>
    <section className="products-list-section"><div className="products-toolbar"><div className="products-search"><Search className="h-4 w-4" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar prato..." /></div><select value={category} onChange={e => setCategory(e.target.value)}><option value="ALL">Todas as categorias</option>{(categories.data ?? []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Todos os estados</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select><div className="products-view-toggle"><button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}><Grid2X2 className="h-4 w-4" /></button><button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}><List className="h-4 w-4" /></button></div></div>{products.isLoading ? <div className="products-empty">A carregar pratos…</div> : products.error ? <div className="products-empty">Não foi possível carregar os pratos. Verifique a ligação ao servidor e tente novamente.</div> : <div className={`products-grid ${viewMode === "list" ? "products-list-view" : ""}`}>{filtered.map(({ product, category: itemCategory }) => <article className="managed-product-card" key={product.id}><div className="managed-product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>Sem imagem</span>}</div><div className="managed-product-body"><div><p className="eyebrow">{itemCategory?.name ?? "Sem categoria"}</p><h3>{product.name}</h3><p>{product.description ?? "Sem descrição"}</p></div><strong>{money(Number(product.price))}</strong><div className="managed-product-actions"><Button variant="outline" size="sm" onClick={() => startEdit({ product, category: itemCategory })}><Pencil className="h-4 w-4" /> Editar</Button><Button variant={product.status === "ACTIVE" ? "outline" : "default"} size="sm" onClick={() => statusMutation.mutate({ id: product.id, status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>{product.status === "ACTIVE" ? "Desactivar" : "Activar"}</Button><Button variant="destructive" size="sm" onClick={() => { if (window.confirm("Remover este prato?")) statusMutation.mutate({ id: product.id, status: "REMOVED" }); }}><Trash2 className="h-4 w-4" /> Remover</Button></div></div></article>)}</div>}</section>
  </div></DashboardLayout>;
}
