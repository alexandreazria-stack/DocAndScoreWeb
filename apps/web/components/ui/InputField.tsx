"use client";

export function InputField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-ds-offwhite/80 rounded-[14px] border border-ds-border/50 px-4 py-3.5 text-[15px] font-display text-ds-text placeholder:text-ds-text-muted/50 outline-none focus:border-ds-sky/40 focus:bg-white transition-all duration-200${className ? ` ${className}` : ""}`}
    />
  );
}
