"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, LoaderCircle, Package, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/custom/Header";
import { ProductQuickView } from "@/components/custom/ProductQuickView";
import { PaginationControls } from "@/components/custom/PaginationControls";
import MainGiftbox from "@/assets/box2_(1).png";
import Giftbox from "@/assets/box.png";
import StarOne from "@/assets/star1_(1).png";
import StarTwo from "@/assets/star2_(1).png";

type Product = { id: number; name: string; slug: string; description: string | null; images: unknown; mrp: string | number; brand_name: string | null; brand_logo_url: string | null; category_name: string | null; tags?: unknown };
function imageUrl(value: unknown) {
  if (typeof value === "string") {
    const stringValue = value;
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return stringValue.trim() || null;
    }
  }
  if (!Array.isArray(value) || !value.length) return null;
  const primary = value.find((image) => image && typeof image === "object" && ((image as Record<string, unknown>).is_primary === true || (image as Record<string, unknown>).isPrimary === true)) ?? value[0];
  if (typeof primary === "string") return primary;
  if (primary && typeof primary === "object") {
    const image = primary as Record<string, unknown>;
    const url = image.url ?? image.src ?? image.image_url;
    return typeof url === "string" ? url : null;
  }
  return null;
}

function SearchableSelect({ value, onChange, options, allLabel, label, searchLabel }: { value: string; onChange: (value: string) => void; options: string[]; allLabel: string; label: string; searchLabel: string }) {
  const [open, setOpen] = useState(false);
  const pick = (next: string) => { onChange(next); setOpen(false); };
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-label={label} className="h-10 w-full justify-between gap-2 bg-background px-3 font-normal text-foreground hover:bg-accent hover:text-accent-foreground"><span className="truncate">{value === "all" ? allLabel : value}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground"/></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
      <Command>
        <CommandInput placeholder={searchLabel}/>
        <CommandList className="max-h-64">
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup>
            <CommandItem value={allLabel} onSelect={() => pick("all")}><Check className={`size-4 ${value === "all" ? "opacity-100" : "opacity-0"}`}/>{allLabel}</CommandItem>
            {options.map((option) => <CommandItem key={option} value={option} onSelect={() => pick(option)}><Check className={`size-4 ${value === option ? "opacity-100" : "opacity-0"}`}/><span className="truncate">{option}</span></CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}

export function CatalogueViewer({ slug, publicCatalogue = false }: { slug?: string; publicCatalogue?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [catalogueLinkId, setCatalogueLinkId] = useState<number>();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [fetchedTags, setFetchedTags] = useState<{ id: number; tags: unknown } | null>(null);

  // The catalogue API doesn't return tags, so load them from the product endpoint when a quick view opens.
  useEffect(() => {
    const id = quickViewProduct?.id;
    if (id == null || quickViewProduct?.tags !== undefined) return;
    let cancelled = false;
    fetch(`/api/products/${id}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => { if (!cancelled && result?.product) setFetchedTags({ id, tags: result.product.tags }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [quickViewProduct?.id, quickViewProduct?.tags]);
  const [productSearch, setProductSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("default");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [returning, setReturning] = useState(false);
  const [viewStarted, setViewStarted] = useState(publicCatalogue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const brandOptions = useMemo(() => [...new Set(products.map((product) => product.brand_name).filter((name): name is string => !!name))].sort((a, b) => a.localeCompare(b)), [products]);
  const categoryOptions = useMemo(() => [...new Set(products.map((product) => product.category_name).filter((name): name is string => !!name))].sort((a, b) => a.localeCompare(b)), [products]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (query && !`${product.name} ${product.slug} ${product.brand_name ?? ""} ${product.category_name ?? ""}`.toLowerCase().includes(query)) return false;
      if (brandFilter !== "all" && product.brand_name !== brandFilter) return false;
      if (categoryFilter !== "all" && product.category_name !== categoryFilter) return false;
      if (minPrice !== "" && Number(product.mrp) < Number(minPrice)) return false;
      if (maxPrice !== "" && Number(product.mrp) > Number(maxPrice)) return false;
      return true;
    });
    if (sortFilter === "price_asc") return filtered.sort((a, b) => Number(a.mrp) - Number(b.mrp));
    if (sortFilter === "price_desc") return filtered.sort((a, b) => Number(b.mrp) - Number(a.mrp));
    if (sortFilter === "name_asc") return filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [products, productSearch, brandFilter, categoryFilter, minPrice, maxPrice, sortFilter]);
  const pageProducts = useMemo(() => filteredProducts.slice(page * pageSize, (page + 1) * pageSize), [filteredProducts, page, pageSize]);
  useEffect(() => setPage(0), [productSearch, brandFilter, categoryFilter, minPrice, maxPrice, sortFilter, pageSize]);

  function clearFilters() {
    setProductSearch("");
    setBrandFilter("all");
    setCategoryFilter("all");
    setSortFilter("default");
    setMinPrice("");
    setMaxPrice("");
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(publicCatalogue ? "/api/catalogues" : `/api/catalogues/${encodeURIComponent(slug ?? "")}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load this catalogue.");
        if (!cancelled) {
          const storageKey = `vam-catalogue-opened:${publicCatalogue ? "our-catalogue" : slug}`;
          let hasOpenedBefore = false;
          try {
            hasOpenedBefore = window.localStorage.getItem(storageKey) === "true";
            window.localStorage.setItem(storageKey, "true");
          } catch {
            // Keep the greeting usable when browser storage is unavailable.
          }
          setReturning(hasOpenedBefore);
          setCatalogueLinkId(result.catalogueLinkId == null ? undefined : Number(result.catalogueLinkId));
          setCustomerName(typeof result.customerName === "string" ? result.customerName.trim() : "");
          setCompanyName(typeof result.companyName === "string" ? result.companyName.trim() : "");
          setProducts(result.products as Product[]);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load this catalogue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [slug, publicCatalogue]);

  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10">
      {loading ? <div className="space-y-5" aria-label="Loading catalogue"><div className="mx-auto flex min-h-56 max-w-3xl flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-8 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-brand-accent/10 text-brand-accent"><LoaderCircle className="size-6 animate-spin"/></span><span className="text-sm font-medium text-foreground">Preparing your catalogue…</span><span className="h-2 w-40 overflow-hidden rounded-full bg-muted"><span className="block h-full w-1/2 animate-pulse rounded-full bg-brand-accent"/></span></div><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{[0, 1, 2, 3, 4, 5].map((item) => <Card key={item} className="overflow-hidden border-border bg-card p-0"><div className="aspect-square animate-pulse bg-muted"/><CardContent className="space-y-3 p-3"><div className="h-4 w-3/4 animate-pulse rounded bg-muted"/><div className="h-3 w-1/2 animate-pulse rounded bg-muted"/><div className="h-5 w-1/3 animate-pulse rounded bg-muted"/></CardContent></Card>)}</div></div> : error ? <Card className="mx-auto max-w-lg border-border bg-card"><CardContent className="p-6 text-center"><Package className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-sm font-medium">Catalogue unavailable</p><p className="mt-1 text-xs text-muted-foreground">{error}</p></CardContent></Card> : !viewStarted ? <Card className="relative mx-auto max-w-3xl overflow-hidden border-brand-accent/20 bg-card shadow-sm"><div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-brand-accent/10 blur-3xl"/><CardContent className="relative flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center sm:px-12"><span className="mb-6 grid size-16 place-items-center rounded-3xl border border-brand-accent/20 bg-brand-accent/10 text-brand-accent shadow-sm"><Sparkles className="size-7 animate-pulse"/></span><p className="text-xs font-semibold uppercase tracking-[.2em] text-brand-accent">A catalogue for you</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{returning ? "Welcome back" : "Welcome"}{customerName ? `, ${customerName}` : ""}</h2>{companyName && <p className="mt-3 text-base font-medium text-muted-foreground">For <span className="text-foreground">{companyName}</span></p>}<p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your selected products are ready. Take a look through the catalogue at your own pace.</p><Button type="button" onClick={() => setViewStarted(true)} className="mt-8 h-11 gap-2 rounded-xl bg-[#244d32] px-6 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#1c3e28]">View the catalogue<ArrowRight className="size-4"/></Button><span className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-brand-accent"/>{products.length} {products.length === 1 ? "product" : "products"} selected for you<span aria-hidden="true">✦</span></span></CardContent></Card> : products.length === 0 ? <div className="grid min-h-56 place-items-center text-center"><div><Search className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-sm font-medium">No products in this catalogue</p></div></div> : <section className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="relative isolate min-h-[300px] overflow-hidden rounded-[28px] border border-[#dce9d6] bg-[radial-gradient(ellipse_at_15%_110%,#b7d99f_0%,#eaf4e4_48%,#f8fbf5_100%)] shadow-sm sm:min-h-[340px]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,.28),transparent_70%)]"/>
          <div className="relative z-10 flex min-h-[300px] items-center px-6 py-9 sm:min-h-[340px] sm:px-10 md:px-14">
            <div className="w-full max-w-[680px] pr-0 sm:w-[62%]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#427a30]/20 bg-white/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#315f22] shadow-sm backdrop-blur-sm"><Sparkles className="size-3.5"/>Curated for you</span>
              <h2 className="mt-4 text-3xl font-bold leading-[1.08] tracking-tight text-[#10270d] sm:text-4xl md:text-5xl">Our Showcase <span className="block bg-gradient-to-r from-[#2d6918] to-[#61a83b] bg-clip-text text-transparent">for You</span></h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#294c24] sm:text-base sm:leading-7">Thoughtful finds, standout gifts, and useful essentials—brought together in one handpicked collection.</p>
              <Button type="button" onClick={() => document.getElementById("catalogue-search-filters")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-6 h-11 gap-2 rounded-xl bg-[#173b0c] px-5 font-semibold text-white shadow-md shadow-[#173b0c]/15 transition-all hover:-translate-y-0.5 hover:bg-[#245c12]">Explore the collection<ArrowRight className="size-4"/></Button>
              <p className="mt-5 max-w-xl text-sm font-bold leading-5 text-[#31552b] sm:mt-6 sm:text-base sm:leading-6"> * Prices shown are MRP. For bulk pricing, open a product and fill out the query form. * </p>
            </div>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] sm:block">
            <div className="absolute -right-10 bottom-[-30%] size-[380px] rounded-full bg-[#75ad4d]/15 blur-3xl"/>
            <Image src={MainGiftbox} alt="" width={580} height={580} priority className="absolute right-[12%] top-1/2 w-[min(70%,360px)] -translate-y-1/2 object-contain drop-shadow-[0_24px_30px_rgba(30,75,19,.2)]"/>
            <Image src={Giftbox} alt="" width={360} height={360} className="absolute -bottom-[8%] right-[-2%] w-[min(42%,220px)] rotate-[-9deg] object-contain drop-shadow-[0_20px_24px_rgba(30,75,19,.2)]"/>
            <Image src={StarOne} alt="" width={120} height={120} className="absolute left-[10%] top-[18%] w-10 animate-pulse object-contain sm:w-12"/>
            <Image src={StarTwo} alt="" width={120} height={120} className="absolute right-[9%] top-[16%] w-12 animate-pulse object-contain [animation-delay:500ms] sm:w-14"/>
          </div>
          <Image src={MainGiftbox} alt="" width={300} height={300} aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-14 w-48 opacity-20 sm:hidden"/>
        </div>
        <Card id="catalogue-search-filters" className="scroll-mt-24 border-border bg-card shadow-sm"><CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-brand-accent"/><div><h2 className="text-xl font-semibold text-foreground">Find a product</h2><p className="text-xs text-muted-foreground">{filteredProducts.length} of {products.length} products</p></div></div>{(productSearch || brandFilter !== "all" || categoryFilter !== "all" || sortFilter !== "default" || minPrice || maxPrice) && <Button type="button" variant="ghost" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"><X className="size-4"/>Clear filters</Button>}</div>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="relative min-w-0 sm:col-span-2 lg:col-span-2 xl:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search catalogue products" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search by product, brand, or category" className="h-10 bg-background pl-9"/></div>
            <SearchableSelect value={brandFilter} onChange={setBrandFilter} options={brandOptions} allLabel="All brands" label="Filter by brand" searchLabel="Search brands..."/>
            <SearchableSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} allLabel="All categories" label="Filter by category" searchLabel="Search categories..."/>
            <Select value={sortFilter} onValueChange={setSortFilter}><SelectTrigger aria-label="Sort catalogue products" className="h-10 w-full py-4.75 bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="default">Recommended</SelectItem><SelectItem value="price_asc">Price: low to high</SelectItem><SelectItem value="price_desc">Price: high to low</SelectItem><SelectItem value="name_asc">Name: A to Z</SelectItem></SelectContent></Select>
            <Input aria-label="Minimum price" type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" className="h-10 bg-background"/>
            <Input aria-label="Maximum price" type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price" className="h-10 bg-background"/>
          </div>
        </CardContent></Card>
        {filteredProducts.length === 0 ? <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border bg-card/50 text-center"><div><Search className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-sm font-medium">No products match those filters</p><p className="mt-1 text-xs text-muted-foreground">Try another search or clear the filters.</p><Button type="button" variant="outline" onClick={clearFilters} className="mt-4">Clear filters</Button></div></div> : <><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{pageProducts.map((product) => {
        const src = imageUrl(product.images);
        return <Card key={product.id} role="button" tabIndex={0} aria-haspopup="dialog" aria-label={`Quick view ${product.name}`} onClick={() => setQuickViewProduct(product)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setQuickViewProduct(product); } }} className="group/card relative cursor-pointer overflow-hidden border-border bg-card py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-xl hover:shadow-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {src ? <Image src={src} alt={product.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover/card:scale-105 motion-reduce:transform-none motion-reduce:transition-none"/> : <div className="grid size-full place-items-center text-muted-foreground"><Package className="size-10 transition-transform duration-300 group-hover/card:scale-110"/></div>}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent opacity-70 transition-opacity duration-300 group-hover/card:opacity-100"/>
            <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#244d32] shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/65 dark:text-white">Recommended</span>
          </div>
          <CardContent className="relative space-y-2 p-2.5 sm:p-3">
            <div className="min-h-[4.25rem]">
              <h2 className="line-clamp-2 text-xl font-semibold leading-5 text-card-foreground transition-colors group-hover/card:text-brand-accent sm:text-xl">{product.name}</h2>
              {(product.brand_name || product.category_name) && <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"><span className="truncate font-medium text-foreground/80">{product.brand_name || ""}</span>{product.brand_name && product.category_name && <span aria-hidden="true" className="text-brand-accent">•</span>}<span className="truncate">{product.category_name || ""}</span></div>}
            </div>
            <div className="flex items-end justify-between gap-3 border-t border-border/70 pt-2.5">
              <div><p className="text-[10px] font-medium uppercase tracking-[.12em] text-muted-foreground">MRP</p><p className="mt-0.5 text-base font-semibold tracking-tight text-foreground text-xl">₹{Number(product.mrp).toLocaleString("en-IN")}</p></div>
              <span aria-hidden="true" className="mb-1 grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover/card:border-brand-accent/30 group-hover/card:bg-brand-accent/10 group-hover/card:text-brand-accent"><ArrowRight className="size-4 transition-transform duration-300 group-hover/card:translate-x-0.5"/></span>
            </div>
          </CardContent>
        </Card>;
      })}</div><PaginationControls page={page} pageSize={pageSize} totalItems={filteredProducts.length} itemLabel="products" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}/></>}
      </section>}
    </main>
    <ProductQuickView
      product={quickViewProduct ? {
        ...quickViewProduct,
        brandName: quickViewProduct.brand_name,
        brandLogoUrl: quickViewProduct.brand_logo_url,
        categoryName: quickViewProduct.category_name,
        tags: quickViewProduct.tags ?? (fetchedTags?.id === quickViewProduct.id ? fetchedTags.tags : undefined),
      } : null}
      open={Boolean(quickViewProduct)}
      onOpenChange={(open) => { if (!open) setQuickViewProduct(null); }}
      catalogueLinkId={catalogueLinkId}
      showManagementFields={false}
    />
  </div>;
}