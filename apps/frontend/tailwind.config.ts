import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #d1d5db',
        'brutal-sm': '2px 2px 0px 0px #d1d5db',
        'brutal-md': '3px 3px 0px 0px #d1d5db',
        'brutal-lg': '6px 6px 0px 0px #d1d5db',
        'brutal-primary': '4px 4px 0px 0px #bfdbfe',
        'brutal-hover': '2px 2px 0px 0px #d1d5db',
        'brutal-none': '0px 0px 0px 0px #d1d5db',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
