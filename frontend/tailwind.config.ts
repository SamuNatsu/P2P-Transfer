/// Tailwind config
import type { Config } from 'tailwindcss';

import { fontFamily } from 'tailwindcss/defaultTheme';

// Export config
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'mi-sans': ['mi-sans', ...fontFamily.sans]
      }
    }
  },
  plugins: []
} satisfies Config;
