import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom', // 使用happy-dom模拟浏览器环境
    dir: './tests',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', '.nuxt', 'dist'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**/*.ts', '**/*.vue'],
      exclude: ['node_modules', '.nuxt', 'dist', 'tests', 'server'],
    },
  },
  resolve: {
    alias: {
      // 映射@别名到项目根目录
      '@': resolve(__dirname, '.'),
      // 其他可能需要的别名
      '~': resolve(__dirname, '.'),
    },
    extensions: ['.js', '.ts', '.vue'],
  },
})
