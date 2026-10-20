import type { ReactNode } from "react";

type ButtonVariant =
  | "filled"
  | "filled-tonal"
  | "outlined"
  | "text"
  | "elevated";

type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "filled",
  size = "medium",
  children,
  disabled,
  loading,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    filled:
      "bg-primary-600 text-on-primary-50 hover:bg-primary-700 disabled:bg-outline",
    "filled-tonal":
      "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 disabled:bg-outline",
    outlined:
      "border border-outline text-on-surface outline-transparent hover:bg-surface-container-high disabled:border-outline",
    text: "hover:bg-surface-container-high disabled:bg-transparent",
    elevated:
      "bg-surface shadow-sm text-on-surface hover:shadow-md disabled:shadow-none disabled:bg-transparent",
  };

  const sizes: Record<ButtonSize, string> = {
    small: "px-3 py-1.5 text-label-medium rounded-md",
    medium: "px-4 py-2 text-label-medium rounded-lg",
    large: "px-6 py-3 text-body-large rounded-lg",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
