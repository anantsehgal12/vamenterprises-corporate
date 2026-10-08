"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDownUp, LoaderCircle, Plus, Search, Trash2, Pencil, RefreshCw, Database, Package, X, Eye, Share2, Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/custom/SearchableSelect";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { R2ImageUpload } from "@/components/custom/R2ImageUpload";
import { ProductQuickView } from "@/components/custom/ProductQuickView";
import { PaginationControls } from "@/components/custom/PaginationControls";
import { readOnlyFields, type Field, type TableConfig } from "@/lib/admin-tables";

type Row = Record<string, unknown> & { id: number };
type EnquiryProduct = { product_id?: unknown; product_name?: unknown; quantity?: unknown };
const pretty = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const slugTables = new Set(["categories", "products", "brands"]);
const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");
const enquiryAvatarColors = ["bg-[#e8f5e9] text-[#2e7d32]", "bg-[#fff3e0] text-[#ef6c00]", "bg-[#e3f2fd] text-[#1565c0]", "bg-[#f3e5f5] text-[#7b1fa2]", "bg-[#fce4ec] text-[#c2185b]", "bg-[#e0f2f1] text-[#00796b]", "bg-[#fffde7] text-[#9e7b00]"];
function enquiryInitials(value: unknown) { const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean); return parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase() : (parts[0]?.slice(0, 2) ?? "?").toUpperCase(); }
function enquiryAvatarColor(value: unknown) { const name = String(value ?? ""); const hash = [...name].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 0); return enquiryAvatarColors[hash % enquiryAvatarColors.length]; }
function displayValue(value: unknown) { if (value === null || value === undefined || value === "") return "—"; if (typeof value === "boolean") return value ? "Yes" : "No"; if (typeof value === "object") return JSON.stringify(value); const str = String(value); return str.length > 72 ? `${str.slice(0, 69)}…` : str; }
const withRupee = (value: string) => `₹${value.replace(/^[\s₹]+/, "")}`;
function fieldValue(field: Field, value: unknown) { if (field.name === "special_price") return withRupee(value == null ? "" : String(value)); if (value === null || value === undefined) return ""; if ((field.type === "json" || field.type === "image-list" || field.type === "multi-reference") && typeof value !== "string") return JSON.stringify(value, null, 2); if (field.type === "date") { const d = new Date(String(value)); return Number.isNaN(d.valueOf()) ? String(value) : d.toISOString().slice(0,16); } return String(value); }
function parseIds(value: string | boolean | undefined) { if (typeof value !== "string" || !value) return [] as string[]; try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; } }
function enquiryProducts(value: unknown): EnquiryProduct[] {
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { return []; } }
  return Array.isArray(value) ? value.filter((item): item is EnquiryProduct => Boolean(item) && typeof item === "object") : [];
}
function enquiryProductCell(value: unknown) {
  const items = enquiryProducts(value);
  const details = items.map((product) => `${String(product.product_name ?? "Product")} × ${Number(product.quantity ?? 1)}`).join(", ");
  const words = details.split(/\s+/);
  return <HoverCard><HoverCardTrigger asChild><button type="button" className="block max-w-80 cursor-help truncate text-left text-sm text-foreground">{words.length > 30 ? `${words.slice(0, 30).join(" ")}…` : details || "No product details"}</button></HoverCardTrigger><HoverCardContent className="max-w-sm border-border bg-popover text-popover-foreground shadow-lg"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products in this enquiry</p>{items.length ? <div className="space-y-2">{items.map((product, index) => <div key={`${String(product.product_id ?? index)}-${index}`} className="flex items-start justify-between gap-4 text-sm"><span className="break-words">{String(product.product_name ?? "Product")}</span><span className="shrink-0 font-medium text-muted-foreground">× {Number(product.quantity ?? 1)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No product details recorded.</p>}</HoverCardContent></HoverCard>;
}
function xmlEscape(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
function spreadsheetColumn(index: number) {
  let column = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) column = String.fromCharCode(65 + ((value - 1) % 26)) + column;
  return column;
}
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function concatBytes(chunks: Uint8Array[]) {
  const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
function zipStored(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let localOffset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const checksum = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true); localView.setUint16(10, 0, true); localView.setUint16(12, 33, true);
    localView.setUint32(14, checksum, true); localView.setUint32(18, data.length, true); localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true); localView.setUint16(28, 0, true); local.set(name, 30);
    localChunks.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true); centralView.setUint16(10, 0, true); centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 33, true); centralView.setUint32(16, checksum, true); centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true); centralView.setUint16(28, name.length, true); centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true); centralView.setUint16(34, 0, true); centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true); centralView.setUint32(42, localOffset, true); central.set(name, 46);
    centralChunks.push(central);
    localOffset += local.length + data.length;
  }
  const centralDirectory = concatBytes(centralChunks);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(4, 0, true); endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true); endView.setUint32(16, localOffset, true); endView.setUint16(20, 0, true);
  return concatBytes([...localChunks, centralDirectory, end]);
}
function makeXlsx(rows: unknown[][]) {
  const sheetRows = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    const address = `${spreadsheetColumn(columnIndex)}${rowIndex + 1}`;
    return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
  }).join("")}</row>`).join("");
  return zipStored([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Bulk Enquiries" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { name: "xl/worksheets/sheet1.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>` },
  ]);
}
function primaryProductImage(value: unknown): string | null {
  let images = value;
  if (typeof images === "string") {
    const imageValue = images;
    try { images = JSON.parse(imageValue); } catch { return imageValue.trim() || null; }
  }
  if (!Array.isArray(images) || images.length === 0) return null;
  const primary = images.find((image) => image && typeof image === "object" && ((image as Record<string, unknown>).is_primary === true || (image as Record<string, unknown>).isPrimary === true)) ?? images[0];
  if (typeof primary === "string") return primary;
  if (primary && typeof primary === "object") {
    const image = primary as Record<string, unknown>;
    const url = image.url ?? image.src ?? image.image_url;
    return typeof url === "string" && url.trim() ? url : null;
  }
  return null;
}

