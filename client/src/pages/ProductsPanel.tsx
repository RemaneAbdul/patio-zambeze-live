import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";

const money = (value: number) => `${value.toLocaleString("pt-MZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MT`;
const emptyForm = { name: "", categoryId: "", price: "", description: "", preparation: "", preparationEn: "", imageUrl: "" };

type ProductForm = typeof emptyForm;

export default function ProductsPanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const products = trpc.menu.adminList.useQuery({ includeRemoved: false }, { retry: false });
  const categories = trpc.menu.categories.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const create = trpc.menu.create.useMutation({ onSuccess: () => finish("Prato adicionado com sucesso.") });
  const update = trpc.menu.update.useMutation({ onSuccess: () => finish("Prato actualizado com sucesso.") });
  const statusMutation = trpc.menu.setStatus.useMutation({ onSuccess: (_, variables) => finish(variables.status === "ACTIVE" ? "Prato activado." : variables.status === "INACTIVE" ? "Prato desactivado." : "Prato removido.") });
  const createCategory = trpc.menu.createCategory.useMutation({ onSuccess: () => { void categories.refetch(); setNotice("Categoria criada."); } });

  function finish(message: string) {
    setEditingId(null); setForm(emptyForm); setNotice(message); void products.refetch(); void utils.menu.active.invalidate(); window.setTimeout(() => setNotice(""), 3200);
  }
  const filtered = useMemo(() => (products.data ?? []).filter(({ product, category: itemCategory }) => {
    const text = `${product.name} ${itemCategory?.name ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (category === "ALL" || String(product.categoryId) === category) && (statusFilter === "ALL" || product.status === statusFilter);
  }), [products.data, search, category, statusFilter]);
  const setField = (key: keyof ProductForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const startEdit = (entry: NonNullable<typeof products.data>[number]) => { setEditingId(entry.product.id); setForm({ name: entry.product.name, categoryId: String(entry.product.categoryId), price: String(entry.product.price), description: entry.product.description ?? "", preparation: entry.product.preparation ?? "", preparationEn: entry.product.preparationEn ?? "", imageUrl: entry.product.imageUrl ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const save = () => {
    if (!form.name.trim() || !form.categoryId || !form.price) { setNotice("Preencha todos os campos obrigatórios."); return; }
    const input = { categoryId: Number(form.categoryId), name: form.name.trim(), price: Number(form.price.replace(",", ".")), description: form.description || undefined, preparation: form.preparation || undefined, preparationEn: form.preparationEn || undefined, imageUrl: form.imageUrl || undefined };
    if (editingId) update.mutate({ id: editingId, ...input }); else create.mutate(input);
  };
  const chooseImage = (file?: File) => { if (!file) return; if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { setNotice("Use JPG, PNG ou WEBP até 5 MB."); return; } const reader = new FileReader(); reader.onload = () => setField("imageUrl", String(reader.result)); reader.readAsDataURL(file); };
  const addCategory = () => { const name = window.prompt("Nome da categoria:"); if (name?.trim()) createCategory.mutate({ name: name.trim() }); };

  return <DashboardLayout><div className="products-shell">
    <header className="products-header"><div><p className="eyebrow">Pátio Zambeze · catálogo</p><h1>Pratos</h1><p>Adicione, actualize e controle os pratos que aparecem no menu do cliente.</p></div><Button onClick={() => { setEditingId(null); setForm(emptyForm); }}><Plus className="h-4 w-4" /> Adicionar prato</Button></header>
    {notice && <div className="products-notice" role="status"><Check className="h-4 w-4" /> {notice}</div>}
    <section className="product-form-card"><div className="products-form-heading"><div><p className="eyebrow">{editingId ? "Editar prato" : "Novo prato"}</p><h2>{editingId ? "Guardar alterações" : "Adicionar prato"}</h2></div>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}><X className="h-4 w-4" /> Cancelar</Button>}</div><div className="products-form-grid"><label>Nome do prato<Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Ex.: Frango Grelhado" /></label><label>Categoria<div className="category-field"><select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)}><option value="">Seleccionar categoria</option>{(categories.data ?? []).filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={addCategory} aria-label="Nova categoria"><Plus className="h-4 w-4" /></button></div></label><label>Preço (MT)<Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="300" /></label><label className="products-form-wide">Descrição<textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Descrição do prato" /></label><label>Preparação (PT)<Input value={form.preparation} onChange={(e) => setField("preparation", e.target.value)} placeholder="Aproximadamente 20 min" /></label><label>Preparation (EN)<Input value={form.preparationEn} onChange={(e) => setField("preparationEn", e.target.value)} placeholder="Prepared in approximately 20 min" /></label></div><div className="product-image-editor"><div className="product-image-preview">{form.imageUrl ? <img src={form.imageUrl} alt="Pré-visualização do prato" /> : <div><ImagePlus className="h-8 w-8" /><span>Sem imagem</span></div>}</div><div><p className="font-semibold">Foto do prato</p><p className="text-sm text-muted-foreground">JPG, PNG ou WEBP até 5 MB. No telemóvel pode tirar foto directamente.</p><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => chooseImage(e.target.files?.[0])} /><Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Escolher foto</Button>{form.imageUrl && <Button type="button" variant="ghost" onClick={() => setField("imageUrl", "")}>Remover</Button>}</div></div><Button onClick={save} disabled={create.isPending || update.isPending}>{editingId ? "Guardar alterações" : "Guardar prato"}</Button></section>
    <section className="products-list-section"><div className="products-toolbar"><div className="products-search"><Search className="h-4 w-4" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar prato..." /></div><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="ALL">Todas as categorias</option>{(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">Todos os estados</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select></div>{products.isLoading ? <div className="products-empty">A carregar pratos…</div> : <div className="products-grid">{filtered.map(({ product, category: itemCategory }) => <article className="managed-product-card" key={product.id}><div className="managed-product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>🍽️<small>Sem imagem</small></span>}</div><div className="managed-product-body"><div className="managed-product-top"><div><h3>{product.name}</h3><p>{itemCategory?.name ?? "Sem categoria"}</p></div><strong>{money(Number(product.price))}</strong></div><span className={`product-status product-status-${product.status}`}>{product.status === "ACTIVE" ? "● Activo" : "● Inactivo"}</span>{product.preparation && <p className="managed-preparation">Preparação: {product.preparation}</p>}<div className="managed-product-actions"><Button variant="outline" size="sm" onClick={() => startEdit({ product, category: itemCategory })}><Pencil className="h-4 w-4" /> Editar</Button>{product.status === "ACTIVE" ? <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: product.id, status: "INACTIVE" })}>Desactivar</Button> : <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: product.id, status: "ACTIVE" })}>Activar</Button>}<Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Tem certeza que deseja remover este prato?")) statusMutation.mutate({ id: product.id, status: "REMOVED" }); }}><Trash2 className="h-4 w-4" /> Remover</Button></div></div></article>)}</div>}{!products.isLoading && !filtered.length && <div className="products-empty">Nenhum prato encontrado.</div>}</section>
  </div></DashboardLayout>;
}
