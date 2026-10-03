"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SearchableOption = { value: string; label: string };

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** When set, adds a first row that clears the selection (onChange("")). */
  noneLabel?: string;
  ariaLabel?: string;
  className?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "Nothing found.",
  noneLabel,
  ariaLabel,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const pick = (next: string) => { onChange(next); setOpen(false); };

  return (
    // `modal` lets the list scroll with the mouse wheel when this is used inside a Dialog/Drawer.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={`h-11 w-full justify-between gap-2 rounded-lg border-input bg-background px-4 text-sm font-normal text-foreground shadow-sm hover:bg-background ${className}`}
        >
          <span className={`truncate ${selected ? "" : "text-muted-foreground"}`}>{selected?.label ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 border-border bg-popover p-0 text-popover-foreground shadow-lg">
        {/* Match on the label only: value is the id, the label is passed as a keyword. */}
        <Command filter={(_value, search, keywords) => (keywords?.[0] ?? "").toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-64">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {noneLabel && (
                <CommandItem value="__none__" keywords={[noneLabel]} onSelect={() => pick("")} className="min-h-10 gap-2 px-3">
                  <Check className={`size-4 ${value === "" ? "opacity-100" : "opacity-0"}`} />
                  <span className="text-muted-foreground">{noneLabel}</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem key={option.value} value={option.value} keywords={[option.label]} onSelect={() => pick(option.value)} className="min-h-10 gap-2 px-3">
                  <Check className={`size-4 ${value === option.value ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
