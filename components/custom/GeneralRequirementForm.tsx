'use client';
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/custom/DateTimePicker";
import { MultiSelectDropdown, type MultiSelectOption } from "@/components/custom/MultiSelectDropdown";

export default function GeneralRequirementForm() {
  const [categories, setCategories] = useState<MultiSelectOption[]>([]);
  const [brands, setBrands] = useState<MultiSelectOption[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [brandIds, setBrandIds] = useState<number[]>([]);
  const [preferredCallAt, setPreferredCallAt] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/general-requirements", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load categories.");
      if (!cancelled) { setCategories(data.categories as MultiSelectOption[]); setBrands(data.brands as MultiSelectOption[]); }
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load categories."); }).finally(() => { if (!cancelled) setLoadingCategories(false); });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/general-requirements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: values.get("name"), companyName: values.get("companyName"), contactNo: values.get("contactNo"), email: values.get("email"),
        categoryIds, brandIds, quantity: values.get("quantity"), preferredCallAt, notes: values.get("notes"),
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not send your request.");
      setSubmitted(true);
      form.reset(); setCategoryIds([]); setBrandIds([]); setPreferredCallAt("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send your request. Please try again."); }
    finally { setSubmitting(false); }
  }

  return <section className="relative isolate overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#dcebd4_0%,#f7faf5_55%,#eef4e9_100%)]"/>
    <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
      <div className="pt-2 lg:sticky lg:top-32"><span className="inline-flex items-center gap-2 rounded-full border border-[#4ca626]/25 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#315c3a]"><PackageSearch className="size-3.5"/>BULK & CUSTOM ORDERS</span><h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[#142b18] sm:text-5xl">Tell us what you need.<br/><span className="text-[#4ca626]">We’ll find the right quote.</span></h1><p className="mt-5 max-w-lg text-base leading-7 text-[#536456]">Share a few details about your requirement and our team will get back to you at a time that works for you.</p><div className="mt-8 flex items-start gap-3 rounded-xl border border-white bg-white/70 p-4 shadow-sm"><Clock3 className="mt-0.5 size-5 shrink-0 text-[#4ca626]"/><p className="text-sm leading-6 text-[#536456]">Pick a date and time that suits you, and we’ll do our best to call then.</p></div></div>
      <div className="rounded-2xl border border-[#dce7d8] bg-white p-5 shadow-[0_18px_60px_-40px_rgba(26,60,31,.35)] sm:p-8">
        {submitted ? <div className="grid min-h-96 content-center justify-items-center text-center"><span className="grid size-14 place-items-center rounded-full bg-[#4ca626]/10 text-[#4ca626]"><CheckCircle2 className="size-7"/></span><h2 className="mt-5 text-2xl font-semibold text-[#142b18]">Requirement received</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Thanks for reaching out. Our team will review your details and contact you during your preferred time.</p><Button type="button" variant="outline" onClick={() => setSubmitted(false)} className="mt-6 gap-2">Send another request<ArrowRight className="size-4"/></Button></div> : <form onSubmit={submit} className="space-y-6">
          <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#4ca626]">General requirements</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#142b18]">Get your quote</h2><p className="mt-1 text-sm text-muted-foreground">Fields marked <span className="text-destructive">*</span> are required.</p></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="quote-name">Your name <span className="text-destructive">*</span></Label><Input id="quote-name" name="name" autoComplete="name" required maxLength={120} placeholder="Full name" className="h-11"/></div>
            <div className="space-y-2"><Label htmlFor="quote-company">Company</Label><Input id="quote-company" name="companyName" autoComplete="organization" maxLength={120} placeholder="Company name" className="h-11"/></div>
            <div className="space-y-2"><Label htmlFor="quote-phone">Mobile number <span className="text-destructive">*</span></Label><Input id="quote-phone" name="contactNo" type="tel" autoComplete="tel" required maxLength={20} placeholder="Your contact number" className="h-11"/></div>
            <div className="space-y-2"><Label htmlFor="quote-email">Email</Label><Input id="quote-email" name="email" type="email" autoComplete="email" maxLength={255} placeholder="name@company.com" className="h-11"/></div>
            <div className="space-y-2"><Label>Brands</Label><MultiSelectDropdown label="Brands" allLabel="All brands" options={brands} values={brandIds} onChange={setBrandIds} disabled={loadingCategories}/></div>
            <div className="space-y-2"><Label>Categories</Label><MultiSelectDropdown label="Categories" allLabel="All categories" options={categories} values={categoryIds} onChange={setCategoryIds} disabled={loadingCategories}/></div>
            <div className="space-y-2"><Label htmlFor="quote-quantity">Quantity <span className="text-destructive">*</span></Label><Input id="quote-quantity" name="quantity" type="number" inputMode="numeric" min={1} max={1000000} required defaultValue={1} className="h-11"/></div>
          </div>
          <div className="space-y-2"><Label htmlFor="quote-call-time">Suitable date and time for a call <span className="text-destructive">*</span></Label><DateTimePicker id="quote-call-time" value={preferredCallAt} onChange={setPreferredCallAt} placeholder="Choose a date and time"/></div>
          <div className="space-y-2"><Label htmlFor="quote-notes">Tell us more <span className="text-muted-foreground">(optional)</span></Label><Textarea id="quote-notes" name="notes" maxLength={1000} placeholder="Product preferences, delivery needs, or other details…" className="min-h-28 resize-y"/></div>
          <Button type="submit" disabled={submitting || loadingCategories || !preferredCallAt} className="h-12 w-full gap-2 bg-[#244d32] text-white hover:bg-[#1c3e28]">{submitting ? <LoaderCircle className="size-4 animate-spin"/> : null}{submitting ? "Sending request…" : "Send quote request"}<ArrowRight className="size-4"/></Button>
          <p className="text-center text-xs text-muted-foreground">Your contact details are only used to follow up on this request.</p>
        </form>}
      </div>
    </div>
  </section>;
}
