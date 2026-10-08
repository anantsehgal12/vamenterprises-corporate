import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type EnquiryBody = {
  productId?: unknown;
  catalogueLinkId?: unknown;
  name?: unknown;
  companyName?: unknown;
  contactNo?: unknown;
  email?: unknown;
  quantity?: unknown;
  preferredCallAt?: unknown;
  notes?: unknown;
};

const cleanText = (value: unknown) => typeof value === "string" ? value.trim() : "";
function isValidLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText), hour = Number(hourText), minute = Number(minuteText);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  let body: EnquiryBody;
  try {
    body = await request.json() as EnquiryBody;
  } catch {
    return NextResponse.json({ error: "Please submit a valid enquiry." }, { status: 400 });
  }

  const productId = Number(body.productId);
  const catalogueLinkId = body.catalogueLinkId == null || body.catalogueLinkId === "" ? null : Number(body.catalogueLinkId);
  const quantity = Number(body.quantity);
  const name = cleanText(body.name);
  const companyName = cleanText(body.companyName);
  const contactNo = cleanText(body.contactNo);
  const email = cleanText(body.email);
  const notes = cleanText(body.notes);
  const preferredCallAt = cleanText(body.preferredCallAt);
  const digitCount = contactNo.replace(/\D/g, "").length;

  if (!Number.isInteger(productId) || productId < 1) {
    return NextResponse.json({ error: "This product could not be identified." }, { status: 400 });
  }
  if (catalogueLinkId !== null && (!Number.isInteger(catalogueLinkId) || catalogueLinkId < 1)) {
    return NextResponse.json({ error: "This catalogue could not be identified." }, { status: 400 });
  }
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "Enter your name (up to 120 characters)." }, { status: 400 });
  }
  if (companyName.length > 120) {
    return NextResponse.json({ error: "Company name must be 120 characters or fewer." }, { status: 400 });
  }
  if (!/^\+?[\d\s().-]{7,20}$/.test(contactNo) || digitCount < 7 || digitCount > 15) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  if (email.length > 255 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isValidLocalDateTime(preferredCallAt)) {
    return NextResponse.json({ error: "Choose a valid date and time for a call." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
    return NextResponse.json({ error: "Enter a valid quantity." }, { status: 400 });
  }
  if (notes.length > 1000) {
    return NextResponse.json({ error: "Message must be 1,000 characters or fewer." }, { status: 400 });
  }

  try {
    const rows = await sql.query(
      `WITH available_product AS MATERIALIZED (
         SELECT id FROM products WHERE id = $1 AND is_active = TRUE
       ), created_query AS (
         INSERT INTO bulk_queries (query_type, catalogue_link_id, name, company_name, contact_no, email, preferred_call_at, status, notes)
         SELECT 'catalogue', $7::integer, $2, NULLIF($3, ''), $4, NULLIF($8, ''), $9::timestamp without time zone, 'new'::query_status, NULLIF($5, '')
         FROM available_product
         WHERE ($7::integer IS NULL OR EXISTS (SELECT 1 FROM catalogue_links WHERE id = $7::integer AND is_active = TRUE AND product_ids @> jsonb_build_array($1::integer)))
         RETURNING id
       ), created_item AS (
         INSERT INTO bulk_query_items (bulk_query_id, product_id, quantity)
         SELECT created_query.id, available_product.id, $6
         FROM created_query CROSS JOIN available_product
         RETURNING bulk_query_id
       )
       SELECT id FROM created_query`,
      [productId, name, companyName, contactNo, notes, quantity, catalogueLinkId, email, preferredCallAt]
    ) as Array<{ id: number }>;

    if (!rows.length) {
      return NextResponse.json({ error: "This product is unavailable or is not in this catalogue." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, enquiryId: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Could not create product enquiry", error);
    return NextResponse.json({ error: "Could not send your query right now. Please try again." }, { status: 500 });
  }
}