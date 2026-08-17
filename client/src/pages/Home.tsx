/* Pátio Solar: consulta sem fricção, ritmo editorial, marfim + verde profundo + Terracota Zambeze. */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";

type Category = "Todos" | "Entradas" | "Pratos" | "Hambúrgueres" | "Bebidas" | "Sobremesas";

type Product = {
  name: string;
  category: Exclude<Category, "Todos">;
  description: string;
  price: number;
  image?: string;
  featured?: boolean;
};

const products: Product[] = [
  { name: "Frango à Zambeziana", category: "Pratos", description: "Frango macio, arroz perfumado, salada fresca e molho de coco com limão.", price: 350, image: "/manus-storage/prato-frango-zambeziana_7f9dffc0.png", featured: true },
  { name: "Frango Grelhado", category: "Pratos", description: "Peito de frango grelhado com arroz, salada e molho da casa.", price: 300 },
  { name: "Peixe Grelhado", category: "Pratos", description: "Peixe do dia na brasa, limão tostado, arroz de coco e folhas.", price: 450, image: "/manus-storage/prato-peixe-grelhado_aa2e3916.png" },
  { name: "Matapa", category: "Pratos", description: "Folhas de mandioca moídas com amendoim, coco e arroz branco.", price: 300 },
  { name: "Chamuça", category: "Entradas", description: "Pastel crocante recheado com especiarias e legumes.", price: 50 },
  { name: "Rissóis", category: "Entradas", description: "Rissóis dourados com recheio cremoso e temperos suaves.", price: 60 },
  { name: "Batata frita", category: "Entradas", description: "Batata cortada à mão, crocante por fora e macia por dentro.", price: 100 },
  { name: "Hambúrguer Clássico", category: "Hambúrgueres", description: "Carne grelhada, queijo, tomate, cebola e molho da casa.", price: 280 },
  { name: "Hambúrguer Especial", category: "Hambúrgueres", description: "Carne grelhada, queijo, cebola caramelizada e molho picante.", price: 350 },
  { name: "Coca-Cola", category: "Bebidas", description: "Refrigerante servido bem fresco.", price: 80 },
  { name: "Fanta", category: "Bebidas", description: "Refrigerante de laranja servido bem fresco.", price: 80 },
  { name: "Água", category: "Bebidas", description: "Água mineral sem gás.", price: 50 },
  { name: "Sumol", category: "Bebidas", description: "Refrigerante de fruta servido bem fresco.", price: 100 },
  { name: "Gelado", category: "Sobremesas", description: "Uma bola de gelado do dia, cremosa e refrescante.", price: 120 },
  { name: "Salada de Frutas", category: "Sobremesas", description: "Frutas tropicais da estação com hortelã e creme de coco.", price: 150, image: "/manus-storage/sobremesa-salada-frutas_04efab3f.png" },
];

const categories: Category[] = ["Todos", "Entradas", "Pratos", "Hambúrgueres", "Bebidas", "Sobremesas"];
const money = (price: number) => `${price.toLocaleString("pt-MZ")} MT`;