export function AdminDataPage({ table, config }: { table: string; config: TableConfig }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]); const [enumOptions, setEnumOptions] = useState<Record<string, string[]>>({}); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState(12); const [sort, setSort] = useState<{key:string;desc:boolean}|null>(null);
  const [open, setOpen] = useState(false); const [active, setActive] = useState<Row|null>(null); const [form, setForm] = useState<Record<string,string|boolean>>({}); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState("");
  const [viewing, setViewing] = useState<Row | null>(null); const [updatingStockId, setUpdatingStockId] = useState<number | null>(null); const [updatingActiveId, setUpdatingActiveId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null); const [deleting, setDeleting] = useState(false); const [deleteError, setDeleteError] = useState("");
  const [shareUrl, setShareUrl] = useState(""); const [shareCopied, setShareCopied] = useState(false); const [shareCopyError, setShareCopyError] = useState("");
  const [catalogueTab, setCatalogueTab] = useState<"all" | "drafts" | "published">("all");
  const [requirementsTab, setRequirementsTab] = useState<"catalogue" | "general">("catalogue");
  const [referenceOptions, setReferenceOptions] = useState<Record<string, { value: string; label: string; logoUrl?: string | null }[]>>({});
  const [tagDraft, setTagDraft] = useState(""); const [slugManual, setSlugManual] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const res = await fetch(`/api/admin/${table}`, { cache: "no-store" }); const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Could not load records."); setRows(data.rows); setEnumOptions(data.enumOptions ?? {}); } catch (e) { setError(e instanceof Error ? e.message : "Could not load records."); } finally { setLoading(false); } }, [table]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!open && !viewing && table !== "products") return;
    const relationships = [...new Set(config.fields.flatMap((field) => field.relationship ? [field.relationship.table] : []))];
    for (const refTable of relationships) {
      if (referenceOptions[refTable]) continue;
      void fetch(`/api/admin/${refTable}`, { cache: "no-store" }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? `Could not load ${refTable}.`);
        const matching = config.fields.filter((field) => field.relationship?.table === refTable);
        const options = (result.rows as Row[]).map((row) => {
          const field = matching[0];
          const primary = String(row[field.relationship!.label] ?? `Record ${row.id}`);
          const secondary = field.relationship!.secondary ? String(row[field.relationship!.secondary] ?? "") : "";
          return { value: String(row.id), label: `${primary}${secondary ? ` · ${secondary}` : ""}`, logoUrl: typeof row.logo_url === "string" ? row.logo_url : null };
        });
        setReferenceOptions((current) => ({ ...current, [refTable]: options }));
      }).catch(() => setReferenceOptions((current) => ({ ...current, [refTable]: [] })));
    }
  }, [open, viewing, config.fields, referenceOptions]);
  const visible = useMemo(() => { let result = [...rows]; if (table === "catalogue_links" && catalogueTab === "drafts") result = result.filter((row) => !Boolean(row.is_active)); if (table === "catalogue_links" && catalogueTab === "published") result = result.filter((row) => Boolean(row.is_active)); if (table === "bulk_queries") result = result.filter((row) => String(row.query_type ?? "catalogue") === requirementsTab); const term = search.trim().toLowerCase(); if (term) result = result.filter((row) => Object.values(row).some((value) => displayValue(value).toLowerCase().includes(term))); if (sort) result.sort((a,b)=>{const av=a[sort.key];const bv=b[sort.key];const cmp=av==null?1:bv==null?-1:typeof av==="number"&&typeof bv==="number"?av-bv:String(av).localeCompare(String(bv));return sort.desc?-cmp:cmp;}); return result; }, [rows, search, sort, table, catalogueTab, requirementsTab]);
  const pageRows = visible.slice(page * pageSize, (page + 1) * pageSize); const columns = table === "categories" ? [config.fields.find((field) => field.name === "name"), config.fields.find((field) => field.name === "slug")].filter((field): field is Field => Boolean(field)) : table === "brands" ? [config.fields.find((field) => field.name === "name"), config.fields.find((field) => field.name === "slug")].filter((field): field is Field => Boolean(field)) : table === "products" ? [config.fields.find((field) => field.name === "name"), config.fields.find((field) => field.name === "slug"), config.fields.find((field) => field.name === "brand_id"), config.fields.find((field) => field.name === "mrp")].filter((field): field is Field => Boolean(field)) : table === "bulk_queries" ? (requirementsTab === "general" ? ["name", "company_name", "contact_no", "email", "brand_names", "category_names", "quantity", "preferred_call_time_label", "notes"] : ["name", "company_name", "contact_no", "email", "preferred_call_time_label"]).map((name) => name === "brand_names" ? { name, label: "Brands" } as Field : name === "category_names" ? { name, label: "Categories" } as Field : name === "preferred_call_time_label" ? { name, label: "Call date & time" } as Field : config.fields.find((field) => field.name === name)).filter((field): field is Field => Boolean(field)) : config.fields.slice(0, 5);
  useEffect(() => setPage(0), [search, catalogueTab, requirementsTab]);
  useEffect(() => setPage((current) => Math.min(current, Math.max(0, Math.ceil(visible.length / pageSize) - 1))), [visible.length, pageSize]);
  function create() { setActive(null); setTagDraft(""); setSlugManual(false); setForm(Object.fromEntries(config.fields.filter((field) => !readOnlyFields.has(field.name)).map((field) => [field.name, field.name === "slug" ? (slugTables.has(table) ? "" : `${table.replaceAll("_", "-")}-${crypto.randomUUID().slice(0, 8)}`) : field.type === "boolean" ? field.name === "is_active" : field.type === "json" || field.type === "multi-reference" || field.type === "image-list" ? "[]" : field.name === "special_price" ? "₹" : field.name === "quantity" ? "" : field.name === "view_count" || field.name === "sort_order" ? "0" : field.name === "stock_status" ? "in_stock" : field.name === "status" ? "new" : field.name === "default_sort" ? "newest" : ""]))); setNotice(""); setOpen(true); }
  function edit(row: Row) { setActive(row); setTagDraft(""); setSlugManual(true); setForm(Object.fromEntries(config.fields.filter((field) => !readOnlyFields.has(field.name)).map((field) => [field.name, field.type === "boolean" ? Boolean(row[field.name]) : fieldValue(field, row[field.name])]))); setNotice(""); setOpen(true); }
  async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setNotice(""); const body: Record<string,unknown> = {}; for (const field of config.fields) { if (readOnlyFields.has(field.name)) continue; const value = form[field.name]; if (field.type === "boolean") body[field.name] = Boolean(value); else if (field.name === "slug") body.slug = String(value ?? "").trim(); else if (field.name === "special_price") { const rest = String(value ?? "").replace(/^[\s₹]+/, "").trim(); if (rest) body.special_price = `₹${rest}`; else if (active) body.special_price = null; } else if (field.name === "tags" && (!value || !String(value).trim() || String(value).trim() === "[]")) body.tags = []; else if (typeof value === "string" && value.trim() !== "") body[field.name] = field.type === "number" ? Number(value) : value; else if (active) body[field.name] = null; } try { const res=await fetch(`/api/admin/${table}${active?`/${active.id}`:""}`,{method:active?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error??"Unable to save changes.");setOpen(false);setRows((current)=>active?current.map((r)=>r.id===active.id?{...r,...data.row,...(table==="brands"?{product_count:r.product_count??0}:{})}:r):[{...data.row,...(table==="brands"?{product_count:0}:{})},...current]);setNotice(active?"Changes saved":"Record created"); } catch(e) { setNotice(e instanceof Error?e.message:"Unable to save changes."); } finally { setSaving(false); } }
  async function updateStockStatus(row: Row, stockStatus: string) { setUpdatingStockId(row.id); setError(""); try { const response = await fetch(`/api/admin/${table}/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock_status: stockStatus }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to update stock status."); setRows((current) => current.map((item) => item.id === row.id ? data.row : item)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to update stock status."); } finally { setUpdatingStockId(null); } }
  async function updateActiveStatus(row: Row, isActive: boolean) {
    const previous = Boolean(row.is_active);
    setUpdatingActiveId(row.id); setError("");
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_active: isActive } : item));
    try {
      const response = await fetch(`/api/admin/${table}/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: isActive }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update product status.");
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, ...data.row } : item));
    } catch (e) {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_active: previous } : item));
      setError(e instanceof Error ? e.message : "Unable to update product status.");
    } finally { setUpdatingActiveId(null); }
  }
  function shareCatalogue(row: Row) { setShareUrl(`${window.location.origin}/catalogue/${encodeURIComponent(String(row.slug ?? ""))}`); setShareCopied(false); setShareCopyError(""); }
  async function copyShareUrl() { try { await navigator.clipboard.writeText(shareUrl); setShareCopied(true); setShareCopyError(""); } catch { setShareCopyError("Copy was blocked. Select the link above and copy it manually."); } }
  function exportEnquiries() {
    const isGeneral = requirementsTab === "general";
    const workbookRows = [
      isGeneral ? ["Name", "Company Name", "Contact", "Email", "Brands", "Categories", "Quantity", "Call date & time", "Message"] : ["Name", "Company Name", "Contact", "Email", "Product Detail", "Call date & time", "Message"],
      ...visible.map((row) => [
        row.name,
        row.company_name,
        row.contact_no,
        row.email,
        ...(isGeneral ? [row.brand_names, row.category_names, row.quantity] : [enquiryProducts(row.products).map((product) => `${String(product.product_name ?? "Product")} × ${Number(product.quantity ?? 1)}`).join("; ")]),
        row.preferred_call_time_label ?? row.preferred_call_time,
        row.notes,
      ]),
    ];
    const workbook = makeXlsx(workbookRows);
    const file = new Blob([workbook.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(file);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    const today = new Date();
    const dateStamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    downloadLink.download = `bulk-enquiries-${dateStamp}.xlsx`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function remove() { if (!deleteTarget) return; setDeleting(true); setDeleteError(""); setError(""); try { const res = await fetch(`/api/admin/${table}/${deleteTarget.id}`, { method: "DELETE" }); const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Unable to delete record."); setRows((current) => current.filter((item) => item.id !== deleteTarget.id)); setNotice("Record deleted"); setDeleteTarget(null); } catch (e) { setDeleteError(e instanceof Error ? e.message : "Unable to delete record."); } finally { setDeleting(false); } }
  const canCreate = config.allowCreate !== false; const canEdit = config.allowEdit !== false; const canDelete = config.allowDelete !== false;
  function uniqueSlug(name: string) {
    const base = slugify(name);
    if (!base) return "";
    const taken = new Set(rows.filter((row) => row.id !== active?.id).map((row) => String(row.slug ?? "")));
    let candidate = base; let suffix = 2;
    while (taken.has(candidate)) candidate = `${base}-${suffix++}`;
    return candidate;
  }
  function renderField(field: Field) {
    const value = form[field.name];
    const label = table === "products" && field.name === "brand_id" ? "Brand name"
      : table === "products" && field.name === "category_id" ? "Category name"
      : table === "products" && field.name === "is_active" ? "Active status"
      : field.label ?? pretty(field.name);
    const options = field.relationship ? referenceOptions[field.relationship.table] ?? [] : [];
    const setValue = (next: string | boolean) => setForm((current) => ({ ...current, [field.name]: next, ...(slugTables.has(table) && field.name === "name" && !slugManual && typeof next === "string" ? { slug: uniqueSlug(next) } : {}) }));
    let control;
    if (table === "products" && field.name === "tags") {
      const tags = parseIds(value);
      const addTag = () => {
        const next = tagDraft.trim().replace(/,$/, "");
        if (next && !tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) setValue(JSON.stringify([...tags, next]));
        setTagDraft("");
      };
      control = <div className="space-y-2.5"><div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/50">{tags.map((tag) => <Badge key={tag} variant="secondary" className="h-8 gap-1 rounded-md border border-border px-2.5 text-secondary-foreground">{tag}<button type="button" aria-label={`Remove ${tag} tag`} onClick={() => setValue(JSON.stringify(tags.filter((item) => item !== tag)))} className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"><X size={13}/></button></Badge>)}<Input aria-label="Add a product tag" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); } if (event.key === "Backspace" && !tagDraft && tags.length) setValue(JSON.stringify(tags.slice(0, -1))); }} onBlur={addTag} placeholder={tags.length ? "Add another tag…" : "Type a tag and press Enter"} className="h-8 min-w-40 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0" /></div><p className="text-xs text-muted-foreground">Press Enter or comma to add each tag.</p></div>;
    } else if (field.type === "textarea" || field.type === "json") {
      control = <Textarea required={field.required} value={String(value ?? "")} onChange={(event) => setValue(event.target.value)} placeholder={field.type === "json" ? "Example: []" : `Enter ${pretty(field.name).toLowerCase()}`} className="min-h-24 resize-y rounded-lg border-input bg-background px-3.5 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-2"/>;
    } else if (field.type === "enum") {
      control = <Select value={String(value ?? "")} onValueChange={setValue}><SelectTrigger className="w-full rounded-lg border-input bg-background px-4 py-5 text-sm text-foreground shadow-sm focus-visible:ring-2"><SelectValue placeholder={`Choose ${pretty(field.name).toLowerCase()}`}/></SelectTrigger><SelectContent className="border-border bg-popover p-2 text-popover-foreground shadow-lg">{(enumOptions[field.name] ?? field.options ?? []).map((option) => <SelectItem className="min-h-11 rounded-md px-3 py-2.5 pr-10 text-sm" value={option} key={option}>{pretty(option)}</SelectItem>)}</SelectContent></Select>;
    } else if (field.type === "reference") {
      control = <SearchableSelect value={String(value ?? "")} onChange={setValue} options={options} placeholder={`Choose ${label.toLowerCase()}`} searchPlaceholder={`Search ${label.toLowerCase()}...`} noneLabel={field.required ? undefined : "No selection"} />;
    } else if (field.type === "multi-reference") {
      const ids = parseIds(value);
      control = <div className="space-y-2.5"><SearchableSelect value="" onChange={(next) => { if (next && !ids.includes(next)) setValue(JSON.stringify([...ids, next])); }} options={options.filter((option) => !ids.includes(option.value))} placeholder={`Add ${pretty(field.name).toLowerCase()}`} searchPlaceholder={`Search ${pretty(field.name).toLowerCase()}...`} />{ids.length > 0 && <div className="flex flex-wrap gap-2">{ids.map((id) => { const option = options.find((item) => item.value === id); return <Badge key={id} variant="secondary" className="h-8 gap-1.5 rounded-md border border-border px-2.5 text-secondary-foreground">{option?.label ?? `ID ${id}`}<button type="button" aria-label={`Remove ${option?.label ?? id}`} onClick={() => setValue(JSON.stringify(ids.filter((item) => item !== id)))} className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"><X size={13}/></button></Badge>; })}</div>}</div>;
    } else if (field.type === "image" || field.type === "image-list") {
      control = <R2ImageUpload value={String(value ?? "")} multiple={field.type === "image-list"} dropzone={(table === "products" && field.type === "image-list") || (table === "brands" && field.name === "logo_url")} largePreview={table === "brands" && field.name === "logo_url"} folder={table === "brands" || field.name === "brand_logo" || field.name === "brand_favicon" ? "brands" : "products"} onChange={setValue}/>;
    } else if (field.type === "boolean") {
      control = field.name === "is_active" && table === "products" ? <div className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-background px-4 py-3 gap-4"><span className="text-sm text-foreground">{Boolean(value) ? "Visible in catalogue" : "Hidden from catalogue"}</span><Switch checked={Boolean(value)} onCheckedChange={(checked) => setValue(checked)} aria-label="Product active"/> </div> : <span className="flex h-10 items-center gap-2"><input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(event.target.checked)} className="size-4 accent-[#315c3a]"/><span className="text-xs text-muted-foreground">Enabled</span></span>;
    } else {
      control = <><Input type={field.type === "date" ? "datetime-local" : field.type ?? "text"} required={field.required} step={field.type === "number" ? "any" : undefined} value={String(value ?? "")} onChange={(event) => { if (field.name === "slug" && slugTables.has(table)) setSlugManual(event.target.value.trim() !== ""); setValue(field.name === "special_price" ? withRupee(event.target.value) : event.target.value); }} placeholder={field.name === "slug" ? "Leave blank to generate automatically" : `Enter ${label.toLowerCase()}`} className="h-11 rounded-lg border-input bg-background px-3.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-2"/>{field.name === "slug" && (slugTables.has(table) ? <p className="text-xs text-muted-foreground">Generated from the name. You can edit it, or <button type="button" onClick={() => { setSlugManual(false); setForm((current) => ({ ...current, slug: uniqueSlug(String(current.name ?? "")) })); }} className="font-medium text-foreground underline underline-offset-2">regenerate from name</button>.</p> : <p className="text-xs text-muted-foreground">Optional. Leave blank to create a unique slug; you can edit it later.</p>)}</>;
    }
    return <div key={field.name} className={field.type === "textarea" || field.type === "json" || field.type === "image-list" || field.type === "multi-reference" || (table === "brands" && field.name === "logo_url") ? "space-y-2 sm:col-span-2" : "space-y-2"}><span className="block text-xs font-medium text-foreground">{label}{(field.name === "tags" || field.name === "special_price") && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}{field.required && <span className="ml-1 text-destructive">*</span>}</span>{control}</div>;
  }
  function renderProductFields() {
    const editableFields = config.fields.filter((field) => !readOnlyFields.has(field.name));
    const renderNamed = (name: string) => {
      const field = editableFields.find((item) => item.name === name);
      return field ? renderField(field) : null;
    };
    const section = (title: string, description: string, children: React.ReactNode, largeGrid = "") => <section className="space-y-3"><div><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Card className="border-border bg-card shadow-sm"><CardContent className={`grid gap-x-5 gap-y-5 p-4 sm:grid-cols-2 sm:p-5 ${largeGrid}`}>{children}</CardContent></Card></section>;
    return <div className="mx-auto w-full px-8 space-y-6">
      <Card className="border-border bg-card shadow-sm"><CardContent className="flex items-center justify-between gap-4 p- sm:p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Package size={18}/></span><div><h3 className="text-sm font-semibold text-foreground">Catalogue visibility</h3><p className="mt-1 text-xs text-muted-foreground">Control whether shoppers can see this product.</p></div></div><div className="min-w-36">{renderNamed("is_active")}</div></CardContent></Card>
      {section("Product details", "Add a clear name and description for your catalogue.", <>{renderNamed("name")}{renderNamed("slug")}{renderNamed("description")}</>)}
      {section("Pricing & availability", "Set your selling price and an optional special price.", <>{renderNamed("mrp")}{renderNamed("special_price")}{renderNamed("stock_status")}</>, "lg:grid-cols-3")}
      {section("Catalogue organization", "Choose where this product appears and add searchable tags.", <>{renderNamed("brand_id")}{renderNamed("category_id")}{renderNamed("tags")}</>)}
      {section("Product images", "Upload clear product photos. Drag files here or browse your device.", renderNamed("images"))}
    </div>;
  }
  const viewingProduct = viewing ? {
    id: viewing.id,
    name: String(viewing.name ?? "Product"),
    slug: String(viewing.slug ?? ""),
    description: typeof viewing.description === "string" ? viewing.description : null,
    images: viewing.images,
    mrp: viewing.mrp as number | string | null,
    special_price: typeof viewing.special_price === "string" ? viewing.special_price : null,
    stock_status: String(viewing.stock_status ?? "in_stock"),
    is_active: Boolean(viewing.is_active),
    tags: viewing.tags,
    brandName: referenceOptions.brands?.find((option) => option.value === String(viewing.brand_id ?? ""))?.label ?? null,
    brandLogoUrl: referenceOptions.brands?.find((option) => option.value === String(viewing.brand_id ?? ""))?.logoUrl ?? null,
    categoryName: referenceOptions.categories?.find((option) => option.value === String(viewing.category_id ?? ""))?.label ?? null,
  } : null;
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs text-black/40"><span>Data management</span><span>/</span><span className="text-[#426849]">{config.label}</span></div><h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{config.label}</h1><p className="mt-1.5 text-sm text-black/50">{config.description}</p></div>{canCreate&&<Button onClick={()=>table === "catalogue_links" ? router.push("/admin/catalogue-links/new") : create()} className="h-10 gap-2 rounded-lg bg-[#244d32] px-4 text-white hover:bg-[#1c3e28]"><Plus size={16}/>Add {config.label.replace(/s$/,"")}</Button>}</div>
    {(error||notice)&&<div className={`rounded-lg border px-4 py-3 text-sm ${error?"border-red-200 bg-red-50 text-red-700":"border-[#d7e5d6] bg-[#eff5ee] text-[#315c3a]"}`}>{error||notice}</div>}
    {table === "bulk_queries" && <Tabs value={requirementsTab} onValueChange={(value) => setRequirementsTab(value as "catalogue" | "general")} className="w-full"><TabsList className="h-11 w-full justify-start gap-1 rounded-none border-b border-border bg-background px-4 sm:px-5"><TabsTrigger value="catalogue" className="px-4">Catalogue Links <span className="ml-1 text-xs text-muted-foreground">{rows.filter((row) => String(row.query_type ?? "catalogue") === "catalogue").length}</span></TabsTrigger><TabsTrigger value="general" className="px-4">General Requirements <span className="ml-1 text-xs text-muted-foreground">{rows.filter((row) => row.query_type === "general").length}</span></TabsTrigger></TabsList></Tabs>}
    {table === "catalogue_links" && <Tabs value={catalogueTab} onValueChange={(value) => setCatalogueTab(value as "all" | "drafts" | "published")} className="w-full"><TabsList className="h-11 w-full justify-start gap-1 rounded-none border-b border-border bg-background px-4 sm:px-5"><TabsTrigger value="all" className="max-w-40 px-4">All catalogues <span className="ml-1 text-xs text-muted-foreground">{rows.length}</span></TabsTrigger><TabsTrigger value="drafts" className="max-w-40 px-4">Drafts <span className="ml-1 text-xs text-muted-foreground">{rows.filter((row) => !Boolean(row.is_active)).length}</span></TabsTrigger><TabsTrigger value="published" className="max-w-40 px-4">Published <span className="ml-1 text-xs text-muted-foreground">{rows.filter((row) => Boolean(row.is_active)).length}</span></TabsTrigger></TabsList></Tabs>}
    <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_2px_10px_-8px_rgba(0,0,0,.18)]"><div className="flex flex-col justify-between gap-3 border-b border-black/[0.06] p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">{table === "catalogue_links" ? catalogueTab === "drafts" ? "Draft catalogues" : catalogueTab === "published" ? "Published catalogues" : "All catalogues" : table === "bulk_queries" ? requirementsTab === "general" ? "General Requirements" : "Catalogue Links" : `All ${config.label.toLowerCase()}`}</p><p className="mt-0.5 text-xs text-black/40">{visible.length} {visible.length===1?"record":"records"}{rows.length>=500?" · latest 500 loaded":""}</p></div><div className="flex flex-wrap items-center gap-2"><div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={`Search ${requirementsTab === "general" && table === "bulk_queries" ? "general requirements" : config.label.toLowerCase()}...`} className="h-9 rounded-lg border-black/10 pl-9"/></div>{table === "bulk_queries" && <Button type="button" variant="outline" onClick={exportEnquiries} disabled={!visible.length} className="h-9 gap-2 border-border px-3 text-foreground"><Download className="size-4"/><span>Export to Excel</span></Button>}<Button aria-label="Refresh" variant="outline" size="icon" onClick={load} className="h-9 w-9 rounded-lg border-black/10"><RefreshCw size={15} className={loading?"animate-spin":""}/></Button></div></div>
      {loading?<div className="grid min-h-64 place-items-center text-sm text-black/45"><span className="flex items-center gap-2"><LoaderCircle size={17} className="animate-spin"/>Loading records…</span></div>:error&&!rows.length?<div className="grid min-h-64 place-items-center px-6 text-center"><div><Database className="mx-auto size-7 text-black/20"/><p className="mt-3 text-sm font-medium">Unable to load this table</p><p className="mt-1 text-xs text-black/45">{error}</p></div></div>:pageRows.length===0?<div className="grid min-h-64 place-items-center px-6 text-center"><div><Database className="mx-auto size-7 text-black/20"/><p className="mt-3 text-sm font-medium">{search?"No matching records":"Nothing here yet"}</p><p className="mt-1 text-xs text-black/45">{search?"Try another search term.":canCreate?"Add your first record to get started.":"Activity will appear here as shoppers use your catalogues."}</p></div></div>:<Table><TableHeader><TableRow className="bg-[#fafbf9] hover:bg-[#fafbf9]">{table !== "bulk_queries" && <TableHead className={`${table === "brands" ? "w-24" : "w-16"} pl-5 text-[11px] uppercase tracking-wide text-black/40`}>{table === "products" ? "Image" : table === "brands" ? "Logo" : "ID"}</TableHead>}{table === "bulk_queries" && <TableHead className="w-12" aria-label="Customer initials"/>}{columns.map((field)=><TableHead key={field.name} className="text-[11px] uppercase tracking-wide text-black/40"><button onClick={()=>setSort((current)=>current?.key===field.name?{key:field.name,desc:!current.desc}:{key:field.name,desc:false})} className="inline-flex items-center gap-1.5">{table === "bulk_queries" && field.name === "contact_no" ? "Contact" : field.label??pretty(field.name)}<ArrowDownUp size={11}/></button></TableHead>)}{table === "bulk_queries" && requirementsTab === "catalogue" && <TableHead className="min-w-72 text-[11px] uppercase tracking-wide text-black/40">Product Detail</TableHead>}{table === "brands" && <TableHead className="w-32 text-[11px] uppercase tracking-wide text-black/40">Products</TableHead>}{table === "products" && <TableHead className="w-40 text-[11px] uppercase tracking-wide text-black/40">Stock status</TableHead>}{table === "products" && <TableHead className="w-24 text-[11px] uppercase tracking-wide text-black/40">Active</TableHead>}<TableHead className="w-48 pr-5 text-right text-[11px] uppercase tracking-wide text-black/40">Actions</TableHead></TableRow></TableHeader><TableBody>{pageRows.map((row)=><TableRow key={row.id} className={table === "brands" ? "h-24" : table === "bulk_queries" ? "h-[72px]" : "h-[58px]"}>{table !== "bulk_queries" && <TableCell className="pl-5">{table === "products" ? (() => { const src = primaryProductImage(row.images); return src ? <Image src={src} alt={`${String(row.name ?? "Product")} image`} width={44} height={44} unoptimized className="size-11 rounded-md border border-border object-cover" /> : <span className="grid size-11 place-items-center rounded-md border border-border bg-muted text-muted-foreground"><Package size={17}/></span>; })() : table === "brands" ? row.logo_url ? <Image src={String(row.logo_url)} alt={`${String(row.name ?? "Brand")} logo`} width={72} height={72} unoptimized className="size-[72px] rounded-xl border border-border bg-white object-contain p-2" /> : <span className="grid size-[72px] place-items-center rounded-xl border border-border bg-muted text-lg font-semibold uppercase text-muted-foreground">{String(row.name ?? "B").slice(0, 1)}</span> : <span className="font-mono text-xs text-black/40">{row.id}</span>}</TableCell>}{table === "bulk_queries" && <TableCell className="w-12 pl-4"><span aria-label={`${String(row.name ?? "Customer")} initials`} className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${enquiryAvatarColor(row.name)}`}>{enquiryInitials(row.name)}</span></TableCell>}{columns.map((field)=><TableCell key={field.name} className={table === "products" && field.name === "name" ? "min-w-[320px] max-w-[440px] text-[13px]" : table === "bulk_queries" && field.name === "preferred_call_time_label" ? "min-w-[230px] whitespace-nowrap text-[13px]" : "max-w-[210px] truncate text-[13px]"}>{table === "bulk_queries" && field.name === "status" ? <Badge variant="outline" className="border-brand-accent/30 bg-brand-accent/10 text-brand-accent">{pretty(String(row.status ?? "new"))}</Badge> : table === "bulk_queries" && field.name === "created_at" ? (() => { const date = new Date(String(row.created_at ?? "")); return Number.isNaN(date.valueOf()) ? "—" : <time dateTime={date.toISOString()}>{date.toLocaleString()}</time>; })() : field.type==="boolean"?<Badge variant={row[field.name]?"secondary":"outline"} className={row[field.name]?"bg-[#edf4eb] text-[#315c3a]":"text-black/45"}>{row[field.name]?"Active":"No"}</Badge>:field.name === "slug" || field.name === "name" ? (() => { const text = String(row[field.name] ?? ""); const isSlug = field.name === "slug"; const parts = text.split(isSlug ? /[-\s]+/ : /\s+/).filter(Boolean); const preview = parts.length > 30 ? `${parts.slice(0, 30).join(isSlug ? "-" : " ")}…` : text; return <HoverCard><HoverCardTrigger asChild><span className="cursor-help">{preview}</span></HoverCardTrigger><HoverCardContent className="max-w-sm break-words border-border bg-popover text-sm text-popover-foreground shadow-lg">{text || "—"}</HoverCardContent></HoverCard>; })() : <span title={typeof row[field.name]==="object"?JSON.stringify(row[field.name]):String(row[field.name]??"")}>{field.name === "brand_id" ? referenceOptions.brands?.find((option) => option.value === String(row.brand_id ?? ""))?.label ?? "—" : displayValue(row[field.name])}</span>}</TableCell>)}{table === "bulk_queries" && requirementsTab === "catalogue" && <TableCell className="min-w-72">{enquiryProductCell(row.products)}</TableCell>}{table === "brands" && <TableCell><span className="inline-flex min-w-9 items-center justify-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{Number(row.product_count ?? 0)}</span></TableCell>}{table === "products" && <TableCell><Select value={String(row.stock_status ?? "in_stock")} onValueChange={(value) => void updateStockStatus(row, value)} disabled={updatingStockId === row.id}><SelectTrigger aria-label={`Stock status for ${String(row.name ?? "product")}`} className="h-9 w-36 rounded-lg border-border bg-background px-3 text-xs"><SelectValue/></SelectTrigger><SelectContent className="border-border bg-popover text-popover-foreground">{(enumOptions.stock_status ?? ["in_stock", "out_of_stock", "pre_order"]).map((status) => <SelectItem key={status} value={status}>{pretty(status)}</SelectItem>)}</SelectContent></Select></TableCell>}{table === "products" && <TableCell><Switch checked={Boolean(row.is_active)} onCheckedChange={(checked) => void updateActiveStatus(row, checked)} disabled={updatingActiveId === row.id} aria-label={`${row.is_active ? "Deactivate" : "Activate"} ${String(row.name ?? "product")}`}/></TableCell>}<TableCell className="pr-4"><div className="flex items-center justify-end gap-1.5 whitespace-nowrap">{table === "products" && <Button variant="ghost" size="sm" onClick={() => setViewing(row)} aria-label={`Quick view ${String(row.name ?? "product")}`} title="Quick view" className="h-8 gap-1 px-2"><Eye size={15}/><span>View</span></Button>}{table === "catalogue_links" && <Button variant="ghost" size="sm" onClick={() => void shareCatalogue(row)} aria-label={`Share catalogue ${String(row.slug ?? row.id)}`} className="h-8 gap-1 px-2"><Share2 size={14}/><span>Share</span></Button>}{canEdit&&<Button variant="ghost" size="sm" onClick={()=>table === "catalogue_links" ? router.push(`/admin/catalogue-links/${row.id}/edit`) : edit(row)} aria-label={`Edit ${String(row.name ?? "record")}`} className="h-8 gap-1 px-2"><Pencil size={14}/><span>Edit</span></Button>}{canDelete&&<Button variant="ghost" size="sm" onClick={()=>{setDeleteError("");setDeleteTarget(row);}} aria-label={`Delete ${String(row.name ?? "record")}`} className="h-8 gap-1 px-2 text-destructive hover:text-destructive"><Trash2 size={14}/><span>Delete</span></Button>}</div></TableCell></TableRow>)}</TableBody></Table>}
      {!loading && visible.length > 0 && <PaginationControls page={page} pageSize={pageSize} totalItems={visible.length} itemLabel={table === "bulk_queries" ? "enquiries" : table.replaceAll("_", " ")} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(0); }} />}
    </div>
    {table === "bulk_queries" ? null : table === "categories" ? <Dialog open={open} onOpenChange={setOpen}><DialogContent container={typeof document === "undefined" ? undefined : document.getElementById("admin-root") ?? undefined} className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden border-border bg-background p-0 text-foreground sm:max-w-xl"><DialogHeader className="border-b border-border px-6 py-5 pr-16"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#67816a]">{active?`Category #${active.id}`:"New category"}</p><DialogTitle className="text-xl">{active?"Edit category":"Add category"}</DialogTitle><DialogDescription>{config.description}</DialogDescription></DialogHeader><form onSubmit={save} className="flex min-h-0 flex-1 flex-col"><div className="grid flex-1 content-start gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">{config.fields.filter((field)=>!readOnlyFields.has(field.name)).map(renderField)}</div><div className="flex flex-col-reverse gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-between"><Button type="button" variant="outline" onClick={()=>setOpen(false)} className="h-10 rounded-lg">Cancel</Button><Button disabled={saving} type="submit" className="h-10 rounded-lg bg-[#244d32] px-5 text-white hover:bg-[#1c3e28]">{saving&&<LoaderCircle size={15} className="animate-spin"/>}{saving?"Saving…":active?"Save changes":"Create category"}</Button></div></form></DialogContent></Dialog> : <Drawer direction="right" open={open} onOpenChange={setOpen}><DrawerContent className="!h-full !max-h-none !w-full gap-0 overflow-hidden rounded-l-2xl border-border bg-background p-0 text-foreground data-[vaul-drawer-direction=right]:max-h-none sm:!w-[min(95vw,960px)] sm:!max-w-none"><DrawerHeader className="relative shrink-0 border-b border-border px-6 py-5 pr-14"><DrawerClose asChild><Button type="button" variant="ghost" size="icon" aria-label="Close form" className="absolute right-4 top-4"><X size={16}/></Button></DrawerClose><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#67816a]">{active?`Record #${active.id}`:"New record"}</p><DrawerTitle className="text-xl">{active?`Edit ${config.label.replace(/s$/ ,"")}`:`Add ${config.label.replace(/s$/ ,"")}`}</DrawerTitle><DrawerDescription>{config.description}</DrawerDescription></DrawerHeader><form onSubmit={save} className="flex min-h-0 flex-1 flex-col"><div className={`my-4 grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto ${table === "products" ? "sm:grid-cols-1" : "px-6 py-5 sm:grid-cols-2"}`}>{table === "products" ? renderProductFields() : config.fields.filter((field)=>!readOnlyFields.has(field.name)).map(renderField)}</div><DrawerFooter className="mt-auto shrink-0 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-between"><Button type="button" variant="outline" onClick={()=>setOpen(false)} className="h-10 rounded-lg">Cancel</Button><Button disabled={saving} type="submit" className="h-10 rounded-lg bg-[#244d32] px-5 text-white hover:bg-[#1c3e28]">{saving&&<LoaderCircle size={15} className="animate-spin"/>}{saving?"Saving…":active?"Save changes":"Create record"}</Button></DrawerFooter></form></DrawerContent></Drawer>}
    <Dialog open={Boolean(shareUrl)} onOpenChange={(nextOpen) => { if (!nextOpen) setShareUrl(""); }}><DialogContent container={typeof document === "undefined" ? undefined : document.getElementById("admin-root") ?? undefined} className="w-[calc(100%-2rem)] max-w-md border-border bg-background text-foreground"><DialogHeader className="items-center text-center"><span className="mb-2 grid size-12 place-items-center rounded-full bg-brand-accent/10 text-brand-accent"><Check className="size-6"/></span><DialogTitle>Catalogue ready to share</DialogTitle><DialogDescription>Copy this link and send it to your customer.</DialogDescription></DialogHeader><div className="space-y-2"><div className="flex min-w-0 gap-2"><Input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} aria-label="Catalogue share link" className="min-w-0 bg-muted/50 text-foreground"/><Button type="button" onClick={() => void copyShareUrl()} className="shrink-0 gap-2 bg-[#244d32] text-white hover:bg-[#1c3e28]">{shareCopied ? <Check className="size-4"/> : <Copy className="size-4"/>}{shareCopied ? "Copied" : "Copy"}</Button></div>{shareCopyError && <p role="alert" className="text-xs text-destructive">{shareCopyError}</p>}</div></DialogContent></Dialog>
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => { if (!nextOpen && !deleting) { setDeleteTarget(null); setDeleteError(""); } }}><AlertDialogContent className="border-border bg-background text-foreground"><AlertDialogHeader><AlertDialogTitle>Delete this record?</AlertDialogTitle><AlertDialogDescription>This will permanently delete “{String(deleteTarget?.name ?? deleteTarget?.slug ?? (deleteTarget ? `#${deleteTarget.id}` : "record"))}”. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>{deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleting} onClick={() => { setDeleteTarget(null); setDeleteError(""); }} className="border-border bg-background text-foreground">Cancel</AlertDialogCancel><Button type="button" variant="destructive" onClick={() => void remove()} disabled={deleting} className="gap-2">{deleting && <LoaderCircle className="size-4 animate-spin"/>}{deleting ? "Deleting…" : "Delete"}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <ProductQuickView open={Boolean(viewing)} onOpenChange={(nextOpen) => { if (!nextOpen) setViewing(null); }} product={viewingProduct} />
  </div>;
}