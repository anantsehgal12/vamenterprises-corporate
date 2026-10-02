import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";

const rapidApiHost = "gst-verification-api-get-profile-returns-data.p.rapidapi.com";
const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RAPIDAPI_KEY?.trim();
  const endpointTemplate = process.env.GST_VERIFICATION_URL_TEMPLATE?.trim();
  if (!apiKey || !endpointTemplate) {
    return NextResponse.json(
      { error: "GST verification is not configured. Set RAPIDAPI_KEY and GST_VERIFICATION_URL_TEMPLATE on the server." },
      { status: 503 },
    );
  }

  let gstin = "";
  try {
    const body = await request.json() as { gstin?: unknown };
    gstin = typeof body.gstin === "string" ? body.gstin.trim().toUpperCase() : "";
  } catch {
    return NextResponse.json({ error: "Send a valid GSTIN." }, { status: 400 });
  }
  if (!gstinPattern.test(gstin)) {
    return NextResponse.json({ error: "Enter a valid 15-character GSTIN." }, { status: 400 });
  }

  let endpoint: URL;
  try {
    endpoint = new URL(endpointTemplate.replaceAll("{gstin}", encodeURIComponent(gstin)));
  } catch {
    return NextResponse.json({ error: "GST_VERIFICATION_URL_TEMPLATE must be a valid HTTPS URL." }, { status: 500 });
  }
  if (endpoint.protocol !== "https:" || endpoint.hostname !== rapidApiHost) {
    return NextResponse.json({ error: "The GST verification URL must use the configured RapidAPI host over HTTPS." }, { status: 500 });
  }
  if (!endpointTemplate.includes("{gstin}")) endpoint.searchParams.set("gstin", gstin);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "X-RapidAPI-Host": rapidApiHost, "X-RapidAPI-Key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const upstreamMessage = result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : "GST verification failed. Check the API subscription, URL template, or GSTIN.";
      return NextResponse.json({ error: upstreamMessage }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
    }
    if (!result || typeof result !== "object" || !("data" in result)) {
      return NextResponse.json({ error: "The verification service returned an unexpected response." }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("GST verification request failed:", error);
    return NextResponse.json({ error: "Could not reach the GST verification service. Try again shortly." }, { status: 502 });
  }
}