export default function Home() {
  const [category, setCategory] = useState<Category>("Todos");
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("todos");
  const [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [notice, setNotice] = useState(false);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "Todos" || product.category === category;
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesRange = priceFilter === "todos"
      || (priceFilter === "100" && product.price <= 100)
      || (priceFilter === "100-250" && product.price > 100 && product.price <= 250)
      || (priceFilter === "250-500" && product.price > 250 && product.price <= 500)
      || (priceFilter === "500" && product.price > 500);
    const matchesMax = maxPrice === "" || product.price <= Number(maxPrice);
    return matchesCategory && matchesQuery && matchesRange && matchesMax;
  }), [category, query, priceFilter, maxPrice]);

  const callWaiter = () => {
    setNotice(true);
    window.setTimeout(() => setNotice(false), 4200);
  };

  return (
    <div className="min-h-screen bg-[#F7F2E9] text-[#183A32]">
      <header className="border-b border-[#183A32]/10 bg-[#F7F2E9]/95 px-5 pb-6 pt-5 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/logo-symbol_8f597d73.png" alt="Símbolo Pátio Zambeze" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#C85A3F]">Menu digital</p>
              <h1 className="font-display text-3xl leading-none tracking-[-0.03em] sm:text-4xl">Pátio Zambeze</h1>
            </div>
          </div>
          <div className="hidden max-w-[210px] text-right sm:block">
            <p className="font-display text-lg leading-tight">Escolha o seu sabor.</p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#183A32]/60">Consulte o menu. Para pedir, chame o garçom.</p>
          </div>
        </div>

        <div className="mx-auto mt-7 max-w-6xl">
          <label className="sr-only" htmlFor="menu-search">Pesquisar produto</label>
          <div className="search-shell flex items-center gap-3 bg-white px-4 py-3">
            <Search className="h-5 w-5 text-[#C85A3F]" aria-hidden="true" />
            <input id="menu-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar no menu..." className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-[#183A32]/45" />
            {query && <button aria-label="Limpar pesquisa" onClick={() => setQuery("")} className="text-[#183A32]/50 transition hover:text-[#C85A3F]"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 sm:px-8">
        <section className="pt-7 sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow"><Sparkles className="mr-2 inline h-3.5 w-3.5" /> Feito para partilhar</p>
            <h2 className="mt-2 font-display text-4xl leading-none tracking-[-0.035em] sm:text-5xl">O menu da casa</h2>
          </div>
          <p className="mt-3 max-w-xs font-sans text-sm leading-relaxed text-[#183A32]/60 sm:mt-0 sm:text-right">Sabores de Moçambique, preparados para serem descobertos sem pressa.</p>
        </section>

        <nav className="category-scroll mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Categorias">
          {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`category-pill ${category === item ? "category-pill-active" : ""}`}>{item}</button>)}
        </nav>

        <section className="mt-4 border-y border-[#183A32]/10 py-3">
          <button onClick={() => setShowFilters(!showFilters)} className="flex w-full items-center justify-between text-left font-sans text-sm font-semibold">
            <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-[#C85A3F]" /> Filtrar por preço</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {showFilters && <div className="filter-panel mt-4 grid gap-3 sm:grid-cols-2">
            <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)} className="field-control">
              <option value="todos">Todos os preços</option><option value="100">Até 100 MT</option><option value="100-250">100–250 MT</option><option value="250-500">250–500 MT</option><option value="500">Acima de 500 MT</option>
            </select>
            <label className="field-control flex items-center gap-2"><input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Preço máximo" className="w-full bg-transparent outline-none" /><span className="text-xs text-[#183A32]/50">MT</span></label>
          </div>}
        </section>

        <div className="editorial-rule mt-8"><div><p className="eyebrow">{category === "Todos" ? "Da cozinha para a mesa" : `Seleção · ${category}`}</p><h3 className="mt-2 font-display text-2xl">{category === "Todos" ? "Para começar" : category}</h3></div><span className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#183A32]/45">{filteredProducts.length} itens</span></div>
        {filteredProducts.length > 0 ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product, index) => <button key={product.name} onClick={() => setSelected(product)} className={`product-card text-left ${product.featured ? "product-card-featured" : ""}`} style={{ animationDelay: `${index * 40}ms` }}>
          {product.image ? <img src={product.image} alt="" className="product-image" /> : <div className="product-image product-image-placeholder"><span className="fallback-mark" aria-hidden="true">☼</span><span>{product.category === "Bebidas" ? "Bebida fresca" : product.category}</span></div>}
          <div className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-display text-xl leading-tight">{product.name}</p><p className="mt-1.5 line-clamp-2 font-sans text-sm leading-relaxed text-[#183A32]/60">{product.description}</p></div><span className="price-tag shrink-0">{money(product.price)}</span></div><p className="mt-4 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#C85A3F]">Ver detalhes <ChevronDown className="ml-1 inline h-3 w-3 -rotate-90" /></p></div>
        </button>)}</div> : <div className="empty-state mt-5"><p className="font-display text-2xl">Nada encontrado.</p><p className="mt-2 font-sans text-sm text-[#183A32]/60">Tente outra categoria, palavra ou faixa de preço.</p></div>}

        <section className="waiter-note mt-12 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="eyebrow">Atendimento presencial</p><p className="mt-2 font-display text-2xl leading-tight">Para fazer o pedido, chame o garçom.</p></div><button onClick={callWaiter} className="waiter-button">Lembrar-me</button></section>
      </main>

      {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><article className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-title" onClick={(event) => event.stopPropagation()}>
        <button onClick={() => setSelected(null)} aria-label="Voltar ao menu" className="modal-close"><ChevronLeft className="h-5 w-5" /> <span>Voltar ao menu</span></button>
        {selected.image && <img src={selected.image} alt="" className="h-56 w-full object-cover sm:h-72" />}
        <div className="p-6 sm:p-8"><p className="eyebrow">{selected.category}</p><h2 id="product-title" className="mt-2 font-display text-4xl leading-none">{selected.name}</h2><p className="mt-5 font-sans text-base leading-relaxed text-[#183A32]/70">{selected.description}</p><p className="mt-7 font-sans text-2xl font-bold text-[#C85A3F]">{money(selected.price)}</p><div className="mt-7 border-t border-[#183A32]/10 pt-5 font-sans text-sm leading-relaxed text-[#183A32]/65">Para pedir este prato, chame o garçom da sua mesa.</div></div>
      </article></div>}
      {notice && <div className="notice" role="status">Por favor, chame o garçom da sua mesa para fazer o pedido.</div>}
    </div>
  );
}
