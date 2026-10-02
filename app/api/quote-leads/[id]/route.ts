import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quoteLeads } from "@/lib/schema";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------
// GET /api/quote-leads/[id]  — fetch a single lead (admin only)
// ---------------------------------------------
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (Number.isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  try {
    const [lead] = await db
      .select()
      .from(quoteLeads)
      .where(eq(quoteLeads.id, leadId));

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quote lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote lead" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// PATCH /api/quote-leads/[id]  — edit a lead, e.g. update callStatus/notes (admin only)
// ---------------------------------------------
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (Number.isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Only allow whitelisted fields to be updated
    const {
      customerName,
      companyName,
      minOrderQty,
      budgetPerPiece,
      mobileNumber,
      email,
      suitableHours,
      callStatus,
      notes,
    } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (customerName !== undefined) updateData.customerName = customerName;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (minOrderQty !== undefined) updateData.minOrderQty = minOrderQty;
    if (budgetPerPiece !== undefined) updateData.budgetPerPiece = budgetPerPiece;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (email !== undefined) updateData.email = email;
    if (suitableHours !== undefined) updateData.suitableHours = suitableHours;
    if (callStatus !== undefined) updateData.callStatus = callStatus;
    if (notes !== undefined) updateData.notes = notes;

    const [updatedLead] = await db
      .update(quoteLeads)
      .set(updateData)
      .where(eq(quoteLeads.id, leadId))
      .returning();

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead: updatedLead }, { status: 200 });
  } catch (error) {
    console.error("Error updating quote lead:", error);
    return NextResponse.json(
      { error: "Failed to update quote lead" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// DELETE /api/quote-leads/[id]  — delete a lead (admin only)
// ---------------------------------------------
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (Number.isNaN(leadId)) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  try {
    const [deletedLead] = await db
      .delete(quoteLeads)
      .where(eq(quoteLeads.id, leadId))
      .returning();

    if (!deletedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lead deleted", lead: deletedLead },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting quote lead:", error);
    return NextResponse.json(
      { error: "Failed to delete quote lead" },
      { status: 500 }
    );
  }
}
