/// Tailwind CSS config
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

/* Export config */
export default <Partial<Config>>{
  theme: {
    fontFamily: {
      smiley: ['smiley-sans', ...defaultTheme.fontFamily.sans]
    }
  }
};
