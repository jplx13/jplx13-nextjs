import type React from "react"
export interface AgentType {
  icon: React.ComponentType<{ size?: number }>
  color: string
  label: string
  emoji: string
  tooltip: string
}

export interface AgentSelection {
  icon: string
  color: string
  label: string
  tooltip: string
}

export interface ChatMessage {
  id: number
  role: "user" | "assistant"
  content: string
  agent?: string
  model?: string
  file?: FileInfo
  downloadUrl?: string
  timestamp?: Date
  isError?: boolean
}

export interface FileInfo {
  name: string
  size: number
  type?: string
}

export interface Conversation {
  id: number
  title: string
  active: boolean
  lastMessage: string
  timestamp: string
}

export interface APIResponse {
  response?: {
    content: string
    agent: string
    model: string
  }
  document?: {
    generated: boolean
    downloadUrl: string
  }
}

export interface UploadState {
  progress: number
  error: string | null
  isUploading: boolean
}

export interface AgentState {
  selected: string
  isLoading: boolean
  showTooltip: string | null
}
