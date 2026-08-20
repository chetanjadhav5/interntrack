/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#5f1bbf",
        "primary-container": "#762edb",
        "on-primary": "#ffffff",
        "on-primary-container": "#f1e8ff",
        "primary-fixed": "#ecdcff",
        "primary-fixed-dim": "#d8baff",
        "on-primary-fixed": "#250059",
        "on-primary-fixed-variant": "#4c0da7",
        "secondary": "#006973",
        "secondary-container": "#85efff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#006d78",
        "secondary-fixed": "#92f1ff",
        "secondary-fixed-dim": "#6ad6e5",
        "tertiary": "#434a57",
        "tertiary-container": "#5b626f",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#d7deee",
        "background": "#f8f9fa",
        "on-background": "#191c1d",
        "surface": "#f8f9fa",
        "surface-bright": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "on-surface": "#191c1d",
        "on-surface-variant": "#434654",
        "outline": "#737686",
        "outline-variant": "#c3c5d7",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "surface-tint": "#5f1bbf",
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "sm": "0.25rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      spacing: {
        "base": "8px",
        "gutter": "24px",
        "container-max": "1280px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        "margin-desktop": "32px",
        "margin-mobile": "16px"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      fontSize: {
        "display": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["28px", { lineHeight: "34px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }]
      },
      boxShadow: {
        "card": "0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 25px -5px rgba(95, 27, 191, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        "glow": "0 0 0 3px rgba(95, 27, 191, 0.25)"
      }
    },
  },
  plugins: [],
}
