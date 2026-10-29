"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  icon: string;
  autoComplete?: string;
  required?: boolean;
};

export default function TextField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  icon,
  autoComplete,
  required,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block font-label-caps text-label-caps text-on-surface-variant uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <span
          className={cn(
            "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 !text-[18px] transition-colors pointer-events-none",
            focused ? "text-primary" : "text-on-surface-variant"
          )}
        >
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-row-height-md pl-10 pr-container-padding bg-surface-container dark:bg-surface-container-high border border-outline-variant rounded font-mono-data text-mono-data text-on-surface placeholder:text-on-surface-variant/40 input-focus-ring transition-all"
        />
      </div>
    </div>
  );
}