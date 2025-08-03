"use client"

import { useState, useCallback } from "react"
import type { UploadState } from "../types/chat"

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
  "text/calendar",
  "image/png",
  "image/jpeg",
  "image/jpg",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    error: null,
    isUploading: false,
  })

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB"
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Please select a valid file type (PDF, DOC, DOCX, TXT, CSV, XLSX, JSON, ICS, PNG, JPG)"
    }

    return null
  }, [])

  const selectFile = useCallback(
    (file: File) => {
      console.log(`📎 File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

      const validationError = validateFile(file)

      if (validationError) {
        console.warn(`❌ File Validation Failed:`, validationError)
        setUploadState((prev) => ({
          ...prev,
          error: validationError,
        }))
        return false
      }

      setSelectedFile(file)
      setUploadState({
        progress: 0,
        error: null,
        isUploading: false,
      })

      console.log(`✅ File validated successfully`)
      return true
    },
    [validateFile],
  )

  const removeFile = useCallback(() => {
    console.log(`🗑️ File removed: ${selectedFile?.name || "No file"}`)
    setSelectedFile(null)
    setUploadState({
      progress: 0,
      error: null,
      isUploading: false,
    })
  }, [selectedFile])

  const setProgress = useCallback((progress: number) => {
    setUploadState((prev) => ({
      ...prev,
      progress,
      isUploading: progress > 0 && progress < 100,
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setUploadState((prev) => ({
      ...prev,
      error,
      isUploading: false,
    }))
  }, [])

  const clearError = useCallback(() => {
    setUploadState((prev) => ({
      ...prev,
      error: null,
    }))
  }, [])

  return {
    selectedFile,
    uploadState,
    selectFile,
    removeFile,
    setProgress,
    setError,
    clearError,
  }
}
