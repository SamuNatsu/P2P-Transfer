<template>
  <ClientOnly>
    <notifications position="top center"/>
  </ClientOnly>
  <div class="bg-gray-50 fixed flex flex-col gap-12 items-center inset-0 justify-center">
    <AppLangSwitch/>
    <AppHeader/>
    <main class="flex flex-col items-center gap-4">
      <NuxtPage/>
    </main>
    <AppFooter/>
  </div>
</template>
