"use client";

const variants: Record<string, string> = {
  primary: "bg-ds-sky text-white hover:bg-ds-sky/90",
  secondary: "bg-ds-sky-pale text-ds-sky hover:bg-ds-sky-pale/80",
  ghost: "bg-transparent text-ds-text-secondary hover:bg-ds-offwhite",
  outline: "bg-transparent text-ds-sky border-2 border-ds-sky hover:bg-ds-sky-ghost",
  pro: "bg-gradient-to-br from-ds-pro to-[#9B8CE8] text-white",
};

const sizes: Record<string, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-6 py-3 text-[15px]",
  lg: "px-8 py-4 text-[17px] rounded-[14px]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled,
  onClick,
  fullWidth,
  className = "",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-bold
        transition-all duration-150 active:scale-[0.97]
        disabled:opacity-40 disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
