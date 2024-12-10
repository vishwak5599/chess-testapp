import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xxs': '0.625rem',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        "anticDidone": ["AnticDidone","sans-serif"],
        "technology": ["Technology","sans-serif"]
      },
      screens: {
        xs: { max: "320px" },
        sm: { min: "640px" },
        md: { min: "768px" },
        lg: { min: "1024px" },
        xl: { min: "1228px" },
        xxl: { min: "1440px" },
        xxxl: { min: "1800px" },
        xxxxl: { min: "2560px" },
      },
    },
  },
  plugins: [],
} satisfies Config;
