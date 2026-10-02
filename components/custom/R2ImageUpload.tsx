"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { value: string; onChange: (value: string) => void; multiple?: boolean; folder?: "brands" | "products"; dropzone?: boolean; largePreview?: boolean };
type ImageEntry = { url: string; storedValue: unknown };

function readImages(value: string, multiple: boolean): ImageEntry[] {
  if (!value) return [];
  if (!multiple) return [{ url: value, storedValue: value }];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): ImageEntry[] => {
      if (typeof item === "string") return item.trim() ? [{ url: item, storedValue: item }] : [];
      if (item && typeof item === "object") {
        const image = item as Record<string, unknown>;
        const url = image.url ?? image.src ?? image.image_url;
        if (typeof url === "string" && url.trim()) return [{ url, storedValue: item }];
      }
      return [];
    });
  } catch {
    return value.startsWith("http") ? [{ url: value, storedValue: value }] : [];
  }
}

export function R2ImageUpload({ value, onChange, multiple = false, folder = "products", dropzone = false, largePreview = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const images = useMemo(() => readImages(value, multiple), [value, multiple]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        body.set("folder", folder);
        const response = await fetch("/api/admin/r2-upload", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Image upload failed.");
        uploaded.push(result.url as string);
        if (!multiple) break;
      }
      const next = multiple ? [...images.map((image) => image.storedValue), ...uploaded] : uploaded[0];
      onChange(multiple ? JSON.stringify(next) : next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    const next = images.filter((_, imageIndex) => imageIndex !== index);
    onChange(multiple ? JSON.stringify(next.map((image) => image.storedValue)) : "");
  }

  return <div className="space-y-3">
    {images.length > 0 && <div className="flex flex-wrap gap-3">{images.map(({ url }, index) => <div key={`${url}-${index}`} className={`relative ${largePreview ? "size-40 sm:size-48" : "size-24"} overflow-hidden rounded-lg border border-border bg-muted`}>
      <Image src={url} alt={`Uploaded image ${index + 1}`} fill unoptimized sizes={largePreview ? "192px" : "96px"} className={largePreview ? "object-contain p-4" : "object-cover"} />
      <button type="button" onClick={() => remove(index)} aria-label={`Remove image ${index + 1}`} title="Remove image" className="absolute right-1 top-1 grid size-7 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow transition-colors hover:bg-destructive hover:text-destructive-foreground"><X size={14}/></button>
    </div>)}</div>}
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple={multiple} className="hidden" onChange={(event) => void upload(event.target.files)} />
    {dropzone ? <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files); }} className={`grid min-h-40 w-full place-items-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dragging ? "border-primary bg-accent" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"}`}>
      <span className="flex flex-col items-center gap-2.5"><span className="grid size-11 place-items-center rounded-xl border border-border bg-background text-primary shadow-sm">{uploading ? <LoaderCircle size={20} className="animate-spin"/> : <UploadCloud size={20}/>}</span><span className="text-sm font-medium text-foreground">{uploading ? "Uploading images…" : dragging ? "Drop images to upload" : "Drag images here, or browse files"}</span><span className="text-xs text-muted-foreground">{multiple ? "Add one or more images" : "Choose an image"} · PNG, JPEG, WebP, GIF or AVIF · up to 10 MB each</span></span>
    </button> : <><Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()} className="h-10 gap-2 rounded-lg border-input">
      {uploading ? <LoaderCircle size={16} className="animate-spin"/> : <ImagePlus size={16}/>} {uploading ? "Uploading…" : images.length ? (multiple ? "Add images" : "Replace image") : "Upload image"}
    </Button>
    <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, GIF or AVIF · up to 10 MB</p></>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
