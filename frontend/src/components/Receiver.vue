<script lang="ts" setup>
/* Emits */
defineEmits<{
  close: []
}>();
</script>

<template>
  <div
  class="backdrop-brightness-50 fixed flex inset-0 items-center justify-center z-40">
    <div @click="$emit('close')" class="fixed inset-0"></div>
  </div>
</template>
