import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const cleanText = (value: unknown) => typeof value === "string" ? value.trim() : "";
function isValidLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText), hour = Number(hourText), minute = Number(minuteText);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute;
}

export async function GET() {
  try {
    const [categories, brands] = await Promise.all([
      sql.query(`SELECT id, name FROM categories ORDER BY name ASC`),
      sql.query(`SELECT id, name FROM brands ORDER BY name ASC`),
    ]);
    return NextResponse.json({ categories, brands });
  } catch (error) {
    console.error("Could not load general requirement categories", error);
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Please submit a valid request." }, { status: 400 }); }

  const name = cleanText(body.name);
  const companyName = cleanText(body.companyName);
  const contactNo = cleanText(body.contactNo);
  const email = cleanText(body.email);
  const notes = cleanText(body.notes);
  const parseIds = (value: unknown): number[] | null => {
    if (!Array.isArray(value)) return value === undefined ? [] : null;
    const ids = value.map(Number);
    return ids.every((id) => Number.isSafeInteger(id) && id > 0) ? [...new Set(ids)] : null;
  };
  const categoryIds = parseIds(body.categoryIds);
  const brandIds = parseIds(body.brandIds);
  const quantity = Number(body.quantity);
  const preferredCallAt = cleanText(body.preferredCallAt);
  const digitCount = contactNo.replace(/\D/g, "").length;

  if (!name || name.length > 120) return NextResponse.json({ error: "Enter your name (up to 120 characters)." }, { status: 400 });
  if (companyName.length > 120) return NextResponse.json({ error: "Company name must be 120 characters or fewer." }, { status: 400 });
  if (!/^\+?[\d\s().-]{7,20}$/.test(contactNo) || digitCount < 7 || digitCount > 15) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  if (email.length > 255 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!categoryIds || !brandIds) return NextResponse.json({ error: "Choose valid brands and categories." }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) return NextResponse.json({ error: "Enter a valid quantity." }, { status: 400 });
  if (!isValidLocalDateTime(preferredCallAt)) return NextResponse.json({ error: "Choose a valid date and time for a call." }, { status: 400 });
  if (notes.length > 1000) return NextResponse.json({ error: "Message must be 1,000 characters or fewer." }, { status: 400 });

  try {
    if (categoryIds.length) {
      const matches = await sql.query(`SELECT COUNT(*)::int AS count FROM categories WHERE id IN (SELECT value::integer FROM jsonb_array_elements_text($1::jsonb))`, [JSON.stringify(categoryIds)]) as Array<{ count: number }>;
      if (Number(matches[0]?.count) !== categoryIds.length) return NextResponse.json({ error: "One or more selected categories are no longer available." }, { status: 400 });
    }
    if (brandIds.length) {
      const matches = await sql.query(`SELECT COUNT(*)::int AS count FROM brands WHERE id IN (SELECT value::integer FROM jsonb_array_elements_text($1::jsonb))`, [JSON.stringify(brandIds)]) as Array<{ count: number }>;
      if (Number(matches[0]?.count) !== brandIds.length) return NextResponse.json({ error: "One or more selected brands are no longer available." }, { status: 400 });
    }
    const rows = await sql.query(
      `INSERT INTO bulk_queries (query_type, category_id, category_ids, brand_ids, quantity, name, company_name, contact_no, email, preferred_call_at, status, notes)
       VALUES ('general', $1, $2::jsonb, $3::jsonb, $4, $5, NULLIF($6, ''), $7, NULLIF($8, ''), $9::timestamp without time zone, 'new'::query_status, NULLIF($10, '')) RETURNING id`,
      [categoryIds.length === 1 ? categoryIds[0] : null, JSON.stringify(categoryIds), JSON.stringify(brandIds), quantity, name, companyName, contactNo, email, preferredCallAt, notes]
    ) as Array<{ id: number }>;
    return NextResponse.json({ ok: true, requirementId: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Could not create general requirement", error);
    return NextResponse.json({ error: "Could not send your request right now. Please try again." }, { status: 500 });
  }
}
