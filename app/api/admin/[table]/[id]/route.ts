import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getTable, readOnlyFields } from "@/lib/admin-tables";
import { isAdmin } from "@/lib/auth";
type Context = { params: Promise<{ table: string; id: string }> };
const ident = (value: string) => `"${value.replaceAll('"', '""')}"`;
async function authorized() { const { userId } = await auth(); return !!userId && await isAdmin(userId); }
function parseValue(value: unknown) { if (typeof value === "string" && value.trim() === "") return null; if (typeof value === "string" && (value.trim().startsWith("[") || value.trim().startsWith("{"))) { try { return JSON.parse(value); } catch { throw new Error("JSON fields must contain valid JSON."); } } return value; }
function parseFieldValue(name: string, value: unknown, config: NonNullable<ReturnType<typeof getTable>>) { const field = config.fields.find((item) => item.name === name); const parsed = parseValue(value); if (field?.type === "multi-reference") { if (!Array.isArray(parsed) || parsed.some((id) => !Number.isInteger(Number(id)) || Number(id) < 1)) throw new Error(`${field.label ?? field.name} must contain valid selections.`); return JSON.stringify(parsed.map(Number)); } if ((field?.type === "image-list" || field?.type === "json") && parsed !== null) return JSON.stringify(parsed); return parsed; }
function generatedSlug(table: string, name: unknown) { const base = typeof name === "string" ? name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) : ""; return `${base || table.replaceAll("_", "-")}-${crypto.randomUUID().slice(0, 8)}`; }
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { table, id } = await params; const config = getTable(table); const recordId = Number(id);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  if (!Number.isInteger(recordId) || recordId < 1) return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
  if (config.allowEdit === false) return NextResponse.json({ error: "This activity table is read-only." }, { status: 405 });
  try {
    const body = await request.json() as Record<string, unknown>; const allowed = new Set(config.fields.map(({ name }) => name).filter((name) => !readOnlyFields.has(name)));
    if (config.fields.some((field) => field.name === "slug") && Object.hasOwn(body, "slug") && (typeof body.slug !== "string" || !body.slug.trim())) body.slug = generatedSlug(table, body.name);
    if (table === "products" && (body.tags === undefined || body.tags === null || body.tags === "")) body.tags = [];
    const entries = Object.entries(body).filter(([key]) => allowed.has(key)); if (!entries.length) return NextResponse.json({ error: "No editable values were provided." }, { status: 400 });
    for (const field of config.fields) {
      const value = body[field.name];
      const emptyArray = (field.type === "image-list" || field.type === "multi-reference") && (Array.isArray(value) ? value.length === 0 : value === "[]");
      if (field.required && !readOnlyFields.has(field.name) && (value === undefined || value === null || value === "" || emptyArray)) return NextResponse.json({ error: `${field.label ?? field.name} is required.` }, { status: 400 });
    }
    const assignments = entries.map(([key], i) => `${ident(key)} = $${i + 1}`).join(", "); const values = entries.map(([key, value]) => parseFieldValue(key, value, config)); values.push(recordId);
    const rows = await sql.query(`UPDATE ${ident(table)} SET ${assignments} WHERE "id" = $${values.length} RETURNING *`, values);
    if (!rows[0]) return NextResponse.json({ error: "Record not found" }, { status: 404 }); return NextResponse.json({ row: rows[0] });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update record." }, { status: 400 }); }
}
export async function DELETE(_request: NextRequest, { params }: Context) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { table, id } = await params; const config = getTable(table); const recordId = Number(id);
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 }); if (!Number.isInteger(recordId) || recordId < 1) return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
  if (config.allowDelete === false) return NextResponse.json({ error: "Deleting records is disabled for this table." }, { status: 405 });
  try {
    let rows: Array<Record<string, unknown>>;
    if (table === "catalogue_links") {
      // Keep enquiry, click, and view history while removing its catalogue association.
      const results = await sql.transaction((tx) => [
        tx.query(`UPDATE "bulk_queries" SET "catalogue_link_id" = NULL WHERE "catalogue_link_id" = $1`, [recordId]),
        tx.query(`UPDATE "product_clicks" SET "catalogue_link_id" = NULL WHERE "catalogue_link_id" = $1`, [recordId]),
        tx.query(`UPDATE "link_views" SET "catalogue_link_id" = NULL WHERE "catalogue_link_id" = $1`, [recordId]),
        tx.query(`DELETE FROM ${ident(table)} WHERE "id" = $1 RETURNING *`, [recordId]),
      ]);
      rows = results[3] as Array<Record<string, unknown>>;
    } else {
      rows = await sql.query(`DELETE FROM ${ident(table)} WHERE "id" = $1 RETURNING *`, [recordId]) as Array<Record<string, unknown>>;
    }
    if (!rows[0]) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ row: rows[0] });
  }
  catch (error) { console.error(`Admin delete failed for ${table}`, error); return NextResponse.json({ error: "Could not delete this record. It may still be referenced by another record." }, { status: 409 }); }
}
