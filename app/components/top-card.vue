<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  }
})

const { showPercentage, toggleDisplay } = useTopCardDisplay()

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))

function formatValue (value) {
  if (showPercentage.value && total.value > 0) {
    return Math.round((value / total.value) * 100) + '%'
  }
  return value
}

function getBarWidth (value) {
  if (total.value === 0) return '0%'
  return Math.round((value / total.value) * 100) + '%'
}
</script>

<template>
  <div class="flex h-full flex-col rounded-lg bg-white p-4">
    <h3 class="mb-4 text-lg font-medium text-gray-900">
      {{ title }}
    </h3>
    <div
      v-if="items.length === 0"
      class="flex flex-1 items-center justify-center text-gray-300"
    >
      No data
    </div>
    <div
      v-else
      class="space-y-1.5"
    >
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="relative flex items-center justify-between px-2 py-1"
      >
        <div
          class="absolute inset-y-0 left-0 rounded bg-slate-100"
          :style="{ width: getBarWidth(item.value) }"
        />
        <span class="relative truncate text-sm text-gray-600">{{ item.label || '-' }}</span>
        <span
          class="relative ml-2 cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600"
          @click="toggleDisplay"
        >{{ formatValue(item.value) }}</span>
      </div>
    </div>
  </div>
</template>
