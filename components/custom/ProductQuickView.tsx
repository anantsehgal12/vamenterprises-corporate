"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, LoaderCircle, MessageSquareText, Package, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/custom/DateTimePicker";

export type ProductQuickViewData = {
  id?: number | string;
  name: string;
  slug?: string;
  description?: string | null;
  images?: unknown;
  mrp?: number | string | null;
  stockStatus?: string | null;
  stock_status?: string | null;
  brandName?: string | null;
  brandLogoUrl?: string | null;
  categoryName?: string | null;
  tags?: unknown;
  isActive?: boolean;
  is_active?: boolean;
};

type Props = {
  product: ProductQuickViewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  footerAction?: ReactNode;
  showManagementFields?: boolean;
  catalogueLinkId?: number;
};


function imageUrls(value: unknown): string[] {
  let images = value;
  if (typeof images === "string") {
    const imageValue = images;
    try { images = JSON.parse(imageValue); } catch { return imageValue.trim() ? [imageValue.trim()] : []; }
  }
  if (!Array.isArray(images)) return [];
  return images.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (item && typeof item === "object") {
      const image = item as Record<string, unknown>;
      const url = image.url ?? image.src ?? image.image_url;
      if (typeof url === "string" && url.trim()) return [url.trim()];
    }
    return [];
  });
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") {
    const listValue = value;
    try { value = JSON.parse(listValue); } catch { return listValue.trim() ? [listValue.trim()] : []; }
  }
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
}

function money(value: number | string | null | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount) : null;
}

