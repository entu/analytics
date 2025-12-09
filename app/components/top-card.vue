<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div class="rounded-lg bg-white p-4">
    <h3 class="mb-4 text-lg font-medium text-gray-900">
      {{ title }}
    </h3>
    <div
      v-if="items.length === 0"
      class="text-gray-500"
    >
      No data
    </div>
    <div
      v-else
      class="divide-y divide-gray-100"
    >
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="flex items-center justify-between py-2"
      >
        <span class="truncate text-sm text-gray-600">{{ item.label || '-' }}</span>
        <span class="ml-2 text-sm font-medium text-gray-900">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>
