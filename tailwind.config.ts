import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Base colors
        border: "var(--border-default)",
        input: "var(--border-default)",
        ring: "var(--primary-500)",
        background: "var(--bg-primary)",
        foreground: "var(--fg-primary)",
        
        // Text colors with opacity (legacy support)
        text: {
          87: "var(--fg-primary)",
          60: "var(--fg-secondary)",
          38: "var(--fg-tertiary)",
        },
        
        // Primary colors - Full SuzaLink Blue palette
        primary: {
          DEFAULT: "var(--primary-500)",
          foreground: "var(--fg-on-primary)",
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          // Legacy support
          20: "var(--primary-200)",
          5: "var(--primary-50)",
        },
        
        // Gray scale - High-contrast neutral system
        gray: {
          0: "var(--gray-0)",
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          400: "var(--gray-400)",
          500: "var(--gray-500)",
          600: "var(--gray-600)",
          700: "var(--gray-700)",
          800: "var(--gray-800)",
          900: "var(--gray-900)",
          1000: "var(--gray-1000)",
        },
        
        // Secondary colors
        secondary: {
          DEFAULT: "var(--fg-secondary)",
          foreground: "var(--fg-primary)",
        },
        
        // Accent colors - Complementary to blue
        accent: {
          DEFAULT: "var(--accent-500)",
          foreground: "var(--fg-on-primary)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
        },
        
        // Status colors - Error
        destructive: {
          DEFAULT: "var(--error-500)",
          foreground: "var(--fg-on-primary)",
          50: "var(--error-50)",
          300: "var(--error-300)",
          500: "var(--error-500)",
          700: "var(--error-700)",
          // Legacy support
          20: "var(--error-300)",
          5: "var(--error-50)",
          100: "var(--error-300)",
        },
        
        // Status colors - Success
        success: {
          DEFAULT: "var(--success-500)",
          foreground: "var(--fg-on-primary)",
          50: "var(--success-50)",
          300: "var(--success-300)",
          500: "var(--success-500)",
          700: "var(--success-700)",
          // Legacy support
          30: "var(--success-300)",
          9: "var(--success-50)",
          100: "var(--success-300)",
        },
        
        // Status colors - Warning
        warning: {
          DEFAULT: "var(--warning-500)",
          foreground: "var(--fg-on-primary)",
          50: "var(--warning-50)",
          300: "var(--warning-300)",
          500: "var(--warning-500)",
          700: "var(--warning-700)",
          // Legacy support
          30: "var(--warning-300)",
          9: "var(--warning-50)",
          100: "var(--warning-300)",
        },
        
        // Status colors - Jeans (muted blue) - Keep for compatibility
        jeans: {
          DEFAULT: "var(--color-jeans)",
          foreground: "var(--fg-primary)",
          30: "var(--color-jeans-30)",
          9: "var(--color-jeans-9)",
        },
        
        // Info (uses primary blue)
        info: {
          DEFAULT: "var(--primary-500)",
          foreground: "var(--fg-on-primary)",
          light: "var(--primary-50)",
          500: "var(--primary-500)", // Legacy support
        },
        
        // Muted colors
        muted: {
          DEFAULT: "var(--fg-secondary)",
          foreground: "var(--fg-tertiary)",
        },
        
        // Highlight colors - Keep for compatibility
        highlight: {
          bk: "var(--color-highlight-bk)",
          ck: "var(--color-highlight-ck)",
          sk: "var(--color-highlight-sk)",
        },
        
        // Background colors
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        
        // Foreground colors
        fg: {
          primary: "var(--fg-primary)",
          secondary: "var(--fg-secondary)",
          tertiary: "var(--fg-tertiary)",
          "on-primary": "var(--fg-on-primary)",
          "on-secondary": "var(--fg-on-secondary)",
        },
        
        // Border colors
        border: {
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        
        // Background colors (legacy)
        panel: "var(--bg-secondary)",
        surface: "var(--bg-secondary)",
        sidebar: "var(--bg-secondary)",
        
        // Popover and card
        popover: {
          DEFAULT: "var(--bg-secondary)",
          foreground: "var(--fg-primary)",
        },
        card: {
          DEFAULT: "var(--bg-secondary)",
          foreground: "var(--fg-primary)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
        // Legacy support
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
        button: "var(--radius-button)",
      },
      fontFamily: {
        sans: ["var(--font-family-sans)", "sans-serif"],
      },
      fontSize: {
        h1: ["var(--font-size-h1)", { lineHeight: "var(--line-height-h1)", fontWeight: "var(--font-weight-h1)" }],
        h2: ["var(--font-size-h2)", { lineHeight: "var(--line-height-h2)", fontWeight: "var(--font-weight-h2)" }],
        kpi: ["var(--font-size-kpi)", { lineHeight: "1", fontWeight: "var(--font-weight-kpi)" }],
        body: ["var(--font-size-body)", { lineHeight: "var(--line-height-body)", fontWeight: "var(--font-weight-body)" }],
        "body-sm": ["var(--font-size-body-sm)", { lineHeight: "var(--line-height-body)", fontWeight: "var(--font-weight-body-sm)" }],
        caption: ["var(--font-size-caption)", { lineHeight: "1.5", fontWeight: "var(--font-weight-caption)" }],
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        // Legacy support
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
        glow: "var(--shadow-glow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "zoom-in-98": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "zoom-out-98": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.98)" },
        },
        "slide-up-fade": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down-fade": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "zoom-in-98": "zoom-in-98 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "zoom-out-98": "zoom-out-98 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up-fade": "slide-up-fade 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down-fade": "slide-down-fade 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

