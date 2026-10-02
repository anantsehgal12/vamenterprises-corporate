"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, ExternalLink, LoaderCircle, MousePointerClick, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Analytics = {
  summary: { total_views: number; views_30_days: number; total_clicks: number; clicks_30_days: number };
  daily: { date: string; views: number; clicks: number }[];
  popularProducts: { id: number; name: string; clicks: number }[];
  popularLinks: { id: number; slug: string; views: number }[];
};

const number = (value: number) => Number(value || 0).toLocaleString("en-IN");
const dayLabel = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));

export function AdminDashboardAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as Analytics & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load dashboard analytics.");
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load dashboard analytics.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const summary = data?.summary;
  const maxActivity = Math.max(1, ...(data?.daily ?? []).flatMap((item) => [Number(item.views), Number(item.clicks)]));

  return <section aria-labelledby="dashboard-analytics-heading" className="space-y-4">
    <div className="flex items-end justify-between gap-4">
      <div><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#4ca626]">Store performance</p><h2 id="dashboard-analytics-heading" className="mt-1 text-xl font-semibold tracking-tight">Catalogue analytics</h2><p className="mt-1 text-sm text-muted-foreground">Views and product interest across your catalogues.</p></div>
      {loading && <LoaderCircle aria-label="Loading analytics" className="mb-1 size-4 animate-spin text-muted-foreground"/>}
    </div>

    {error ? <Card className="border-destructive/30 bg-card"><CardContent className="py-5 text-sm text-destructive">{error}</CardContent></Card> : loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl"/>)}<Skeleton className="h-64 rounded-xl sm:col-span-2 xl:col-span-4"/></div> : data && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          ["Views · last 30 days", summary?.views_30_days, Eye],
          ["Product clicks · last 30 days", summary?.clicks_30_days, MousePointerClick],
          ["All-time views", summary?.total_views, BarChart3],
          ["All-time product clicks", summary?.total_clicks, Package],
        ] as const).map(([label, value, Icon]) => <Card key={label} className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0"><p className="truncate text-xs font-medium text-muted-foreground">{String(label)}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{number(Number(value))}</p></div>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#4ca626]/10 text-[#4ca626]"><Icon size={18}/></span>
          </CardContent>
        </Card>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Last 14 days</CardTitle><CardDescription>Daily catalogue views and product clicks</CardDescription></CardHeader>
          <CardContent className="pt-3">
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm bg-[#4ca626]"/>Catalogue views</span><span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm bg-primary/40"/>Product clicks</span></div>
            <div className="grid h-36 grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1 sm:gap-2" role="img" aria-label="Bar chart of daily catalogue views and product clicks over the last 14 days">
              {data.daily.map((day) => <div key={day.date} title={`${dayLabel(day.date)}: ${number(Number(day.views))} views, ${number(Number(day.clicks))} clicks`} className="flex h-full min-w-0 items-end justify-center gap-0.5">
                <span className="w-1/2 rounded-t-sm bg-[#4ca626]" style={{ height: `${Math.max(3, Number(day.views) / maxActivity * 100)}%` }}/>
                <span className="w-1/2 rounded-t-sm bg-primary/40" style={{ height: `${Math.max(3, Number(day.clicks) / maxActivity * 100)}%` }}/>
              </div>)}
            </div>
            <div className="mt-2 grid grid-cols-[repeat(14,minmax(0,1fr))] text-center text-[10px] text-muted-foreground">{data.daily.map((day, index) => <span key={day.date}>{[0, 4, 8, 13].includes(index) ? dayLabel(day.date) : ""}</span>)}</div>
            {!data.daily.some((day) => Number(day.views) || Number(day.clicks)) && <p className="mt-3 text-center text-xs text-muted-foreground">No catalogue activity recorded yet.</p>}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Most clicked products</CardTitle><CardDescription>Ranked by product clicks</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {data.popularProducts.length ? data.popularProducts.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.name}</span><Badge variant="secondary" className="shrink-0">{number(Number(item.clicks))}</Badge></div>) : <p className="py-3 text-sm text-muted-foreground">Product click data will appear here.</p>}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Most viewed catalogues</CardTitle><CardDescription>Ranked by catalogue opens</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {data.popularLinks.length ? data.popularLinks.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.slug}</span><Badge variant="secondary" className="shrink-0">{number(Number(item.views))}</Badge><ExternalLink aria-hidden="true" className="size-3.5 text-muted-foreground"/></div>) : <p className="py-3 text-sm text-muted-foreground">Catalogue view data will appear here.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>}
  </section>;
}
