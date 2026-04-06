"use client";
import { useState } from "react";

export function Input({
  value,
  onChange,
  placeholder,
  icon,
  autoFocus,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: string;
  autoFocus?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-ds-offwhite rounded-xl border-[1.5px] border-ds-border px-4 py-3 focus-within:border-ds-sky transition-colors ${className}`}
    >
      {icon && <span className="text-lg opacity-50">{icon}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        type={type}
        className="flex-1 bg-transparent outline-none text-[15px] font-display text-ds-text placeholder:text-ds-text-muted"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-ds-text-muted hover:text-ds-text text-base"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2.5 bg-ds-offwhite rounded-xl border-[1.5px] border-ds-border px-4 py-3 focus-within:border-ds-sky transition-colors">
      <span className="text-lg opacity-50">🔒</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={show ? "text" : "password"}
        className="flex-1 bg-transparent outline-none text-[15px] font-display text-ds-text placeholder:text-ds-text-muted"
      />
      <button
        onClick={() => setShow((s) => !s)}
        className="text-ds-text-muted text-sm font-semibold font-display"
      >
        {show ? "Masquer" : "Voir"}
      </button>
    </div>
  );
}
