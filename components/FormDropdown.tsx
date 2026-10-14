"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Option = { value: string; label: string };

export function FormDropdown({
  name,
  options,
  defaultValue = "",
  placeholder = "Select an option",
  required,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <select className="member-select-validation" name={name} value={value} required={required} tabIndex={-1} aria-hidden="true" onChange={() => undefined}>
        <option value="" />
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button type="button" className="member-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-required={required || undefined}>
            <span className={selected ? "" : "member-select-placeholder"}>{selected?.label || placeholder}</span>
            <ChevronDown size={17} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={4} className="member-select-menu">
          <div role="listbox" aria-label={name}>
            {options.map((option) => (
              <button key={option.value} type="button" role="option" aria-selected={value === option.value} className="member-select-option" onClick={() => { setValue(option.value); setOpen(false); }}>
                {option.label}
                {value === option.value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
