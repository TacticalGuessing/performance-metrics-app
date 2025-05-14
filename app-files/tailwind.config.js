/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // Ensure this line matches your project (src/app for App Router)
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#111827',    // e.g., bg-gray-900
          secondary: '#1F2937',  // e.g., bg-gray-800
          tertiary: '#374151',   // e.g., bg-gray-700
        },
        textClr: { // Renamed from 'text' to avoid conflict
          primary: '#F9FAFB',    // e.g., text-gray-50
          secondary: '#9CA3AF',  // e.g., text-gray-400
          placeholder: '#6B7280',// e.g., text-gray-500
          accent: '#10B981',     // e.g., text-emerald-500
          'on-accent': '#FFFFFF',// e.g., text-white
        },
        accent: {
          primary: '#10B981',    // e.g., emerald-500
          hover: '#059669',      // e.g., emerald-600
          'focus-ring': '#34D399',// e.g., emerald-400 (used for ring color, not bg)
        },
        borderClr: { // Renamed from 'border'
          primary: '#374151',    // e.g., border-gray-700
          accent: '#10B981',     // e.g., border-emerald-500
        },
        status: {
          good: {
            bg: '#059669',       // e.g., bg-emerald-600 or bg-green-600
            text: '#D1FAE5',     // e.g., text-emerald-100 or text-green-100
          },
          ok: {
            bg: '#D97706',       // e.g., bg-amber-600
            text: '#FEF3C7',     // e.g., text-amber-100
          },
          bad: {
            bg: '#DC2626',       // e.g., bg-red-600
            text: '#FEE2E2',     // e.g., text-red-100
          }
        }
      },
      borderRadius: {
        'minimal': '0.25rem', // Example, maps to 'rounded'
        'card': '0.375rem',   // Example, maps to 'rounded-md'
      }
    },
  },
  plugins: [],
};