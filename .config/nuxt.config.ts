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
    public: {
      siteId: process.env.NUXT_PUBLIC_SITE || ''
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
  }
})
