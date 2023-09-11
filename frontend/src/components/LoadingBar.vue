<template>
  <div class="border-2 border-blue-500 h-5 overflow-hidden relative rounded-xl">
    <div class="absolute bg-strip h-full w-full"></div>
  </div>
</template>

<style scoped>
@keyframes scrolling {
  0% {
    transform: translateX(0);
    width: 0%;
  }
  50% {
    transform: translateX(0);
    width: 100%;
  }
  100% {
    transform: translateX(100%);
  }
}

.bg-strip {
  animation: scrolling 3s linear infinite;
  background-color: #00afff;
  background: repeating-linear-gradient(-45deg, #008fff, #008fff 10px, #00afff 10px, #00afff 20px);
}
</style>
