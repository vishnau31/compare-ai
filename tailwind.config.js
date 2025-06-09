/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
   
      // Or if using `src` directory:
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            start: '#FF6B2C',
            end: '#FF4F8B',
          },
          surface: {
            light: '#FFFFFF',
            DEFAULT: '#F8F9FA',
            dark: '#E9ECEF',
          },
        },
        boxShadow: {
          'subtle': '0 2px 4px rgba(0,0,0,0.05)',
          'elevated': '0 4px 6px rgba(0,0,0,0.07)',
        },
        typography: {
          DEFAULT: {
            css: {
              maxWidth: 'none',
              color: '#1F2937',
              h1: {
                color: '#111827',
              },
              h2: {
                color: '#1F2937',
              },
              h3: {
                color: '#374151',
              },
            },
          },
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
  }