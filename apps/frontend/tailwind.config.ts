import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// theme.extend, токены с макетов
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Семантика статусов - сверх стандартного набора shadcn,
        // добавлено под бейджи "СВОБОДЕН"/"НА СЕССИИ" из макета витрины.
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)", // карточки (~12px)
        md: "calc(var(--radius) - 4px)", // кнопки (~8-10px)
        sm: "calc(var(--radius) - 6px)",
        full: "9999px", // бейджи/теги стека - полностью круглые
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      // Свечение вокруг акцентного текста в hero ("техническое")
      // отдельная утилита, не часть стандартной темы shadcn.
      dropShadow: {
        "glow-primary": "0 0 24px hsl(var(--primary) / 0.55)",
      },
    },
  },
  plugins: [animate],
};

export default config;
