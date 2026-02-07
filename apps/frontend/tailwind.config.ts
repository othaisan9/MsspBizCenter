import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#EEF2FF',
        },
        // Status Colors
        status: {
          pending: {
            DEFAULT: '#6B7280',
            bg: '#F3F4F6',
          },
          'in-progress': {
            DEFAULT: '#3B82F6',
            bg: '#DBEAFE',
          },
          review: {
            DEFAULT: '#F59E0B',
            bg: '#FEF3C7',
          },
          completed: {
            DEFAULT: '#22C55E',
            bg: '#DCFCE7',
          },
          cancelled: {
            DEFAULT: '#EF4444',
            bg: '#FEE2E2',
          },
        },
        // Priority Colors
        priority: {
          critical: {
            DEFAULT: '#DC2626',
            bg: '#FEE2E2',
          },
          high: {
            DEFAULT: '#EA580C',
            bg: '#FFEDD5',
          },
          medium: {
            DEFAULT: '#D97706',
            bg: '#FEF3C7',
          },
          low: {
            DEFAULT: '#2563EB',
            bg: '#DBEAFE',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
