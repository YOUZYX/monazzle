import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'mona-purple': '#6e54ff',
  			'mona-deep-purple': '#200052',
  			'mona-lavender': '#9489fc',
  			'mona-violet': '#6c54f8',
  			'mona-charcoal': '#1f2228',
  			'mona-cream': '#fbfaf9',
  			'mona-slate': '#6f717c',
  			'mona-eggshell': '#f6f3f1',
  			'mona-silver': '#dadada',
  			'mona-ash': '#dee0e3',
  			'mona-linen': '#f2f1f0',
  			'mona-sand': '#ede8e4',
  			'mona-stone': '#c8cad0',
  			'mona-onyx': '#0e100f',
  			'mona-concrete': '#c8c8c8',
  			'mona-red': '#FF3C45',
  			'primary-dark': '#200052',
  			'primary-light': '#9489fc',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'text-dark': '#0e100f',
  			'text-light': '#fbfaf9',
  			'text-muted': '#6f717c',
  			'bg-dark': '#1f2228',
  			'bg-light': '#fbfaf9',
  			'bg-alt-light': '#f6f3f1',
  			'bg-alt-darker': '#ede8e4',
  			'border-light': '#dadada',
  			'border-medium': '#c8cad0',
  			'border-dark': '#6f717c',
  			'neutral-1': '#dee0e3',
  			'neutral-2': '#f2f1f0',
  			'neutral-3': '#c8c8c8',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
