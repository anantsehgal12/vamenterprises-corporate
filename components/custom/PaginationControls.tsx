"use client";

import { useMemo } from "react";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
};

export function PaginationControls({ page, pageSize, totalItems, onPageChange, onPageSizeChange, itemLabel = "rows" }: Props) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const pages = useMemo(() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
    const result = new Set([0, pageCount - 1, page - 1, page, page + 1].filter((value) => value >= 0 && value < pageCount));
    return [...result].sort((a, b) => a - b);
  }, [page, pageCount]);
  const first = totalItems === 0 ? 0 : page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, totalItems);

  return <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span>Showing {first}–{last} of {totalItems} {itemLabel}</span>
      <label className="flex items-center gap-2">Rows per page
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger aria-label="Rows per page" className="h-8 w-[76px] border-border bg-background text-foreground"><SelectValue /></SelectTrigger>
          <SelectContent className="border-border bg-popover text-popover-foreground">
            {[10, 12, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>
    </div>
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); if (page > 0) onPageChange(page - 1); }} aria-disabled={page === 0} tabIndex={page === 0 ? -1 : undefined} className={page === 0 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
        {pages.map((value, index) => <PaginationItem key={value}>
          {index > 0 && value - pages[index - 1] > 1 && <PaginationEllipsis />}
          <PaginationLink href="#" isActive={value === page} aria-label={`Page ${value + 1}`} onClick={(event) => { event.preventDefault(); onPageChange(value); }}>{value + 1}</PaginationLink>
        </PaginationItem>)}
        <PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); if (page + 1 < pageCount) onPageChange(page + 1); }} aria-disabled={page + 1 >= pageCount} tabIndex={page + 1 >= pageCount ? -1 : undefined} className={page + 1 >= pageCount ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>;
}
