import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default <Partial<Config>>{
  theme: {
    fontFamily: {
      smiley: ['smiley-sans', ...defaultTheme.fontFamily.sans]
    }
  }
};
