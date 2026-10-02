import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

type SummaryRow = {
  total_views: number;
  views_30_days: number;
  total_clicks: number;
  clicks_30_days: number;
};
type DailyRow = { date: string; views: number; clicks: number };
type ProductRow = { id: number; name: string; clicks: number };
type LinkRow = { id: number; slug: string; views: number };

export async function GET() {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [summaryRows, daily, popularProducts, popularLinks] = await Promise.all([
      sql.query(
        `SELECT
           (SELECT COUNT(*) FROM link_views)::int AS total_views,
           (SELECT COUNT(*) FROM link_views WHERE viewed_at >= NOW() - INTERVAL '30 days')::int AS views_30_days,
           (SELECT COUNT(*) FROM product_clicks)::int AS total_clicks,
           (SELECT COUNT(*) FROM product_clicks WHERE clicked_at >= NOW() - INTERVAL '30 days')::int AS clicks_30_days`,
        []
      ),
      sql.query(
        `WITH days AS (
           SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
         ), views AS (
           SELECT viewed_at::date AS day, COUNT(*)::int AS count
           FROM link_views WHERE viewed_at >= CURRENT_DATE - INTERVAL '13 days'
           GROUP BY viewed_at::date
         ), clicks AS (
           SELECT clicked_at::date AS day, COUNT(*)::int AS count
           FROM product_clicks WHERE clicked_at >= CURRENT_DATE - INTERVAL '13 days'
           GROUP BY clicked_at::date
         )
         SELECT TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
           COALESCE(views.count, 0)::int AS views,
           COALESCE(clicks.count, 0)::int AS clicks
         FROM days LEFT JOIN views ON views.day = days.day LEFT JOIN clicks ON clicks.day = days.day
         ORDER BY days.day`,
        []
      ),
      sql.query(
        `SELECT products.id, products.name, COUNT(*)::int AS clicks
         FROM product_clicks JOIN products ON products.id = product_clicks.product_id
         GROUP BY products.id, products.name
         ORDER BY clicks DESC, products.name ASC LIMIT 5`,
        []
      ),
      sql.query(
        `SELECT catalogue_links.id, catalogue_links.slug, COUNT(*)::int AS views
         FROM link_views JOIN catalogue_links ON catalogue_links.id = link_views.catalogue_link_id
         GROUP BY catalogue_links.id, catalogue_links.slug
         ORDER BY views DESC, catalogue_links.slug ASC LIMIT 5`,
        []
      ),
    ]);

    return NextResponse.json({
      summary: (summaryRows as SummaryRow[])[0] ?? { total_views: 0, views_30_days: 0, total_clicks: 0, clicks_30_days: 0 },
      daily: daily as DailyRow[],
      popularProducts: popularProducts as ProductRow[],
      popularLinks: popularLinks as LinkRow[],
    });
  } catch (error) {
    console.error("Admin dashboard analytics failed", error);
    return NextResponse.json({ error: "Could not load dashboard analytics." }, { status: 500 });
  }
}
