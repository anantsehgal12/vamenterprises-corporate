"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type MultiSelectOption = { id: number; name: string };

export function MultiSelectDropdown({ label, allLabel, options, values, onChange, disabled = false }: { label: string; allLabel: string; options: MultiSelectOption[]; values: number[]; onChange: (values: number[]) => void; disabled?: boolean }) {
  const allSelected = values.length === 0;
  const selectedLabels = options.filter((option) => values.includes(option.id)).map((option) => option.name);
  const summary = allSelected ? allLabel : selectedLabels.length <= 2 ? selectedLabels.join(", ") : `${selectedLabels.length} ${label.toLowerCase()} selected`;

  function toggleAll() { onChange([]); }
  function toggleOption(id: number, checked: boolean) {
    const next = checked ? [...new Set([...values, id])] : values.filter((value) => value !== id);
    onChange(next);
  }

  return <Popover>
    <PopoverTrigger asChild><Button type="button" variant="outline" disabled={disabled} aria-label={label} className="h-11 w-full justify-between border-input bg-background px-3 text-left font-normal text-foreground hover:bg-accent"><span className={`truncate ${allSelected ? "text-muted-foreground" : ""}`}>{summary || allLabel}</span><ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground"/></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] border-border bg-popover p-2 text-popover-foreground shadow-lg">
      <div className="max-h-64 space-y-1 overflow-y-auto">
        <label className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium hover:bg-accent"><Checkbox checked={allSelected} onCheckedChange={toggleAll}/><span>{allLabel}</span>{allSelected && <Check className="ml-auto size-4 text-primary"/>}</label>
        {options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm hover:bg-accent"><Checkbox checked={values.includes(option.id)} onCheckedChange={(checked) => toggleOption(option.id, checked === true)}/><span className="truncate">{option.name}</span></label>)}
      </div>
    </PopoverContent>
  </Popover>;
}
