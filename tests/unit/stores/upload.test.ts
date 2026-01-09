import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUploadStore } from '~/stores/upload'

describe('Upload Store', () => {
  let uploadStore: ReturnType<typeof useUploadStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    uploadStore = useUploadStore()
  })

  it('should initialize with default state', () => {
    expect(uploadStore.uploading).toBe(false)
    expect(uploadStore.files).toEqual([])
    expect(uploadStore.totalProgress).toBe(0)
  })

  it('should add files', () => {
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const fileList = [mockFile] as unknown as FileList

    uploadStore.addFiles(fileList)

    expect(uploadStore.files).toHaveLength(1)
    const addedFile = uploadStore.files[0]
    expect(addedFile).toBeDefined()
    if (addedFile) {
      expect(addedFile.file).toBe(mockFile)
      expect(addedFile.id).toBeDefined()
      expect(addedFile.status).toBe('pending')
    }
  })

  it('should remove file', () => {
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const fileList = [mockFile] as unknown as FileList

    uploadStore.addFiles(fileList)
    const fileId = uploadStore.files[0]?.id
    if (fileId) {
      uploadStore.removeFile(fileId)
    }

    expect(uploadStore.files).toHaveLength(0)
  })

  it('should clear all files', () => {
    const mockFile1 = new File(['test content 1'], 'test1.jpg', { type: 'image/jpeg' })
    const mockFile2 = new File(['test content 2'], 'test2.jpg', { type: 'image/jpeg' })
    const fileList = [mockFile1, mockFile2] as unknown as FileList

    uploadStore.addFiles(fileList)
    uploadStore.clearFiles()

    expect(uploadStore.files).toHaveLength(0)
  })

  it('should update total progress', () => {
    const mockFile1 = new File(['test content 1'], 'test1.jpg', { type: 'image/jpeg' })
    const mockFile2 = new File(['test content 2'], 'test2.jpg', { type: 'image/jpeg' })
    const fileList = [mockFile1, mockFile2] as unknown as FileList

    uploadStore.addFiles(fileList)
    uploadStore.updateTotalProgress()

    expect(uploadStore.totalProgress).toBe(0)
  })
})
