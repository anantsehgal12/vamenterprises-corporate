import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const maxBytes = 10 * 1024 * 1024;

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string | ArrayBuffer) {
  const data = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return hex(await crypto.subtle.digest("SHA-256", data));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string) {
  const imported = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", imported, new TextEncoder().encode(value)));
}

function encodePath(value: string) {
  return value.split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId || !(await isAdmin(userId))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return NextResponse.json({ error: "Image uploads are not configured. Set the Cloudflare R2 environment variables on the server." }, { status: 503 });
  }

  let file: File;
  let folder: "brands" | "products";
  try {
    const form = await request.formData();
    const value = form.get("file");
    const requestedFolder = form.get("folder");
    if (requestedFolder !== "brands" && requestedFolder !== "products") return NextResponse.json({ error: "Choose a valid image folder." }, { status: 400 });
    folder = requestedFolder;
    if (!(value instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    file = value;
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded image." }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a PNG, JPEG, WebP, GIF, or AVIF image." }, { status: 400 });
  if (file.size === 0 || file.size > maxBytes) return NextResponse.json({ error: "Images must be smaller than 10 MB." }, { status: 400 });

  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as Record<string, string>)[file.type];
  const key = `${folder}/${crypto.randomUUID()}.${extension}`;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodePath(bucket)}/${encodePath(key)}`;
  const url = `https://${host}${canonicalUri}`;
  const payload = await file.arrayBuffer();
  const payloadHash = await sha256(payload);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = `content-type:${file.type}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}`;
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonicalRequest)}`;
  const dateKey = await hmac(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");
  const signingKey = await hmac(serviceKey, "aws4_request");
  const signature = hex(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", signingKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(stringToSign)));

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      body: payload,
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("R2 image upload failed with status", response.status);
      return NextResponse.json({ error: "Cloudflare R2 could not store the image. Check the bucket credentials and permissions." }, { status: 502 });
    }
    return NextResponse.json({ url: `${publicUrl}/${encodePath(key)}`, key });
  } catch (error) {
    console.error("R2 image upload request failed:", error);
    return NextResponse.json({ error: "Could not reach Cloudflare R2. Try again shortly." }, { status: 502 });
  }
}
