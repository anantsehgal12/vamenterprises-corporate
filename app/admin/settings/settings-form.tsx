"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Check, Globe2, LoaderCircle, MapPin, Phone, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { R2ImageUpload } from "@/components/custom/R2ImageUpload";

type SettingsRecord = { id: number; [key: string]: string | number | null };
type SettingField = { name: string; label: string; placeholder?: string; type?: "text" | "email" | "tel" | "url" | "number" | "image"; wide?: boolean };
type GstProfile = {
  gstin?: string; legal_name?: string; trade_name?: string; status?: string; type?: string; registration_date?: string;
  place_of_business_principal?: { address?: { building_name?: string; street?: string; location?: string; door_num?: string; state?: string; floor_num?: string; lattitude?: string; longitude?: string; district?: string; city?: string | null; pin_code?: string } };
};

const sections: { id: string; title: string; description: string; icon: typeof Building2; fields: SettingField[] }[] = [
  { id: "business", title: "Business profile", description: "The name and brand details shown throughout your catalogue.", icon: Building2, fields: [
    { name: "brand_name", label: "Business name", placeholder: "VAM Enterprises", wide: true },
    { name: "brand_tagline", label: "Tagline", placeholder: "A short line about your business", wide: true },
    { name: "brand_description", label: "About your business", placeholder: "Describe your business", wide: true },
    { name: "brand_logo", label: "Business logo", type: "image", wide: true },
    { name: "brand_favicon", label: "Favicon", type: "image", wide: true },
    { name: "gst_number", label: "GSTIN", placeholder: "15-character GSTIN", wide: true },
  ] },
  { id: "contact", title: "Contact information", description: "How customers can get in touch with your team.", icon: Phone, fields: [
    { name: "contact_number", label: "Primary phone", type: "tel", placeholder: "+91 …" },
    { name: "alternate_contact_number", label: "Alternate phone", type: "tel", placeholder: "+91 …" },
    { name: "whatsapp_number", label: "WhatsApp number", type: "tel", placeholder: "+91 …" },
    { name: "email", label: "Business email", type: "email", placeholder: "hello@example.com" },
    { name: "website", label: "Website", type: "url", placeholder: "https://example.com", wide: true },
  ] },
  { id: "address", title: "Business address", description: "Your location and map details for customer enquiries.", icon: MapPin, fields: [
    { name: "address_line1", label: "Address line 1", placeholder: "Street address", wide: true },
    { name: "address_line2", label: "Address line 2", placeholder: "Building, floor, or suite", wide: true },
    { name: "city", label: "City", placeholder: "City" },
    { name: "state", label: "State", placeholder: "State" },
    { name: "country", label: "Country", placeholder: "India" },
    { name: "pincode", label: "PIN code", placeholder: "PIN code" },
    { name: "latitude", label: "Latitude", type: "number", placeholder: "e.g. 28.6139" },
    { name: "longitude", label: "Longitude", type: "number", placeholder: "e.g. 77.2090" },
    { name: "google_maps_url", label: "Google Maps link", type: "url", placeholder: "https://maps.google.com/…", wide: true },
  ] },
  { id: "social", title: "Social profiles", description: "Link customers to your social and professional channels.", icon: Globe2, fields: [
    { name: "instagram", label: "Instagram", type: "url", placeholder: "https://instagram.com/…" },
    { name: "facebook", label: "Facebook", type: "url", placeholder: "https://facebook.com/…" },
    { name: "youtube", label: "YouTube", type: "url", placeholder: "https://youtube.com/…" },
    { name: "linkedin", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/…" },
    { name: "twitter", label: "X / Twitter", type: "url", placeholder: "https://x.com/…" },
  ] },
];

export default function SettingsForm() {
  const [record, setRecord] = useState<SettingsRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [verifiedGst, setVerifiedGst] = useState<GstProfile | null>(null);
  const [gstError, setGstError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load settings.");
      const current = (data.rows?.[0] ?? null) as SettingsRecord | null;
      setRecord(current);
      setForm(Object.fromEntries(sections.flatMap((section) => section.fields).map(({ name }) => [name, current?.[name] == null ? "" : String(current[name])] )));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load settings."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function verifyGstin() {
    setVerifyingGst(true); setGstError(""); setVerifiedGst(null);
    try {
      const response = await fetch("/api/admin/gst-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gstin: form.gst_number }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "GSTIN verification failed.");
      setVerifiedGst(result.data as GstProfile);
    } catch (cause) { setGstError(cause instanceof Error ? cause.message : "GSTIN verification failed."); }
    finally { setVerifyingGst(false); }
  }

  function applyVerifiedGst() {
    if (!verifiedGst) return;
    const address = verifiedGst.place_of_business_principal?.address;
    const addressLine1 = [address?.door_num, address?.building_name, address?.street, address?.location].filter(Boolean).join(", ");
    setForm((current) => ({
      ...current,
      gst_number: verifiedGst.gstin ?? current.gst_number,
      brand_name: verifiedGst.trade_name || verifiedGst.legal_name || current.brand_name,
      address_line1: addressLine1 || current.address_line1,
      address_line2: address?.floor_num || current.address_line2,
      city: address?.city || address?.district || current.city,
      state: address?.state || current.state,
      pincode: address?.pin_code || current.pincode,
      latitude: address?.lattitude || current.latitude,
      longitude: address?.longitude || current.longitude,
    }));
    setMessage("GST details applied. Save changes to keep them.");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const body: Record<string, string | number | null> = {};
    for (const section of sections) for (const field of section.fields) {
      const value = form[field.name]?.trim() ?? "";
      body[field.name] = value === "" ? null : field.type === "number" ? Number(value) : value;
    }
    try {
      const response = await fetch(`/api/admin/settings${record ? `/${record.id}` : ""}`, {
        method: record ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save settings.");
      setRecord(data.row as SettingsRecord);
      setMessage("Your settings have been saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }

  return <div className="space-y-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span>Workspace</span><span>/</span><span className="text-foreground">Settings</span></div><h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Settings</h1><p className="mt-1.5 max-w-xl text-sm text-muted-foreground">Manage the business details, contact information, and links shown across your catalogue.</p></div>
      <Button form="settings-form" type="submit" disabled={loading || saving} className="h-10 gap-2 rounded-lg bg-[#244d32] px-4 text-white hover:bg-[#1c3e28]"><Save size={15}/>{saving ? "Saving…" : "Save changes"}</Button>
    </div>

    {message && <div role="status" className="flex items-center gap-2 rounded-lg border border-[#cbdcc9] bg-[#eff5ee] px-4 py-3 text-sm text-[#315c3a]"><Check size={16}/>{message}</div>}
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

    <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="hidden space-y-1 lg:sticky lg:top-24 lg:block">
        {sections.map(({ id, title, icon: Icon }) => <a key={id} href={`#${id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"><Icon size={16}/>{title}</a>)}
      </nav>

      <form id="settings-form" onSubmit={save} className="min-w-0 space-y-5">
        {loading ? <Card><CardContent className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle size={17} className="animate-spin"/>Loading settings…</CardContent></Card> : sections.map(({ id, title, description, icon: Icon, fields }) => <Card key={id} id={id} className="scroll-mt-24 ring-1 ring-border/70">
          <CardHeader className="flex grid-cols-[auto_1fr] items-start gap-x-3 border-b border-border/70 pb-4">
            <span className="row-span-2 mt-0.5 grid size-9 place-items-center rounded-lg bg-[#eaf1e8] text-[#315c3a] dark:bg-[#24452f] dark:text-[#d4e5d3]"><Icon size={17}/></span>
            <CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 pt-5 sm:grid-cols-2">
            {fields.map((field) => <div key={field.name} className={field.wide ? "sm:col-span-2" : ""}>
              <Label htmlFor={field.name} className="mb-2 text-xs text-foreground">{field.label}{field.name === "brand_name" && <span className="ml-1 text-destructive">*</span>}</Label>
              {field.type === "image" ? <R2ImageUpload value={form[field.name] ?? ""} folder="brands" onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} /> : field.name === "brand_description" ? <Textarea id={field.name} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="min-h-24 resize-y rounded-lg bg-background" /> : field.name === "gst_number" ? <><div className="flex flex-col gap-2 sm:flex-row"><Input id={field.name} value={form[field.name] ?? ""} onChange={(event) => { setForm((current) => ({ ...current, gst_number: event.target.value.toUpperCase() })); setVerifiedGst(null); setGstError(""); }} placeholder={field.placeholder} className="h-10 rounded-lg bg-background font-mono uppercase" /><Button type="button" variant="outline" onClick={() => void verifyGstin()} disabled={verifyingGst || !form.gst_number?.trim()} className="h-10 shrink-0 rounded-lg"><ShieldCheck size={15}/>{verifyingGst ? "Verifying…" : "Verify GSTIN"}</Button></div>{gstError && <p role="alert" className="mt-2 text-xs text-destructive">{gstError}</p>}{verifiedGst && <div className="mt-3 rounded-lg border border-[#cbdcc9] bg-[#eff5ee] p-4 text-[#263d2a] dark:border-[#365741] dark:bg-[#19291e] dark:text-[#e0ece0]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-sm font-medium"><Check size={15}/>{verifiedGst.status || "GSTIN found"}</span><span className="text-xs text-muted-foreground">{verifiedGst.type || "Registration"}{verifiedGst.registration_date ? ` · Since ${verifiedGst.registration_date}` : ""}</span></div><p className="mt-3 text-sm font-semibold">{verifiedGst.legal_name || verifiedGst.trade_name || verifiedGst.gstin}</p>{verifiedGst.trade_name && verifiedGst.trade_name !== verifiedGst.legal_name && <p className="mt-1 text-xs text-muted-foreground">Trade name: {verifiedGst.trade_name}</p>}<Button type="button" size="sm" onClick={applyVerifiedGst} className="mt-3 h-8 rounded-md bg-[#244d32] text-white hover:bg-[#1c3e28]">Apply business & address details</Button></div>}</> : <Input id={field.name} required={field.name === "brand_name"} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="h-10 rounded-lg bg-background" />}
            </div>)}
          </CardContent>
        </Card>)}
        {!loading && <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><span className="text-xs text-muted-foreground">{record ? `Settings record #${record.id}` : "No settings record yet"}</span><Button type="submit" disabled={saving} className="h-10 gap-2 rounded-lg bg-[#244d32] px-4 text-white hover:bg-[#1c3e28]"><Save size={15}/>{saving ? "Saving…" : "Save settings"}</Button></div>}
      </form>
    </div>
  </div>;
}
