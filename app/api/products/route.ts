import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";

// Special price is optional and always stored with a leading ₹ (e.g. "₹1,499"); empty -> null
const normalizeSpecialPrice = (value: unknown) => {
  if (typeof value !== "string") return null;
  const rest = value.replace(/^[\s₹]+/, "").trim();
  return rest ? `₹${rest}` : null;
};

// ---------------------------------------------
// GET /api/products  — list all products (public, e.g. for storefront)
// ---------------------------------------------
export async function GET() {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ products: allProducts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// POST /api/products  — create a product (admin only)
// ---------------------------------------------
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, specialPrice, mrp, images, categoryId, brandId, stockStatus, tags } = body;

    if (!name || !slug || mrp === undefined || mrp === null) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug and mrp are required" },
        { status: 400 }
      );
    }

    const [product] = await db
      .insert(products)
      .values({
        name,
        slug,
        description: description || null,
        specialPrice: normalizeSpecialPrice(specialPrice),
        mrp,
        images: images ?? [],
        categoryId: categoryId ?? null,
        brandId: brandId ?? null,
        stockStatus: stockStatus ?? "in_stock",
        tags: tags ?? [],
      })
      .returning();

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}