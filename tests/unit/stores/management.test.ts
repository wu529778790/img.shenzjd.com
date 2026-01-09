import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useManagementStore } from '~/stores/management'

describe('Management Store', () => {
  let managementStore: ReturnType<typeof useManagementStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    managementStore = useManagementStore()
  })

  it('should initialize with default state', () => {
    expect(managementStore.files).toEqual([])
    expect(managementStore.loading).toBe(false)
    expect(managementStore.currentPath).toBe('')
    expect(managementStore.selectedFiles).toBeInstanceOf(Set)
    expect(managementStore.selectedFiles.size).toBe(0)
    expect(managementStore.searchQuery).toBe('')
  })

  it('should toggle file selection', () => {
    // 手动设置文件
    managementStore.$state.files = [
      { name: 'file1.jpg', path: 'images/file1.jpg', size: 1024, downloadUrl: 'https://example.com/file1.jpg', sha: 'sha1' },
      { name: 'file2.jpg', path: 'images/file2.jpg', size: 2048, downloadUrl: 'https://example.com/file2.jpg', sha: 'sha2' },
    ]

    // 选择文件
    managementStore.toggleFileSelection('images/file1.jpg')
    expect(managementStore.selectedFiles.size).toBe(1)
    expect(managementStore.selectedFiles.has('images/file1.jpg')).toBe(true)

    // 再次点击取消选择
    managementStore.toggleFileSelection('images/file1.jpg')
    expect(managementStore.selectedFiles.size).toBe(0)
  })

  it('should select all files', () => {
    // 手动设置文件
    managementStore.$state.files = [
      { name: 'file1.jpg', path: 'images/file1.jpg', size: 1024, downloadUrl: 'https://example.com/file1.jpg', sha: 'sha1' },
      { name: 'file2.jpg', path: 'images/file2.jpg', size: 2048, downloadUrl: 'https://example.com/file2.jpg', sha: 'sha2' },
    ]

    // 全选
    managementStore.toggleSelectAll()
    expect(managementStore.selectedFiles.size).toBe(2)
    expect(managementStore.selectedFiles.has('images/file1.jpg')).toBe(true)
    expect(managementStore.selectedFiles.has('images/file2.jpg')).toBe(true)

    // 取消全选
    managementStore.toggleSelectAll()
    expect(managementStore.selectedFiles.size).toBe(0)
  })

  it('should set search query', () => {
    const searchQuery = 'test'
    managementStore.setSearchQuery(searchQuery)
    expect(managementStore.searchQuery).toBe(searchQuery)
  })

  it('should filter files based on search query', () => {
    // 手动设置文件
    managementStore.$state.files = [
      { name: 'file1.jpg', path: 'images/file1.jpg', size: 1024, downloadUrl: 'https://example.com/file1.jpg', sha: 'sha1' },
      { name: 'test.jpg', path: 'images/test.jpg', size: 2048, downloadUrl: 'https://example.com/test.jpg', sha: 'sha2' },
      { name: 'other.jpg', path: 'images/other.jpg', size: 3072, downloadUrl: 'https://example.com/other.jpg', sha: 'sha3' },
    ]

    // 设置搜索查询
    managementStore.setSearchQuery('test')
    const filteredFiles = managementStore.getFilteredFiles
    
    expect(filteredFiles).toHaveLength(1)
    const filteredFile = filteredFiles[0]
    expect(filteredFile).toBeDefined()
    if (filteredFile) {
      expect(filteredFile.name).toBe('test.jpg')
    }

    // 清空搜索查询
    managementStore.setSearchQuery('')
    expect(managementStore.getFilteredFiles).toHaveLength(3)
  })

  it('should count selected files', () => {
    // 手动设置文件
    managementStore.$state.files = [
      { name: 'file1.jpg', path: 'images/file1.jpg', size: 1024, downloadUrl: 'https://example.com/file1.jpg', sha: 'sha1' },
      { name: 'file2.jpg', path: 'images/file2.jpg', size: 2048, downloadUrl: 'https://example.com/file2.jpg', sha: 'sha2' },
    ]

    // 选择一个文件
    managementStore.toggleFileSelection('images/file1.jpg')
    expect(managementStore.getSelectedCount).toBe(1)

    // 选择另一个文件
    managementStore.toggleFileSelection('images/file2.jpg')
    expect(managementStore.getSelectedCount).toBe(2)

    // 取消选择一个文件
    managementStore.toggleFileSelection('images/file1.jpg')
    expect(managementStore.getSelectedCount).toBe(1)
  })
})
