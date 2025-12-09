<script setup>
const route = useRoute()
const site = computed(() => route.params.site || '')
const days = ref(parseInt(route.query.days) || 7)
const stats = ref(null)
const loading = ref(false)
const error = ref(null)
const activeChart = ref('pageviews')

const chartData = computed(() => {
  if (!stats.value) return []
  switch (activeChart.value) {
    case 'events': return stats.value.dailyEvents
    case 'visitors': return stats.value.dailyVisitors
    case 'sessions': return stats.value.dailySessions
    default: return stats.value.dailyPageviews
  }
})

const chartLabel = computed(() => {
  switch (activeChart.value) {
    case 'events': return 'events'
    case 'visitors': return 'visitors'
    case 'sessions': return 'sessions'
    default: return 'pageviews'
  }
})

function formatDateTime (date) {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

async function fetchStats () {
  if (!site.value) return

  loading.value = true
  error.value = null

  try {
    stats.value = await $fetch(`/api/${site.value}`, {
      query: { days: days.value }
    })
  }
  catch (e) {
    error.value = 'Failed to load analytics'
  }
  finally {
    loading.value = false
  }
}

watch(days, () => {
  if (site.value) {
    navigateTo({ query: { site: site.value, days: days.value } }, { replace: true })
    fetchStats()
  }
})

onMounted(() => {
  if (site.value) {
    fetchStats()
  }
})

useHead({
  title: computed(() => stats.value?.name ? `Analytics - ${stats.value.name}` : 'Analytics Dashboard')
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-7xl">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>
          <p
            v-if="stats?.name"
            class="text-slate-500"
          >
            {{ stats.name }}
          </p>
        </div>

        <select
          v-model="days"
          class="rounded-md bg-transparent px-2 py-1 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option :value="1">
            Last 24 hours
          </option>
          <option :value="7">
            Last 7 days
          </option>
          <option :value="30">
            Last 30 days
          </option>
          <option :value="90">
            Last 90 days
          </option>
          <option :value="365">
            Last year
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-1 items-center justify-center text-slate-500"
    >
      Loading...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex flex-1 items-center justify-center"
    >
      <div class="text-red-700">
        {{ error }}
      </div>
    </div>

    <!-- Stats -->
    <div
      v-else-if="stats"
      class="mx-auto w-full max-w-7xl space-y-6"
    >
      <!-- Overview Cards -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <stat-card
          label="Pageviews"
          :value="stats.totalPageviews"
          :active="activeChart === 'pageviews'"
          @hover="activeChart = 'pageviews'"
        />
        <stat-card
          label="Events"
          :value="stats.totalEvents"
          :active="activeChart === 'events'"
          @hover="activeChart = 'events'"
        />
        <stat-card
          label="Visitors"
          :value="stats.totalVisitors"
          :active="activeChart === 'visitors'"
          @hover="activeChart = 'visitors'"
        />
        <stat-card
          label="Sessions"
          :value="stats.totalSessions"
          :active="activeChart === 'sessions'"
          @hover="activeChart = 'sessions'"
        />
      </div>

      <!-- Chart -->
      <bar-chart
        :data="chartData"
        :label="chartLabel"
        :days="days"
      />

      <!-- Data Tables -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <top-card
          title="Pages"
          :items="stats.topPages"
        />
        <top-card
          title="Events"
          :items="stats.topEvents"
        />
        <top-card
          title="Referrers"
          :items="stats.topReferrers"
        />
        <top-card
          title="Countries"
          :items="stats.topCountries"
        />
        <top-card
          title="Operating Systems"
          :items="stats.topOS"
        />
        <top-card
          title="Browsers"
          :items="stats.topBrowsers"
        />
      </div>

      <!-- Recent Pageviews -->
      <div class="rounded-lg bg-white p-4">
        <h3 class="mb-4 text-lg font-medium text-slate-900">
          Recent Pageviews
        </h3>
        <div
          v-if="stats.recentPageviews.length === 0"
          class="text-slate-500"
        >
          No data
        </div>
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th class="py-2 pr-3 text-left text-xs font-medium uppercase text-slate-500">
                  Time
                </th>
                <th class="py-2 pr-3 text-left text-xs font-medium uppercase text-slate-500">
                  Page
                </th>
                <th class="py-2 pr-3 text-left text-xs font-medium uppercase text-slate-500">
                  Country
                </th>
                <th class="py-2 pr-3 text-left text-xs font-medium uppercase text-slate-500">
                  Browser
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(pv, idx) in stats.recentPageviews"
                :key="idx"
              >
                <td class="whitespace-nowrap py-2 pr-3 text-sm text-slate-500">
                  {{ formatDateTime(pv.date) }}
                </td>
                <td class="max-w-xs truncate py-2 pr-3 text-sm text-slate-900">
                  {{ pv.path }}
                </td>
                <td class="py-2 pr-3 text-sm text-slate-500">
                  {{ pv.country || '-' }}
                </td>
                <td class="py-2 pr-3 text-sm text-slate-500">
                  {{ pv.browser?.name || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
