// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss'
  ],
  ssr: false,
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      script: [
        { src: '/ea.min.js', 'data-site': process.env.NUXT_PUBLIC_SITE, crossorigin: 'anonymous', defer: true }
      ]
    }
  },
  spaLoadingTemplate: false,
  runtimeConfig: {
    opensearchHostname: '',
    opensearchPort: '',
    opensearchUsername: '',
    opensearchPassword: '',
    ip2locationToken: '',
    public: {
      site: ''
    }
  },
  eslint: {
    config: {
      autoInit: false,
      stylistic: true
    }
  },
  tailwindcss: {
    cssPath: './app/assets/tailwind.css',
    configPath: './.config/tailwind.config.ts'
  },
  nitro: {
    routeRules: {
      '/ea.js': {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=86400' // 24 hours cache
        }
      },
      '/ea.min.js': {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=86400' // 24 hours cache
        }
      },
      '/api/**': {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      }
    }
  }
})
