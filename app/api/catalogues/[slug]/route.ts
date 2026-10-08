import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Context = { params: Promise<{ slug: string }> };
type Catalogue = { id: number; slug: string; customer_name: string | null; company_name: string | null; product_ids: unknown; is_active: boolean; default_sort: string };

function productIds(value: unknown) {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(value) ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0) : [];
}

export async function GET(_request: NextRequest, { params }: Context) {
  const { slug } = await params;
  try {
    const links = await sql.query(`SELECT id, slug, customer_name, company_name, product_ids, is_active, default_sort FROM "catalogue_links" WHERE slug = $1 LIMIT 1`, [slug]);
    const link = links[0] as Catalogue | undefined;
    if (!link || !link.is_active) {
      return NextResponse.json({ error: "This catalogue is unavailable." }, { status: 404 });
    }

    const ids = productIds(link.product_ids);
    let products: unknown[] = [];
    if (ids.length) {
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
      const orderBy: Record<string, string> = {
        newest: `p."id" DESC`,
        price_asc: `p."mrp" ASC, p."id" DESC`,
        price_desc: `p."mrp" DESC, p."id" DESC`,
        name_asc: `p."name" ASC`,
      };
      products = await sql.query(`SELECT p."id", p."name", p."slug", p."description", p."images", p."mrp", p."special_price", b."name" AS brand_name, b."logo_url" AS brand_logo_url, c."name" AS category_name FROM "products" p LEFT JOIN "brands" b ON b."id" = p."brand_id" LEFT JOIN "categories" c ON c."id" = p."category_id" WHERE p."id" IN (${placeholders}) AND p."is_active" = true ORDER BY ${orderBy[link.default_sort] ?? orderBy.newest}`, ids);
    }
    await sql.query(`UPDATE "catalogue_links" SET "view_count" = "view_count" + 1 WHERE "id" = $1`, [link.id]);
    await sql.query(`INSERT INTO "link_views" ("catalogue_link_id") VALUES ($1)`, [link.id]);
    return NextResponse.json({ catalogueLinkId: link.id, slug: link.slug, customerName: link.customer_name, companyName: link.company_name, products });
  } catch (error) {
    console.error("Public catalogue load failed:", error);
    return NextResponse.json({ error: "Could not load this catalogue." }, { status: 500 });
  }
}