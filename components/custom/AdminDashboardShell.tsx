"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Link2,
  Package,
  Settings2,
  Tags,
  CirclePlus,
} from "lucide-react";
import Logo from "@/assets/logo_ico.png";
import DarkModeToggle from "@/components/custom/DarkModeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { adminTables } from "@/lib/admin-tables";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/custom/ThemeProvider";

const tableItems = [
  ["products", Package],
  ["brands", Tags],
  ["categories", FolderTree],
  ["catalogue-links", Link2],
  ["catalogue-links/new", CirclePlus],
  ["bulk-queries", ClipboardList],
  ["settings", Settings2],
] as const;

const labels: Record<string, string> = {
  "catalogue-links": adminTables.catalogue_links.label,
  "catalogue-links/new": "New catalogue",
  "bulk-queries": adminTables.bulk_queries.label,
};

export default function AdminDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentSegment = pathname.split("/").filter(Boolean).at(-1) ?? "admin";
  const currentTitle =
    pathname === "/admin"
      ? "Overview"
      : pathname === "/admin/catalogue-links/new"
        ? "Create catalogue"
        : pathname.startsWith("/admin/catalogue-links/")
          ? "Edit catalogue"
          : labels[currentSegment] ?? adminTables[currentSegment]?.label ?? "Overview";

  return (
    <ThemeProvider>
      <TooltipProvider>
        <SidebarProvider
          id="admin-root"
          defaultOpen
          className="min-h-svh bg-background text-foreground"
        >
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader className="p-3">
          <Link
            href="/admin"
            className="flex h-11 items-center gap-3 overflow-hidden rounded-xl px-1 text-sidebar-foreground"
            aria-label="VAM Enterprises admin overview"
          >
            <Image
              src={Logo}
              alt="VAM Enterprises logo"
              width={48}
              height={48}
              priority
              className="size-10 shrink-0 object-contain"
            />
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-semibold tracking-tight">
                VAM Enterprises
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Catalogue admin
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin"}
                    tooltip="Overview"
                  >
                    <Link href="/admin">
                      <LayoutDashboard />
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
              Manage data
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tableItems.map(([slug, Icon]) => {
                  const key = slug.replaceAll("-", "_");
                  const title = labels[slug] ?? adminTables[key]?.label ?? slug;
                  const href = `/admin/${slug}`;
                  return (
                    <SidebarMenuItem key={slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href || (slug === "catalogue-links" && pathname.startsWith("/admin/catalogue-links/") && pathname !== "/admin/catalogue-links/new")}
                        tooltip={title}
                      >
                        <Link href={href}>
                          <Icon />
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="View storefront">
                <Link href="/">
                  <Building2 />
                  <span>View storefront</span>
                  <ArrowUpRight className="ml-auto" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh min-w-0 bg-transparent">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-7">
          <SidebarTrigger className="-ml-1" />
          <span className="hidden text-muted-foreground sm:inline">Admin</span>
          <span className="hidden text-muted-foreground/60 sm:inline">/</span>
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {currentTitle}
          </h1>
          <DarkModeToggle />
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-5 sm:p-8">
          {children}
        </main>
      </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
