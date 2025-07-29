// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss'
  ],
  ssr: false,
  app: {
    head: {
      htmlAttrs: { lang: 'en' }
    }
  },
  spaLoadingTemplate: false,
  runtimeConfig: {
    opensearchHostname: '',
    opensearchPort: '',
    opensearchUsername: '',
    opensearchPassword: ''
  },
  eslint: {
    config: {
      autoInit: false,
      stylistic: true
    }
  },
  tailwindcss: {
    cssPath: '~/assets/tailwind.css',
    configPath: '~~/.config/tailwind.config.js'
  }
})
