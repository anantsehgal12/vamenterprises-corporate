"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Clipboard, LoaderCircle, Search, Send, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PaginationControls } from "@/components/custom/PaginationControls";

type Product = {
  id: number;
  name: string;
  slug: string;
  images: unknown;
  mrp: string | number;
  brand_id: number | null;
  category_id: number | null;
};
type Option = { id: number; name: string };
type CatalogueLink = {
  id: number;
  slug: string;
  customer_name?: string | null;
  company_name?: string | null;
  mobile_no?: string | null;
  email?: string | null;
  product_ids?: unknown;
  brand_ids?: unknown;
  category_ids?: unknown;
  min_price?: number | string | null;
  max_price?: number | string | null;
  is_active?: boolean;
  default_sort?: string;
  view_count?: number;
};

const sortOptions = ["newest", "price_asc", "price_desc", "name_asc"];
const pretty = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function ids(value: unknown): number[] {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0) : [];
}

function imageUrl(value: unknown): string | null {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return value.trim() || null; }
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

function MultiFilter({ label, options, values, onChange }: { label: string; options: Option[]; values: number[]; onChange: (values: number[]) => void }) {
  const toggle = (id: number, checked: boolean) => onChange(checked ? [...values, id] : values.filter((value) => value !== id));
  return <Popover>
    <PopoverTrigger asChild><Button type="button" variant="outline" className="h-10 w-full justify-between gap-2 rounded-lg border-input bg-background px-3 text-left font-normal text-foreground hover:bg-accent hover:text-accent-foreground"><span className="truncate">{values.length ? `${label}: ${values.length} selected` : `All ${label.toLowerCase()}`}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground"/></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 border-border bg-popover p-2 text-popover-foreground shadow-lg">
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} aria-pressed={values.length === 0} className={`mb-1 h-9 w-full justify-start gap-2 px-2.5 text-sm ${values.length === 0 ? "bg-accent text-accent-foreground" : "text-foreground"}`}><Check className={`size-4 ${values.length === 0 ? "opacity-100" : "opacity-0"}`}/>All {label.toLowerCase()}</Button>
      <div className="max-h-64 space-y-1 overflow-y-auto border-t border-border pt-1">{options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"><Checkbox checked={values.includes(option.id)} onCheckedChange={(checked) => toggle(option.id, checked === true)}/><span className="truncate">{option.name}</span></label>)}</div>
      {values.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} className="mt-1 h-8 w-full justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground">Clear selection</Button>}
    </PopoverContent>
  </Popover>;
}

