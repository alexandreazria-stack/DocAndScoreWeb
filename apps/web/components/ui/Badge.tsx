"use client";

const presets: Record<string, string> = {
  free: "bg-ds-success-pale text-ds-success",
  pro: "bg-ds-pro-pale text-ds-pro",
  sky: "bg-ds-sky-pale text-ds-sky",
  error: "bg-ds-error-pale text-ds-error",
  warning: "bg-ds-warning-pale text-ds-warning",
};

export function Badge({
  children,
  variant = "sky",
}: {
  children: React.ReactNode;
  variant?: keyof typeof presets;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${presets[variant]}`}
    >
      {children}
    </span>
  );
}
