<script setup>
const currentUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin
  }

  return ''
})

useHead({
  title: 'Entu Analytics - Privacy-focused Web Analytics',
  meta: [
    { name: 'description', content: 'Self-hosted web analytics solution with OpenSearch backend' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Entu Analytics
        </h1>
        <p class="mt-4 text-lg text-gray-600">
          Privacy-focused web analytics tracking system
        </p>
      </div>

      <div class="mt-12 rounded-lg bg-white p-6 shadow">
        <div class="space-y-8">
          <div>
            <h3 class="mb-2 text-lg font-medium text-gray-900">
              Include the tracking script on your website
            </h3>
            <pre class="overflow-auto rounded-md bg-gray-100 p-4 text-xs"><code>&lt;script src="{{ currentUrl }}/ea.min.js" data-site="YOUR_SITE_ID" crossorigin="anonymous" defer&gt;&lt;/script&gt;</code></pre>
            <p class="mt-2 text-sm text-gray-600">
              * replace <code>YOUR_SITE_ID</code> with a unique identifier for your website.
            </p>
          </div>

          <div>
            <h3 class="mb-2 text-lg font-medium text-gray-900">
              Track custom events (optional)
            </h3>
            <pre class="overflow-auto rounded-md bg-gray-100 p-4 text-xs"><code>window.analytics.track('button_click', {
  button_name: 'signup',
  page: 'homepage'
})</code></pre>
          </div>

          <div>
            <h3 class="mb-2 text-lg font-medium text-gray-900">
              What gets tracked by default
            </h3>
            <ul class="list-inside list-disc space-y-1 text-sm text-gray-600">
              <li>Page views (including SPA navigation)</li>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Device type (Desktop/Mobile/Tablet)</li>
              <li>Screen resolution and viewport size</li>
              <li>Referrer information</li>
              <li>User language</li>
              <li>Session tracking</li>
              <li>Anonymous user tracking</li>
              <li>We use the IP2Location LITE database for <a href="https://lite.ip2location.com">IP geolocation</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
