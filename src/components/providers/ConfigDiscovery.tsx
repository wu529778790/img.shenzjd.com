'use client'

import { useConfigDiscovery } from '@/hooks/useConfigDiscovery'

/**
 * 配置发现组件
 * 登录后自动搜索并加载 GitHub 仓库中的配置
 */
export function ConfigDiscovery() {
  // 在登录后自动发现并加载配置
  useConfigDiscovery()
  return null
}