export function CatalogueLinkEditor({ linkId }: { linkId?: number }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [brands, setBrands] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedLink, setSavedLink] = useState<CatalogueLink | null>(null);
  const [slug, setSlug] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [defaultSort, setDefaultSort] = useState("newest");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const loadJson = async (url: string) => {
          const response = await fetch(url, { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Could not load catalogue data.");
          return data;
        };
        const [productData, brandData, categoryData, linkData] = await Promise.all([
          loadJson("/api/admin/products"),
          loadJson("/api/admin/brands"),
          loadJson("/api/admin/categories"),
          linkId ? loadJson("/api/admin/catalogue_links") : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setProducts(productData.rows as Product[]);
        setBrands((brandData.rows as Array<{ id: number; name: string }>).map(({ id, name }) => ({ id, name })));
        setCategories((categoryData.rows as Array<{ id: number; name: string }>).map(({ id, name }) => ({ id, name })));
        if (!linkId) setSlug(`catalogue-${crypto.randomUUID().slice(0, 8)}`);
        if (linkId) {
          if (!linkData) throw new Error("Could not load this catalogue link.");
          const link = (linkData.rows as CatalogueLink[]).find((item) => item.id === linkId);
          if (!link) throw new Error("Catalogue link not found.");
          setSavedLink(link);
          setSlug(link.slug);
          setCustomerName(link.customer_name ?? "");
          setCompanyName(link.company_name ?? "");
          setMobileNo(link.mobile_no ?? "");
          setCustomerEmail(link.email ?? "");
          setIsActive(Boolean(link.is_active));
          setDefaultSort(link.default_sort ?? "newest");
          setSelectedProducts(ids(link.product_ids));
          setSelectedBrands(ids(link.brand_ids));
          setSelectedCategories(ids(link.category_ids));
          setMinPrice(link.min_price == null ? "" : String(link.min_price));
          setMaxPrice(link.max_price == null ? "" : String(link.max_price));
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load catalogue data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [linkId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      if (query && !`${product.name} ${product.slug}`.toLowerCase().includes(query)) return false;
      if (selectedBrands.length && !selectedBrands.includes(Number(product.brand_id))) return false;
      if (selectedCategories.length && !selectedCategories.includes(Number(product.category_id))) return false;
      if (minPrice && Number(product.mrp) < Number(minPrice)) return false;
      if (maxPrice && Number(product.mrp) > Number(maxPrice)) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (defaultSort === "price_asc") return Number(a.mrp) - Number(b.mrp);
      if (defaultSort === "price_desc") return Number(b.mrp) - Number(a.mrp);
      if (defaultSort === "name_asc") return a.name.localeCompare(b.name);
      return b.id - a.id;
    });
  }, [products, search, selectedBrands, selectedCategories, minPrice, maxPrice, defaultSort]);
  const pageProducts = useMemo(() => filteredProducts.slice(page * pageSize, (page + 1) * pageSize), [filteredProducts, page, pageSize]);
  useEffect(() => setPage(0), [search, selectedBrands, selectedCategories, minPrice, maxPrice, defaultSort, pageSize]);

  function toggleProduct(id: number, checked: boolean) {
    setSelectedProducts((current) => checked ? [...new Set([...current, id])] : current.filter((value) => value !== id));
  }

  function toggleVisibleProducts() {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProducts.includes(id));
    setSelectedProducts((current) => allSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])]);
  }

  async function saveCatalogue(active: boolean, share = false) {
    if (active && selectedProducts.length === 0) { setError("Select at least one product before activating this catalogue."); return; }
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) { setError("Minimum price must be less than or equal to maximum price."); return; }
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) { setError("Enter a valid customer email address."); return; }
    setSaving(true);
    setError("");
    setMessage("");
    const body = {
      slug: slug.trim(),
      customer_name: customerName.trim() || null,
      company_name: companyName.trim() || null,
      mobile_no: mobileNo.trim() || null,
      email: customerEmail.trim() || null,
      product_ids: JSON.stringify(selectedProducts),
      brand_ids: JSON.stringify(selectedBrands),
      category_ids: JSON.stringify(selectedCategories),
      min_price: minPrice === "" ? null : Number(minPrice),
      max_price: maxPrice === "" ? null : Number(maxPrice),
      is_active: active,
      default_sort: defaultSort,
      view_count: savedLink?.view_count ?? 0,
    };
    try {
      const response = await fetch(`/api/admin/catalogue_links${savedLink ? `/${savedLink.id}` : ""}`, {
        method: savedLink ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this catalogue.");
      const link = { ...result.row, product_ids: selectedProducts, brand_ids: selectedBrands, category_ids: selectedCategories } as CatalogueLink;
      let successMessage = active ? "Catalogue saved." : "Draft saved.";
      if (share) {
        const shareUrl = `${window.location.origin}/catalogue/${encodeURIComponent(link.slug)}`;
        try {
          await navigator.clipboard.writeText(shareUrl);
          successMessage = "Catalogue saved. Link copied to clipboard.";
        } catch {
          successMessage = `Catalogue saved. Share this link: ${shareUrl}`;
        }
      }
      setSavedLink(link);
      setIsActive(active);
      setMessage(successMessage);
      router.replace("/admin/catalogue-links");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this catalogue.");
    } finally {
      setSaving(false);
    }
  }

  const selectedVisibleCount = filteredProducts.filter((product) => selectedProducts.includes(product.id)).length;

  return <div className="space-y-6 pb-24">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Link href="/admin/catalogue-links" className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5"/>Catalogue links</Link><h1 className="text-2xl font-semibold tracking-tight">{linkId ? "Edit catalogue" : "Create catalogue"}</h1><p className="mt-1 text-sm text-muted-foreground">Filter the product list, choose what to include, and prepare a shareable catalogue.</p></div>
      <div className="flex min-w-[210px] items-center justify-between gap-4 rounded-lg border border-border bg-card px-3.5 py-3 shadow-sm"><div><p className="text-xs font-medium text-foreground">Catalogue status</p><p className="mt-0.5 text-[11px] text-muted-foreground">{isActive ? "Active · customers can access" : "Draft · private"}</p></div><Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Catalogue active"/></div>
    </div>

    {(error || message) && <div role={error ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-brand-accent/20 bg-brand-accent/5 text-foreground"}`}>{error || message}</div>}

    <Card className="border-border bg-card shadow-sm"><CardContent className="grid min-w-0 items-center gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      <label className="flex min-w-0 flex-col gap-2 sm:col-span-2 xl:col-span-2"><span className="text-xs font-medium leading-4 text-foreground">Catalogue name / URL slug</span><Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Leave blank to generate automatically" className="h-10 w-full bg-background"/><span className="text-xs text-muted-foreground">Optional. The generated slug is editable.</span></label>
      <label className="flex min-w-0 flex-col gap-2"><span className="text-xs font-medium leading-4 text-foreground">Default product order</span><Select value={defaultSort} onValueChange={setDefaultSort}><SelectTrigger className="h-10 w-full bg-background"><SelectValue/></SelectTrigger><SelectContent>{sortOptions.map((sort) => <SelectItem key={sort} value={sort}>{pretty(sort)}</SelectItem>)}</SelectContent></Select></label>
    </CardContent></Card>

    <Card className="border-border bg-card shadow-sm"><CardContent className="space-y-4 p-4 sm:p-5">
      <div><h2 className="text-sm font-semibold text-foreground">Customer details <span className="font-normal text-muted-foreground">(optional)</span></h2><p className="mt-1 text-xs text-muted-foreground">Keep the intended customer’s contact details with this catalogue.</p></div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex min-w-0 flex-col gap-2"><span className="text-xs font-medium leading-4 text-foreground">Customer name</span><Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" placeholder="Customer name" className="h-10 w-full bg-background"/></label>
        <label className="flex min-w-0 flex-col gap-2"><span className="text-xs font-medium leading-4 text-foreground">Company</span><Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" placeholder="Company name" className="h-10 w-full bg-background"/></label>
        <label className="flex min-w-0 flex-col gap-2"><span className="text-xs font-medium leading-4 text-foreground">Mobile no.</span><Input type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={mobileNo} onChange={(event) => setMobileNo(event.target.value)} placeholder="Mobile number" className="h-10 w-full bg-background"/></label>
        <label className="flex min-w-0 flex-col gap-2"><span className="text-xs font-medium leading-4 text-foreground">Email</span><Input type="email" autoComplete="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="name@company.com" className="h-10 w-full bg-background"/></label>
      </div>
    </CardContent></Card>

    <Card className="border-border bg-card shadow-sm"><CardContent className="space-y-4 p-4 sm:p-5">
      <div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-brand-accent"/><div><h2 className="text-sm font-semibold text-foreground">Product filters</h2><p className="text-xs text-muted-foreground">Use one or more filters to narrow the products below.</p></div></div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <div className="relative min-w-0 sm:col-span-2 2xl:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search products by name or slug" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product name or slug" className="h-10 bg-background pl-9"/></div>
        <MultiFilter label="Brands" options={brands} values={selectedBrands} onChange={setSelectedBrands}/>
        <MultiFilter label="Categories" options={categories} values={selectedCategories} onChange={setSelectedCategories}/>
        <Input aria-label="Minimum product price" type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" className="h-10 bg-background"/>
        <Input aria-label="Maximum product price" type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price" className="h-10 bg-background"/>
        <Button type="button" variant="ghost" onClick={() => { setSearch(""); setMinPrice(""); setMaxPrice(""); setSelectedBrands([]); setSelectedCategories([]); }} className="h-10 justify-start px-2 text-muted-foreground sm:col-span-2 xl:col-span-2 2xl:col-span-1">Clear filters</Button>
      </div>
    </CardContent></Card>

    <Card className="overflow-hidden border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5"><div><h2 className="text-sm font-semibold text-foreground">Choose products</h2><p className="mt-0.5 text-xs text-muted-foreground">{filteredProducts.length} matching · {selectedProducts.length} selected</p></div><Button type="button" variant="outline" size="sm" onClick={toggleVisibleProducts} disabled={!filteredProducts.length} className="h-9 gap-2"><Check className="size-4"/>{selectedVisibleCount === filteredProducts.length && filteredProducts.length ? "Deselect visible" : "Select visible"}</Button></div>
      {loading ? <div className="grid min-h-52 place-items-center text-sm text-muted-foreground"><span className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin"/>Loading products and filters…</span></div> : error && !products.length ? <div className="grid min-h-52 place-items-center px-5 text-center text-sm text-destructive">{error}</div> : filteredProducts.length === 0 ? <div className="grid min-h-52 place-items-center px-5 text-center"><div><p className="text-sm font-medium text-foreground">No products match these filters</p><p className="mt-1 text-xs text-muted-foreground">Adjust or clear filters to see products.</p></div></div> : <><div className="divide-y divide-border">{pageProducts.map((product) => {
        const src = imageUrl(product.images);
        const brand = brands.find((option) => option.id === Number(product.brand_id))?.name;
        const category = categories.find((option) => option.id === Number(product.category_id))?.name;
        const checked = selectedProducts.includes(product.id);
        return <label key={product.id} className={`grid cursor-pointer grid-cols-[auto_3rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 transition-colors sm:grid-cols-[auto_3.5rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 ${checked ? "bg-brand-accent/5" : "hover:bg-muted/50"}`}>
          <Checkbox checked={checked} onCheckedChange={(next) => toggleProduct(product.id, next === true)} aria-label={`Select ${product.name}`} />
          <span className="relative size-12 overflow-hidden rounded-lg border border-border bg-muted sm:size-14">{src ? <Image src={src} alt="" fill unoptimized sizes="56px" className="object-cover"/> : <span className="grid size-full place-items-center text-muted-foreground"><Search className="size-5"/></span>}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{product.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{[brand, category, product.slug].filter(Boolean).join(" · ")}</span></span>
          <span className="text-right"><span className="block text-sm font-semibold text-foreground">₹{Number(product.mrp).toLocaleString("en-IN")}</span></span>
        </label>;
      })}</div><PaginationControls page={page} pageSize={pageSize} totalItems={filteredProducts.length} itemLabel="products" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}/></>}
    </Card>

    <div className="sticky bottom-0 z-20 -mx-5 border-t border-border bg-background/95 px-3 py-3 shadow-[0_-8px_24px_-18px_rgba(0,0,0,.35)] backdrop-blur-md sm:-mx-8 sm:px-8">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><p className="text-sm font-semibold text-foreground">{selectedProducts.length} {selectedProducts.length === 1 ? "product" : "products"} selected</p><p className="text-xs text-muted-foreground">{savedLink ? `Catalogue #${savedLink.id}` : "Changes are saved when you choose an action."}</p></div><div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end"><Button type="button" variant="outline" onClick={() => void saveCatalogue(false)} disabled={saving || loading} className="h-10 min-w-0 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm"><Clipboard className="hidden size-4 sm:block"/>Save as draft</Button><Button type="button" onClick={() => void saveCatalogue(isActive)} disabled={saving || loading} className="h-10 min-w-0 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm bg-[#244d32] text-white hover:bg-[#1c3e28]">{saving && <LoaderCircle className="size-4 animate-spin"/>}Save</Button><Button type="button" variant="outline" onClick={() => void saveCatalogue(true, true)} disabled={saving || loading} className="h-10 min-w-0 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm border-brand-accent/40 text-foreground hover:bg-brand-accent/10"><Send className="hidden size-4 sm:block"/>Share</Button></div></div>
    </div>
  </div>;
}
