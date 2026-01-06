// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // 开发工具
  devtools: { enabled: true },

  // 应用配置
  app: {
    head: {
      title: '图床应用 - GitHub OAuth',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '基于 GitHub OAuth 的现代化图床应用' },
        { name: 'theme-color', content: '#4975c6' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  // 模块配置
  modules: [
    '@nuxtjs/tailwindcss',
    '@element-plus/nuxt',
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],

  // TailwindCSS 配置
  tailwindcss: {
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: true
  },

  // Element Plus 配置
  elementPlus: {
    importStyle: 'css',
    themes: ['dark']
  },

  // i18n 配置
  i18n: {
    locales: [
      { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'zh-TW', name: '繁体中文', file: 'zh-TW.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'zh-CN',
    langDir: './locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    bundle: {
      optimizeTranslationDirective: false
    }
  },

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
    },
    // 公共配置
    public: {
      apiBase: '/api',
      githubOAuthUrl: 'https://github.com/login/oauth/authorize',
      githubApiUrl: 'https://api.github.com',
      defaultRepoOwner: 'wu529778790',
      defaultRepoName: 'img.shenzjd.com'
    }
  },

  // TypeScript 配置
  typescript: {
    typeCheck: false, // Temporarily disabled for initial build
    tsConfig: {
      compilerOptions: {
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        strictFunctionTypes: false,
        noImplicitThis: false,
        noImplicitReturns: false,
        exactOptionalPropertyTypes: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        allowUnreachableCode: true,
        noFallthroughCasesInSwitch: false,
        noUncheckedIndexedAccess: false
      }
    }
  },

  // 构建配置
  build: {
    transpile: ['element-plus']
  },

  // 开发服务器
  devServer: {
    port: 3000,
    host: 'localhost'
  },

  // 路由别名
  alias: {
    '@': '.'
  },

  // 优化
  experimental: {
    payloadExtraction: true,
    asyncContext: true
  },

  // SSR 配置
  ssr: true,

  // Nitro 配置 (服务端)
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  }
})
