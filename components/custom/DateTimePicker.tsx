"use client";

import { useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function toLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({ id, value, onChange, placeholder = "Choose a date and time", className }: { id: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;
  const display = selected && !Number.isNaN(selected.valueOf()) ? format(selected, "EEE, MMM d, yyyy 'at' h:mm a") : "";

  function chooseDate(date: Date | undefined) {
    if (!date) return;
    const next = selected ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), selected.getHours(), selected.getMinutes()) : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0);
    onChange(toLocalDateTime(next));
  }

  function chooseTime(time: string) {
    if (!selected || !time) return;
    const [hours, minutes] = time.split(":").map(Number);
    const next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), hours, minutes);
    onChange(toLocalDateTime(next));
  }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button id={id} type="button" variant="outline" aria-haspopup="dialog" aria-expanded={open} className={`h-11 w-full justify-start gap-2 border-input bg-background px-3 text-left font-normal text-foreground hover:bg-accent ${!display ? "text-muted-foreground" : ""} ${className ?? ""}`}><CalendarDays className="size-4 shrink-0 text-brand-accent"/><span className="truncate">{display || placeholder}</span></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] border-border bg-popover p-2.5 text-popover-foreground shadow-lg">
      <Calendar mode="single" selected={selected} onSelect={chooseDate} disabled={{ before: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) }} className="mx-auto" />
      <div className="border-t border-border px-2 pb-1 pt-3">
        <label htmlFor={`${id}-time`} className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground"><Clock3 className="size-3.5 text-brand-accent"/>Call time</label>
        <Input id={`${id}-time`} type="time" value={selected ? `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}` : ""} disabled={!selected} onChange={(event) => chooseTime(event.target.value)} className="h-10 w-full bg-background text-foreground" />
        <Button type="button" size="sm" disabled={!selected} onClick={() => setOpen(false)} className="mt-3 w-full bg-[#244d32] text-white hover:bg-[#1c3e28]">Confirm date & time</Button>
      </div>
    </PopoverContent>
  </Popover>;
}
