import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: { extend: { fontFamily: { sans: ['var(--font-inter)'] }, boxShadow: { soft: '0 20px 60px rgba(30, 64, 175, .10)' } } },
  plugins: [],
};
export default config;
