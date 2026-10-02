import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const products = await sql.query(
      `SELECT p."id", p."name", p."slug", p."description", p."images", p."mrp", p."moq", b."name" AS brand_name, b."logo_url" AS brand_logo_url, c."name" AS category_name
       FROM "products" p
       LEFT JOIN "brands" b ON b."id" = p."brand_id"
       LEFT JOIN "categories" c ON c."id" = p."category_id"
       WHERE p."is_active" = true
       ORDER BY p."created_at" DESC, p."id" DESC`
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Public catalogue listing failed:", error);
    return NextResponse.json({ error: "Could not load the catalogue." }, { status: 500 });
  }
}
