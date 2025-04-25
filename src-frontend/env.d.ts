/// <reference types="@rsbuild/core/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // biome-ignore lint/complexity/noBannedTypes: reason
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

declare module '~icons/*' {
  export default SVGElement;
}
