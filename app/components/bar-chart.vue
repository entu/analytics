<script setup>
const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    default: 'items'
  },
  days: {
    type: Number,
    default: 7
  }
})

function getBarHeight (count) {
  if (!props.data?.length) return '0%'
  const max = Math.max(...props.data.map((d) => d.count))
  if (!max) return '0%'
  return `${(count / max) * 100}%`
}

function formatDate (dateStr) {
  // Weekly format: YYYY-WXX
  if (dateStr.includes('-W')) {
    const [year, week] = dateStr.split('-W')
    return `Week ${parseInt(week)}, ${year}`
  }

  const date = new Date(dateStr)

  if (props.days === 1) {
    // Hourly: show just the hour
    return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  if (props.days <= 7) {
    // 6-hour slots: show date + hour
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // Daily: show date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="rounded-lg bg-white p-4">
    <div
      v-if="!data || data.length === 0"
      class="flex h-48 items-center justify-center text-slate-500"
    >
      No data
    </div>
    <div v-else>
      <div class="flex h-48 items-end gap-px overflow-hidden">
        <div
          v-for="item in data"
          :key="item.date"
          class="group relative flex min-w-[2px] flex-1 flex-col items-center justify-end self-stretch"
        >
          <span
            v-if="item.count > 0"
            class="mb-1 text-xs text-slate-500"
          >{{ item.count }}</span>
          <div
            class="w-full rounded bg-slate-400"
            :style="`height: ${getBarHeight(item.count)}; min-height: ${item.count > 0 ? '4px' : '0'}`"
          />
          <div class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-6 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
            {{ item.count }} {{ label }}<br>{{ formatDate(item.date) }}
          </div>
        </div>
      </div>
      <div class="mt-2 flex justify-between text-xs text-slate-500">
        <span>{{ formatDate(data[0].date) }}</span>
        <span>{{ formatDate(data[data.length - 1].date) }}</span>
      </div>
    </div>
  </div>
</template>