export function ProductQuickView({ product, open, onOpenChange, footerAction, showManagementFields = true, catalogueLinkId }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState<"idle" | "success" | "error">("idle");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [preferredCallAt, setPreferredCallAt] = useState("");
  const enquiryFormSectionRef = useRef<HTMLDivElement>(null);
  const [portalContainer] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.getElementById("admin-root")
  );
  const images = imageUrls(product?.images);
  const tags = stringList(product?.tags);
  const mrp = money(product?.mrp);
  const stockStatus = product?.stockStatus ?? product?.stock_status ?? "in_stock";
  const isActive = product?.isActive ?? product?.is_active ?? true;

  useEffect(() => {
    setActiveImage(0);
    setEnquiryOpen(false);
    setSubmittingEnquiry(false);
    setEnquiryStatus("idle");
    setEnquiryMessage("");
    setPreferredCallAt("");
  }, [product?.id, open]);

  useEffect(() => {
    if (enquiryOpen) enquiryFormSectionRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [enquiryOpen]);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product?.id) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmittingEnquiry(true);
    setEnquiryStatus("idle");
    setEnquiryMessage("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(product.id),
          catalogueLinkId,
          name: values.get("name"),
          companyName: values.get("companyName"),
          contactNo: values.get("contactNo"),
          email: values.get("email"),
          quantity: values.get("quantity"),
          preferredCallAt,
          notes: values.get("notes"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not send your query. Please try again.");
      setEnquiryStatus("success");
      setEnquiryMessage("Your query has been sent. Our team will contact you soon.");
      form.reset();
      setPreferredCallAt("");
    } catch (cause) {
      setEnquiryStatus("error");
      setEnquiryMessage(cause instanceof Error ? cause.message : "Could not send your query. Please try again.");
    } finally {
      setSubmittingEnquiry(false);
    }
  }

  function moveImage(direction: -1 | 1) {
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent container={portalContainer ?? undefined} showCloseButton={false} className="flex h-[min(94dvh,900px)] w-[calc(100%-1rem)] max-w-7xl flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl transition-[opacity,transform] duration-300 ease-out data-open:zoom-in-90 data-closed:zoom-out-95 motion-reduce:animate-none motion-reduce:transition-none sm:max-w-7xl sm:rounded-2xl md:h-auto md:aspect-[2/1] md:max-h-[92dvh]">
      <DialogDescription className="sr-only">Product images, pricing, availability, and details</DialogDescription>
      <DialogClose asChild><Button variant="ghost" size="icon" aria-label="Close product details" className="absolute right-4 top-4 z-20 size-9 rounded-full text-muted-foreground hover:bg-brand-accent/10 hover:text-brand-accent max-md:bg-background/85 max-md:shadow-md max-md:backdrop-blur sm:right-6 sm:top-5"><X className="size-4"/></Button></DialogClose>
      {product && <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:grid md:grid-cols-2 md:grid-rows-1 md:overflow-hidden">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted/20 md:h-full md:min-h-0 md:aspect-auto md:shrink">
            {images.length ? <Image src={images[activeImage] ?? images[0]} alt={product.name} fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover"/> : <div className="grid size-full place-items-center text-muted-foreground"><Package className="size-14 text-brand-accent/70"/></div>}
            {images.length > 1 && <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent"/>
              <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">{activeImage + 1} / {images.length}</span>
              <Button variant="secondary" size="icon" aria-label="Previous product image" onClick={() => moveImage(-1)} className="absolute left-3 top-1/2 size-10 -translate-y-1/2 rounded-full border border-white/40 bg-background/85 text-brand-accent shadow-lg backdrop-blur hover:bg-background"><ArrowLeft className="size-4"/></Button>
              <Button variant="secondary" size="icon" aria-label="Next product image" onClick={() => moveImage(1)} className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-full border border-white/40 bg-background/85 text-brand-accent shadow-lg backdrop-blur hover:bg-background"><ArrowRight className="size-4"/></Button>
              <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto bg-gradient-to-t from-black/55 via-black/20 to-transparent px-4 pb-4 pt-10">
                {images.map((src, index) => <button type="button" key={`${src}-${index}`} onClick={() => setActiveImage(index)} aria-label={`Show product image ${index + 1}`} aria-pressed={activeImage === index} className={`relative size-12 shrink-0 overflow-hidden rounded-lg border-2 bg-background/90 shadow-md transition sm:size-14 ${activeImage === index ? "border-brand-accent ring-2 ring-brand-accent/40" : "border-white/70 opacity-80 hover:opacity-100"}`}><Image src={src} alt="" fill unoptimized sizes="56px" className="object-cover"/></button>)}
              </div>
            </>}
          </div>

          <section className="flex shrink-0 flex-col bg-card text-foreground md:min-h-0 md:shrink md:overflow-hidden md:border-l md:border-border">
            <DialogHeader className="shrink-0 border-b border-brand-accent/20 bg-card px-5 py-4 text-left sm:px-7 sm:py-5 md:pr-16">
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-brand-accent">Product quick view</p>
              <DialogTitle className="max-w-[calc(100%-1rem)] text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">{product.name}</DialogTitle>
            </DialogHeader>
            <div className="p-5 sm:p-7 md:min-h-0 md:flex-1 md:overflow-y-auto">
              <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Price</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">{mrp ?? "Price unavailable"}</span><p className="w-full pt-1 text-xs text-muted-foreground">Need bulk pricing? Raise a query below for a quote.</p>
                  
                </div>
              </div>

              <dl className="mt-5 divide-y divide-border rounded-xl border border-border px-4">
                {product.brandName && <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-muted-foreground">Brand</dt><dd className="flex items-center gap-2 text-right font-medium text-foreground">{product.brandLogoUrl && <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-background"><Image src={product.brandLogoUrl} alt={`${product.brandName} logo`} fill unoptimized sizes="44px" className="object-contain p-1"/></span>}<span>{product.brandName}</span></dd></div>}
                {product.categoryName && <div className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-muted-foreground">Category</dt><dd className="text-right font-medium text-foreground">{product.categoryName}</dd></div>}
                {showManagementFields && <div className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-muted-foreground">Availability</dt><dd className="text-right font-medium capitalize text-brand-accent">{stockStatus.replaceAll("_", " ")}</dd></div>}
                {showManagementFields && <div className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-muted-foreground">Listing status</dt><dd className="text-right font-medium text-foreground">{isActive ? "Active" : "Inactive"}</dd></div>}
                {product.slug && <div className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="shrink-0 text-muted-foreground">Product code</dt><dd className="break-all text-right font-medium text-foreground">{product.slug}</dd></div>}
              </dl>

              {product.description && <div className="mt-5 border-t border-brand-accent/20 pt-4"><h3 className="text-sm font-semibold text-foreground">Product description</h3><p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-line pr-2 text-sm leading-6 text-muted-foreground">{product.description}</p></div>}
              {tags.length > 0 && <div className="mt-5 border-t border-brand-accent/20 pt-4"><h3 className="text-sm font-semibold text-foreground">Product tags</h3><div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <Badge key={tag} variant="secondary" className="border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">{tag}</Badge>)}</div></div>}

              {product.id != null && <div ref={enquiryFormSectionRef} className="mt-5 scroll-mt-4 border-t border-brand-accent/20 pt-4">
                {enquiryOpen && <div className="space-y-4 rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4 sm:p-5">
                  <div><h3 className="text-base font-semibold text-foreground">Ask about this product</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Tell us what you need—pricing, availability, or a bulk order—and our team will follow up.</p></div>
                  {enquiryMessage && <p role={enquiryStatus === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2.5 text-sm ${enquiryStatus === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-brand-accent/20 bg-brand-accent/10 text-foreground"}`}>{enquiryMessage}</p>}
                  {enquiryStatus !== "success" && <form id={`quick-query-form-${product.id}`} onSubmit={submitEnquiry} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5"><Label htmlFor={`quick-query-name-${product.id}`} className="text-foreground">Your name <span className="text-destructive">*</span></Label><Input id={`quick-query-name-${product.id}`} name="name" autoComplete="name" required maxLength={120} placeholder="Full name" className="h-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"/></div>
                      <div className="space-y-1.5"><Label htmlFor={`quick-query-company-${product.id}`} className="text-foreground">Company</Label><Input id={`quick-query-company-${product.id}`} name="companyName" autoComplete="organization" maxLength={120} placeholder="Company name" className="h-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"/></div>
                      <div className="space-y-1.5"><Label htmlFor={`quick-query-phone-${product.id}`} className="text-foreground">Phone number <span className="text-destructive">*</span></Label><Input id={`quick-query-phone-${product.id}`} name="contactNo" type="tel" autoComplete="tel" required maxLength={20} placeholder="Your contact number" className="h-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"/></div>
                      <div className="space-y-1.5"><Label htmlFor={`quick-query-email-${product.id}`} className="text-foreground">Email</Label><Input id={`quick-query-email-${product.id}`} name="email" type="email" autoComplete="email" maxLength={255} placeholder="name@company.com" className="h-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"/></div>
                      <div className="space-y-1.5"><Label htmlFor={`quick-query-quantity-${product.id}`} className="text-foreground">Quantity <span className="text-destructive">*</span></Label><Input id={`quick-query-quantity-${product.id}`} name="quantity" type="number" inputMode="numeric" required min={Math.max(1, Number(1))} max={1000000} defaultValue={Math.max(1, Number(1))} className="h-10 border-input bg-background text-foreground focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"/></div>
                    </div>
                    <div className="space-y-1.5"><Label htmlFor={`quick-query-call-time-${product.id}`} className="text-foreground">Suitable date and time for a call <span className="text-destructive">*</span></Label><DateTimePicker id={`quick-query-call-time-${product.id}`} value={preferredCallAt} onChange={setPreferredCallAt} placeholder="Choose a date and time" className="h-10"/></div>
                    <div className="space-y-1.5"><Label htmlFor={`quick-query-notes-${product.id}`} className="text-foreground">Message <span className="text-muted-foreground">(optional)</span></Label><Textarea id={`quick-query-notes-${product.id}`} name="notes" maxLength={1000} placeholder="Anything else we should know?" className="max-h-24 min-h-16 resize-y border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-brand-accent focus-visible:ring-brand-accent/20"/></div>
                  </form>}
                </div>}
              </div>}
              {footerAction && <div className="mt-5 border-t border-border pt-4">{footerAction}</div>}
            </div>

            {product.id != null && <div className="sticky bottom-0 z-10 shrink-0 border-t border-brand-accent/20 bg-card p-4 shadow-[0_-8px_20px_-16px_rgba(76,166,38,.55)] sm:px-6">
              {!enquiryOpen ? <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">Need more details?</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Ask us about bulk pricing, availability, or ordering.</p></div>
                <Button type="button" onClick={() => { setEnquiryOpen(true); setEnquiryStatus("idle"); setEnquiryMessage(""); }} className="h-11 shrink-0 gap-2 rounded-lg bg-brand-accent px-4 font-semibold text-[#14200f] hover:bg-brand-accent/90"><MessageSquareText className="size-4"/>Raise a query</Button>
              </div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{enquiryStatus === "success" ? "Query sent" : "Product enquiry"}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{enquiryStatus === "success" ? "Our team will be in touch soon." : "Your details are only used to follow up on this request."}</p></div>
                <div className="flex shrink-0 gap-2">
                  {enquiryStatus === "success" ? <Button type="button" variant="outline" onClick={() => { setEnquiryOpen(false); setEnquiryStatus("idle"); setEnquiryMessage(""); }} className="h-10 border-brand-accent/30 bg-background text-foreground hover:bg-brand-accent/10">Done</Button> : <>
                    <Button type="button" variant="outline" onClick={() => { setEnquiryOpen(false); setEnquiryStatus("idle"); setEnquiryMessage(""); }} disabled={submittingEnquiry} className="h-10 border-border bg-background text-foreground">Cancel</Button>
                    <Button type="submit" form={`quick-query-form-${product.id}`} disabled={submittingEnquiry || !preferredCallAt} className="h-10 gap-2 bg-brand-accent px-4 font-semibold text-[#14200f] hover:bg-brand-accent/90">{submittingEnquiry ? <LoaderCircle className="size-4 animate-spin"/> : <Send className="size-4"/>}{submittingEnquiry ? "Sending…" : "Send query"}</Button>
                  </>}
                </div>
              </div>}
            </div>}
          </section>
      </div>}
    </DialogContent>
  </Dialog>;
}