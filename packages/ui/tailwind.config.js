/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}", "./stories/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#ffffff",
          secondary: "#f5f5f3",
          tertiary: "#ebebeb",
        },
        foreground: {
          DEFAULT: "#1a1a1a",
          secondary: "#666666",
          muted: "#999999",
          disabled: "#c0c0c0",
        },
        border: {
          DEFAULT: "#e5e5e5",
          strong: "#d0d0d0",
          subtle: "#f0f0f0",
        },
        primary: {
          DEFAULT: "#22c55e",
          hover: "#16a34a",
          active: "#15803d",
          light: "#f0fdf4",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f5f5f3",
          hover: "#ebebeb",
          foreground: "#1a1a1a",
        },
        success: {
          DEFAULT: "#22c55e",
          light: "#f0fdf4",
          foreground: "#15803d",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fffbeb",
          foreground: "#b45309",
        },
        error: {
          DEFAULT: "#ef4444",
          light: "#fef2f2",
          foreground: "#dc2626",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#eff6ff",
          foreground: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        lg: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        xl: "0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
