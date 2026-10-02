import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getTable, readOnlyFields } from "@/lib/admin-tables";

type Context = { params: Promise<{ table: string }> };
const ident = (value: string) => `"${value.replaceAll('"', '""')}"`;
async function authorize() {
  const { userId } = await auth();
  if (!userId) return false;
  try { const { isAdmin } = await import("@/lib/auth"); return await isAdmin(userId); } catch { return false; }
}
function parseValue(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value === "string" && (value.trim().startsWith("[") || value.trim().startsWith("{"))) {
    try { return JSON.parse(value); } catch { throw new Error("JSON fields must contain valid JSON."); }
  }
  return value;
}
function parseFieldValue(name: string, value: unknown, config: NonNullable<ReturnType<typeof getTable>>) {
  const field = config.fields.find((item) => item.name === name);
  const parsed = parseValue(value);
  if (field?.type === "multi-reference") {
    if (!Array.isArray(parsed) || parsed.some((id) => !Number.isInteger(Number(id)) || Number(id) < 1)) throw new Error(`${field.label ?? field.name} must contain valid selections.`);
    // Neon serializes JS arrays as PostgreSQL arrays, but these columns are jsonb.
    return JSON.stringify(parsed.map(Number));
  }
  if ((field?.type === "image-list" || field?.type === "json") && parsed !== null) return JSON.stringify(parsed);
  return parsed;
}
function generatedSlug(table: string, name: unknown) {
  const base = typeof name === "string" ? name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) : "";
  return `${base || table.replaceAll("_", "-")}-${crypto.randomUUID().slice(0, 8)}`;
}
export async function GET(_request: NextRequest, { params }: Context) {
  if (!(await authorize())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { table } = await params; const config = getTable(table);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  try {
    const rows = table === "brands"
      ? await sql.query(`SELECT b.*, COUNT(p.id)::int AS product_count FROM "brands" b LEFT JOIN "products" p ON p."brand_id" = b."id" GROUP BY b."id" ORDER BY b."id" DESC LIMIT 500`, [])
      : table === "bulk_queries"
        ? await sql.query(`SELECT q.*, CASE WHEN jsonb_array_length(COALESCE(q."category_ids", '[]'::jsonb)) = 0 THEN 'All categories' ELSE (SELECT string_agg(cat."name", ', ' ORDER BY cat."name") FROM "categories" cat WHERE q."category_ids" @> jsonb_build_array(cat."id")) END AS category_names, CASE WHEN jsonb_array_length(COALESCE(q."brand_ids", '[]'::jsonb)) = 0 THEN 'All brands' ELSE (SELECT string_agg(b."name", ', ' ORDER BY b."name") FROM "brands" b WHERE q."brand_ids" @> jsonb_build_array(b."id")) END AS brand_names, COALESCE(to_char(q."preferred_call_at", 'FMDay, FMMonth DD, YYYY at HH12:MI AM'), CASE q."preferred_call_time" WHEN '9am_12pm' THEN '9:00 AM – 12:00 PM' WHEN '12pm_3pm' THEN '12:00 PM – 3:00 PM' WHEN '3pm_6pm' THEN '3:00 PM – 6:00 PM' WHEN '6pm_9pm' THEN '6:00 PM – 9:00 PM' WHEN 'anytime' THEN 'Any time' ELSE NULL END) AS preferred_call_time_label, COALESCE(json_agg(json_build_object('product_id', p."id", 'product_name', p."name", 'quantity', i."quantity") ORDER BY p."name") FILTER (WHERE i."id" IS NOT NULL), '[]'::json) AS products FROM "bulk_queries" q LEFT JOIN "bulk_query_items" i ON i."bulk_query_id" = q."id" LEFT JOIN "products" p ON p."id" = i."product_id" GROUP BY q."id" ORDER BY q."id" DESC LIMIT 500`, [])
        : await sql.query(`SELECT * FROM ${ident(table)} ORDER BY "id" DESC LIMIT 500`, []);
    const enumRows = await sql.query(`SELECT a.attname AS column_name, e.enumlabel AS label FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace JOIN pg_catalog.pg_type t ON t.oid = a.atttypid JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid WHERE n.nspname = 'public' AND c.relname = $1 AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum, e.enumsortorder`, [table]);
    const enumOptions: Record<string, string[]> = {};
    for (const item of enumRows as Array<{ column_name: string; label: string }>) (enumOptions[item.column_name] ??= []).push(item.label);
    return NextResponse.json({ rows, enumOptions });
  } catch (error) { console.error(`Admin list failed for ${table}`, error); return NextResponse.json({ error: "Could not load records. Check database connectivity and table schema." }, { status: 500 }); }
}
export async function POST(request: NextRequest, { params }: Context) {
  if (!(await authorize())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { table } = await params; const config = getTable(table);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  if (config.allowCreate === false) return NextResponse.json({ error: "This activity table is read-only." }, { status: 405 });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (config.fields.some((field) => field.name === "slug") && (typeof body.slug !== "string" || !body.slug.trim())) body.slug = generatedSlug(table, body.name);
    if (table === "products" && (body.tags === undefined || body.tags === null || body.tags === "")) body.tags = [];
    const allowed = new Set(config.fields.map(({ name }) => name).filter((name) => !readOnlyFields.has(name)));
    const entries = Object.entries(body).filter(([key]) => allowed.has(key));
    for (const field of config.fields) {
      const value = body[field.name];
      const emptyArray = (field.type === "image-list" || field.type === "multi-reference") && (Array.isArray(value) ? value.length === 0 : value === "[]");
      if (field.required && !readOnlyFields.has(field.name) && (value === undefined || value === null || value === "" || emptyArray)) return NextResponse.json({ error: `${field.label ?? field.name} is required.` }, { status: 400 });
    }
    if (!entries.length) return NextResponse.json({ error: "No editable values were provided." }, { status: 400 });
    const columns = entries.map(([key]) => ident(key)).join(", ");
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
    const values = entries.map(([key, value]) => parseFieldValue(key, value, config));
    const rows = await sql.query(`INSERT INTO ${ident(table)} (${columns}) VALUES (${placeholders}) RETURNING *`, values);
    return NextResponse.json({ row: rows[0] }, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "Could not create record."; return NextResponse.json({ error: message }, { status: 400 }); }
}
