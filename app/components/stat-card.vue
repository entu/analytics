<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

defineEmits(['hover'])
</script>

<template>
  <div
    class="cursor-pointer rounded-lg bg-white p-4 transition-colors"
    :class="active ? 'border-2 border-slate-500' : ' hover:bg-slate-50 border-2 border-transparent'"
    @mouseenter="$emit('hover')"
  >
    <div class="text-sm font-bold tracking-wide text-slate-500">
      {{ label }}
    </div>
    <div class="mt-1 text-3xl font-bold">
      {{ typeof value === 'number' ? value.toLocaleString() : value }}
    </div>
  </div>
</template>
