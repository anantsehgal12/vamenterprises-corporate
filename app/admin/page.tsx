import Link from "next/link";
import { ArrowUpRight, Boxes, ClipboardList, CirclePlus, FolderTree, Link2, Package, Settings2, Tags } from "lucide-react";
import { AdminDashboardAnalytics } from "@/components/custom/AdminDashboardAnalytics";

const quickLinks = [
  ["/admin/catalogue-links/new", CirclePlus, "Create catalogue", "Choose products and make a new shareable catalogue."],
  ["/admin/products", Package, "Products", "Update product information, prices and availability."],
  ["/admin/brands", Tags, "Brands", "Manage brands and their product associations."],
  ["/admin/categories", FolderTree, "Categories", "Organize products into easy-to-browse collections."],
  ["/admin/catalogue-links", Link2, "Catalogue links", "Manage drafts and published catalogues."],
  ["/admin/bulk-queries", ClipboardList, "Requirements", "Review catalogue enquiries and quote requests."],
  ["/admin/settings", Settings2, "Settings", "Update company profile and storefront details."],
] as const;
export default function AdminHome() {
  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-2xl bg-[#244d32] px-7 py-8 text-white sm:px-10 sm:py-10"><div className="absolute -right-12 -top-28 size-80 rounded-full border border-white/[0.08]"/><div className="absolute -right-2 -top-20 size-60 rounded-full border border-white/[0.08]"/><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-white/55">Catalogue control center</p><h1 className="mt-3 max-w-xl text-3xl font-medium tracking-tight sm:text-[38px]">Everything your catalogue needs, in one place.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Manage inventory, share product catalogues and keep enquiries moving.</p><Link href="/admin/products" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#244d32] transition hover:bg-[#eef3ed]">Open products <ArrowUpRight size={15}/></Link></section>
    <AdminDashboardAnalytics />
    <section><div className="mb-4"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand-accent">Quick links</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Admin workspace</h2><p className="mt-1 text-sm text-muted-foreground">Jump directly to any admin area.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{quickLinks.map(([href, Icon, title, description])=><Link href={href} key={href} className="group rounded-xl border border-border bg-card p-5 text-card-foreground transition hover:-translate-y-0.5 hover:border-brand-accent/40 hover:shadow-[0_8px_24px_-16px_rgba(20,55,28,.3)]"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-brand-accent/10 text-brand-accent"><Icon size={17}/></span><ArrowUpRight size={15} className="text-muted-foreground/60 transition group-hover:text-brand-accent"/></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p></Link>)}</div></section>
  </div>;
}
