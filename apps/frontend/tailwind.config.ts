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
      typography: {
        DEFAULT: {
          css: {
            // Code inline
            'code': {
              border: '2px solid #1f2937',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.25rem',
              paddingLeft: '0.375rem',
              paddingRight: '0.375rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              fontWeight: '600',
              color: '#1f2937',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            // Code block
            'pre': {
              border: '2px solid #1f2937',
              backgroundColor: '#111827',
              color: '#f3f4f6',
              borderRadius: '0.375rem',
              boxShadow: '2px 2px 0px 0px #d1d5db',
            },
            'pre code': {
              border: 'none',
              backgroundColor: 'transparent',
              padding: '0',
              fontWeight: 'normal',
              color: 'inherit',
            },
            // Blockquote
            'blockquote': {
              borderLeft: '4px solid #2563eb',
              backgroundColor: '#eff6ff',
              borderRadius: '0.375rem',
              padding: '1rem',
              boxShadow: '2px 2px 0px 0px #d1d5db',
              fontStyle: 'normal',
              fontWeight: '400',
              color: '#1f2937',
            },
            'blockquote p:first-of-type::before': {
              content: '""',
            },
            'blockquote p:last-of-type::after': {
              content: '""',
            },
            // Table
            'thead th': {
              borderBottom: '2px solid #1f2937',
              fontWeight: '700',
              color: '#1f2937',
            },
            'tbody tr': {
              borderBottom: '2px solid #e5e7eb',
            },
            'tbody td': {
              border: '2px solid #e5e7eb',
              padding: '0.5rem',
            },
            // Links
            'a': {
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: '600',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            // Headings
            'h2': {
              fontWeight: '700',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '0.5rem',
            },
            'h3': {
              fontWeight: '700',
            },
            // Horizontal rule
            'hr': {
              borderTop: '2px solid #1f2937',
            },
            // Images
            'img': {
              border: '2px solid #1f2937',
              borderRadius: '0.375rem',
              boxShadow: '2px 2px 0px 0px #d1d5db',
            },
            // Strong
            'strong': {
              fontWeight: '700',
              color: '#111827',
            },
            // List markers
            'ul > li::marker': {
              color: '#1f2937',
            },
            'ol > li::marker': {
              color: '#1f2937',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
