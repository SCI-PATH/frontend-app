import type { Config } from "tailwindcss";

/**
 * Middle School EdTech (Grades 6–9) brand palette.
 * Prefer these semantic tokens over raw hex in components.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Focus Cyan — primary actions & navigation
        "brand-primary": "#00A8E8",
        // Growth Lime — success, rewards, progress
        "brand-secondary": "#70E000",
        // Confidence Orange — accents, alerts, streaks
        "brand-accent": "#FF6B35",
        // Creative Purple — gamification & special rewards
        "brand-special": "#7209B7",
        // Ink Charcoal — high-contrast body / heading text
        "brand-text": "#212529",
        // Soft Slate — component surfaces, borders, dividers
        "brand-surface": "#E9ECEF",
        // Calm Off-White — main canvas / page background
        "brand-background": "#F8F9FA",
      },
    },
  },
  plugins: [],
};

export default config;
