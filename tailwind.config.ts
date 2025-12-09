import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: {
            DEFAULT: '#3A3A3A',
            light: '#CDCDCC',
          },
          panel: {
            DEFAULT: '#706F6F',
            light: '#C9C9C9',
          },
          border: {
            DEFAULT: '#8E8D8D',
            light: '#B2B1B1',
          },
          accent: '#F48969',
          text: {
            DEFAULT: '#E5E5E5',
            light: '#374151',
          },
        },
      },
      keyframes: {
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInScale: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
          "50%": {
            boxShadow:
              "0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      animation: {
        "fade-in-down": "fadeInDown 0.8s ease-out forwards",
        "fade-in-up": "fadeInUp 0.8s ease-out 0.3s forwards",
        "fade-in-scale": "fadeInScale 0.8s ease-out 0.6s forwards",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
