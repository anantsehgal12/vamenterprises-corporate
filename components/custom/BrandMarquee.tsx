"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Brand = {
  name: string;
  logo_url?: string | null;
};

type BrandMarqueeProps = {
  /** Public endpoint returning `{ products: [{ brand_name, brand_logo_url }] }`; brands are derived from the products. */
  endpoint?: string;
  /** Optional: make each brand clickable (e.g. link to the shop filtered by brand). */
  getHref?: (brand: Brand) => string;
  /** Seconds each brand spends crossing the screen; lower = faster. */
  secondsPerItem?: number;
  className?: string;
};

const MIN_ITEMS_PER_GROUP = 10;

function BrandChip({ brand, href }: { brand: Brand; href?: string }) {
  const content = (
    <>
      {brand.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo_url} alt="" className="h-6 w-auto max-w-[96px] object-contain" loading="lazy" />
      ) : (
        <span className="size-1.5 rotate-45 bg-[#4ca626]" aria-hidden />
      )}
      <span className="whitespace-nowrap font-serif text-lg tracking-wide">{brand.name}</span>
    </>
  );
  const classes =
    "flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-6 py-3 text-white/70 backdrop-blur-xl transition-colors hover:border-[#4ca626]/60 hover:text-white focus-visible:border-[#4ca626]/60 focus-visible:text-white focus-visible:outline-none";
  return href ? (
    <Link href={href} className={classes}>{content}</Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

export default function BrandMarquee({ endpoint = "/api/catalogues", getHref, secondsPerItem = 3, className = "" }: BrandMarqueeProps) {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to load brands");
        const data = await response.json();
        const unique = new Map<string, Brand>();
        for (const product of (data.products ?? []) as Array<{ brand_name?: string | null; brand_logo_url?: string | null }>) {
          const name = product.brand_name?.trim();
          if (!name) continue;
          const existing = unique.get(name);
          if (!existing) unique.set(name, { name, logo_url: product.brand_logo_url ?? null });
          else if (!existing.logo_url && product.brand_logo_url) existing.logo_url = product.brand_logo_url;
        }
        setBrands([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setFailed(true);
      }
    })();
    return () => controller.abort();
  }, [endpoint]);

  // Repeat the list so one group is always wider than the viewport, then render the group twice
  // and slide by exactly -50% for a seamless loop.
  const group = useMemo(() => {
    if (!brands?.length) return [];
    const repeats = Math.max(1, Math.ceil(MIN_ITEMS_PER_GROUP / brands.length));
    return Array.from({ length: repeats }, () => brands).flat();
  }, [brands]);

  if (failed || (brands && brands.length === 0)) return null;

  if (!brands) {
    return (
      <div className={`flex gap-4 overflow-hidden py-4 ${className}`} aria-hidden>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-12 w-40 shrink-0 animate-pulse rounded-full border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  const duration = Math.max(20, group.length * secondsPerItem);

  return (
    <section aria-label="Our brands" className={`vam-marquee ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .vam-marquee { overflow: hidden; padding: 1rem 0;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); }
        .vam-track { display: flex; width: max-content; animation: vam-scroll var(--vam-duration) linear infinite; }
        .vam-group { display: flex; gap: 1rem; padding-right: 1rem; }
        .vam-marquee:hover .vam-track, .vam-marquee:focus-within .vam-track { animation-play-state: paused; }
        @keyframes vam-scroll { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .vam-marquee { overflow-x: auto; }
          .vam-track { animation: none; }
        }
      ` }} />
      <div className="vam-track" style={{ ["--vam-duration" as string]: `${duration}s` }}>
        <div className="vam-group">
          {group.map((brand, index) => <BrandChip key={`a-${brand.name}-${index}`} brand={brand} href={getHref?.(brand)} />)}
        </div>
        <div className="vam-group" aria-hidden>
          {group.map((brand, index) => <BrandChip key={`b-${brand.name}-${index}`} brand={brand} href={getHref?.(brand)} />)}
        </div>
      </div>
    </section>
  );
}