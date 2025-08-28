import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT:'#0ea5e9', 600:'#0284c7', 700:'#0369a1' }
      },
      boxShadow: { soft:'0 8px 30px rgba(2,8,23,0.35)' }
    }
  },
  plugins: []
}
export default config
