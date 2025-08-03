"use client"

import type React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Send,
  Bot,
  Brain,
  Palette,
  Microscope,
  BarChart3,
  Search,
  CheckCheck,
  Paperclip,
  Download,
  AlertCircle,
  X,
  RefreshCw,
  Edit3,
} from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { ErrorBoundary } from "../components/ErrorBoundary"
import { useAgentSelection } from "../hooks/useAgentSelection"
import { useFileUpload } from "../hooks/useFileUpload"
import { useConversations } from "../hooks/useConversations"
import type { ChatMessage, Conversation, APIResponse, AgentType, AgentSelection } from "../types/chat"

const agentTypes: Record<string, AgentType> = {
  reasoning: {
    icon: Brain,
    color: "#0891b2",
    label: "Reasoning",
    emoji: "🧠",
    tooltip: "Strategic analysis & logical reasoning",
  },
  creative: {
    icon: Palette,
    color: "#ff6b35",
    label: "Creative",
    emoji: "🎨",
    tooltip: "Creative brainstorming & copywriting",
  },
  research: {
    icon: Microscope,
    color: "#06b6d4",
    label: "Research",
    emoji: "🔬",
    tooltip: "Current events & market analysis",
  },
  data: {
    icon: BarChart3,
    color: "#a0a0a0",
    label: "Data",
    emoji: "📊",
    tooltip: "Statistical analysis & visualization",
  },
  auto: {
    icon: Bot,
    color: "#2563eb",
    label: "Auto",
    emoji: "🤖",
    tooltip: "Intelligent agent selection",
  },
}

const agentSelection: Record<string, AgentSelection> = {
  reasoning: { icon: "🧠", color: "#0891b2", label: "Reasoning", tooltip: "Strategic analysis & logical reasoning" },
  creative: { icon: "🎨", color: "#ff6b35", label: "Creative", tooltip: "Creative brainstorming & copywriting" },
  research: { icon: "🔬", color: "#06b6d4", label: "Research", tooltip: "Current events & market analysis" },
  data: { icon: "📊", color: "#a0a0a0", label: "Data", tooltip: "Statistical analysis & visualization" },
  auto: { icon: "🤖", color: "#2563eb", label: "Auto", tooltip: "Intelligent agent selection" },
}

export default function ChatApp() {
  // State Management
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [messageSent, setMessageSent] = useState(false)

  // Custom Hooks
  const { agentState, selectAgent, setLoading: setAgentLoading, setTooltip } = useAgentSelection("auto")
  const { selectedFile, uploadState, selectFile, removeFile, setProgress, setError, clearError } = useFileUpload()
  const {
    conversations,
    currentConversationId,
    currentConversation,
    editingTitleId,
    createConversation,
    switchConversation,
    addMessage,
    deleteConversation,
    updateConversationTitle,
    startEditingTitle,
    cancelEditingTitle,
    clearAllConversations,
    formatTimestamp,
  } = useConversations()

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const agentButtonsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Get current messages from the active conversation
  const messages = currentConversation?.messages || []

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab to cycle through agents
      if (e.key === "Tab" && e.target === inputRef.current) {
        e.preventDefault()
        const agents = Object.keys(agentSelection)
        const currentIndex = agents.indexOf(agentState.selected)
        const nextIndex = (currentIndex + 1) % agents.length
        selectAgent(agents[nextIndex])

        console.log(`⌨️ Keyboard Navigation:`, {
          key: "Tab",
          from: agentState.selected,
          to: agents[nextIndex],
          timestamp: new Date().toISOString(),
        })
      }

      // Escape to clear file
      if (e.key === "Escape" && selectedFile) {
        removeFile()
        console.log(`⌨️ Keyboard Action: File cleared via Escape key`)
      }

      // Ctrl/Cmd + N for new conversation
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        createConversation()
        setInput("")
        removeFile()
        console.log(`⌨️ Keyboard Action: New conversation created`)
      }

      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        searchInput?.focus()
        console.log(`⌨️ Keyboard Action: Search focused`)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [agentState.selected, selectedFile, selectAgent, removeFile, createConversation])

  // Success feedback
  useEffect(() => {
    if (messageSent) {
      const timer = setTimeout(() => setMessageSent(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [messageSent])

  // Sync loading states
  useEffect(() => {
    setAgentLoading(isLoading)
  }, [isLoading, setAgentLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const retryApiCall = async (jsonData: any, attempt = 1): Promise<APIResponse> => {
    const maxRetries = 3

    try {
      console.log(`🚀 API Call - Attempt ${attempt}`, {
        agent: agentState.selected,
        hasFile: !!selectedFile,
        manualOverride: agentState.selected !== "auto",
        timestamp: new Date().toISOString(),
      })

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch("https://jpl13.app.n8n.cloud/webhook/jplx13-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      let data: APIResponse
      try {
        data = await response.json()
      } catch (parseError) {
        const responseText = await response.text()
        console.error(`❌ JSON Parse Error:`, {
          parseError,
          responseText,
          contentType: response.headers.get('content-type'),
        })
        throw new Error(`Failed to parse response as JSON: ${parseError}`)
      }

      console.log(`✅ API Success - Attempt ${attempt}`, {
        agent: data.response?.agent,
        model: data.response?.model,
        hasDownload: !!data.document?.downloadUrl,
        timestamp: new Date().toISOString(),
      })

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const isTimeout = error instanceof Error && error.name === 'AbortError'
      
      console.error(`❌ API Error - Attempt ${attempt}:`, {
        error: errorMessage,
        isTimeout,
        agent: agentState.selected,
        hasFile: !!selectedFile,
        timestamp: new Date().toISOString(),
      })

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return retryApiCall(jsonData, attempt + 1)
      }

      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !selectedFile) return

    console.log(`📤 Message Submission Started:`, {
      hasInput: !!input.trim(),
      hasFile: !!selectedFile,
      selectedAgent: agentState.selected,
      isManualOverride: agentState.selected !== "auto",
      timestamp: new Date().toISOString(),
    })

    // Clear any previous upload errors
    clearError()
    setRetryCount(0)

    // Create a new conversation if none exists
    if (!currentConversationId) {
      createConversation(input.trim())
    }

    // Add user message to display immediately
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      file: selectedFile ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type } : undefined,
      timestamp: new Date(),
    }

    if (input.trim() || selectedFile) {
      addMessage(userMessage)
    }

    setIsLoading(true)
    setProgress(0)
    
    // Prepare JSON payload for n8n webhook
    const jsonPayload: any = {
      timestamp: new Date().toISOString(),
      sessionId: Date.now().toString(),
    }

    if (input.trim()) {
      jsonPayload.chatInput = input.trim()
    }

    // Handle file data - convert to base64 for JSON transmission
    if (selectedFile) {
      setProgress(25)
      try {
        const fileBuffer = await selectedFile.arrayBuffer()
        const base64String = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)))
        jsonPayload.file = {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          data: base64String,
        }
      } catch (fileError) {
        console.error("❌ File processing error:", fileError)
        setError("Failed to process file. Please try again.")
        setIsLoading(false)
        return
      }
    }

    // Manual agent selection with override flag
    if (agentState.selected !== "auto") {
      jsonPayload.selectedAgent = agentState.selected
      jsonPayload.manualOverride = true
      console.log(`🎯 Manual Agent Override Active:`, {
        agent: agentState.selected,
        agentLabel: agentSelection[agentState.selected].label,
        tooltip: agentSelection[agentState.selected].tooltip,
      })
    }

    try {
      setProgress(50)
      
      // Log the JSON payload for debugging
      console.log(`📤 Sending payload to webhook:`, {
        hasFile: !!jsonPayload.file,
        fileSize: jsonPayload.file?.size || 0,
        agent: jsonPayload.selectedAgent || 'auto',
        manualOverride: jsonPayload.manualOverride || false,
      })
      
      const data = await retryApiCall(jsonPayload)
      setProgress(100)

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response?.content || "I received your message but couldn't generate a proper response.",
        agent: data.response?.agent || agentState.selected,
        model: data.response?.model || "GPT-4o",
        downloadUrl: data.document?.generated ? data.document?.downloadUrl : undefined,
        timestamp: new Date(),
      }

      // Log successful response for debugging
      console.log(`✅ Received response:`, {
        hasResponse: !!data.response,
        agent: data.response?.agent,
        model: data.response?.model,
        hasDownload: !!data.document?.downloadUrl,
      })

      addMessage(aiMessage)
      setMessageSent(true)

      setInput("")
      removeFile()
      setProgress(0)

      console.log(`✅ Message Submission Completed Successfully`)

      // Focus back to input
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ JPLx13-HE Final API Error:", {
        error: errorMessage,
        retryCount: retryCount + 1,
        timestamp: new Date().toISOString(),
      })

      const errorMsg = isTimeout 
        ? `Request timed out after ${retryCount + 1} attempts. Please try again.`
        : `Connection failed after ${retryCount + 1} attempts. Please try again.`
      setError(errorMsg)

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please check your connection and try again.",
        agent: "system",
        model: "error",
        isError: true,
        timestamp: new Date(),
      }

      addMessage(errorChatMessage)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      selectFile(file)
    }
  }

  const getAgentInfo = (agentKey: string) => {
    return agentTypes[agentKey] || agentTypes.auto
  }

  const handleAgentSelect = (agentKey: string) => {
    selectAgent(agentKey)
  }

  const handleRetry = () => {
    console.log(`🔄 Manual Retry Triggered`)
    // Re-trigger the submit with the same data
    if (input.trim() || selectedFile) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  }

  // Handle title editing
  const handleTitleClick = useCallback((e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    startEditingTitle(conversationId)
  }, [startEditingTitle])

  const handleTitleEdit = useCallback((conversationId: string, newTitle: string) => {
    updateConversationTitle(conversationId, newTitle)
  }, [updateConversationTitle])

  const handleTitleEditCancel = useCallback(() => {
    cancelEditingTitle()
  }, [cancelEditingTitle])

  // Clickable title component for sidebar
  const ClickableTitle = ({ conversation }: { conversation: Conversation }) => {
    const [editValue, setEditValue] = useState(conversation.title)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (editingTitleId === conversation.id && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [editingTitleId, conversation.id])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTitleEdit(conversation.id, editValue)
      } else if (e.key === 'Escape') {
        setEditValue(conversation.title)
        handleTitleEditCancel()
      }
    }

    const handleBlur = () => {
      handleTitleEdit(conversation.id, editValue)
    }

    if (editingTitleId === conversation.id) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="bg-transparent border border-blue-400 rounded px-1 outline-none text-white font-medium text-sm"
          style={{ fontSize: "15px" }}
          maxLength={50}
        />
      )
    }

    return (
      <div
        onClick={(e) => handleTitleClick(e, conversation.id)}
        className="conversation-title font-medium text-sm mb-1 cursor-pointer hover:text-blue-300 transition-colors duration-200 group flex items-center gap-1"
        style={{ fontSize: "15px" }}
        title="Click to edit title"
      >
        <span>{conversation.title}</span>
        <Edit3 
          size={12} 
          className="opacity-0 group-hover:opacity-60 transition-opacity duration-200" 
          style={{ color: "#a0a0a0" }}
        />
      </div>
    )
  }

  // Editable header title component
  const EditableHeaderTitle = () => {
    const [editValue, setEditValue] = useState(currentConversation?.title || "")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      setEditValue(currentConversation?.title || "")
    }, [currentConversation?.title])

    useEffect(() => {
      if (editingTitleId === currentConversation?.id && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, [editingTitleId, currentConversation?.id])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && currentConversation) {
        handleTitleEdit(currentConversation.id, editValue)
      } else if (e.key === 'Escape') {
        setEditValue(currentConversation?.title || "")
        handleTitleEditCancel()
      }
    }

    const handleBlur = () => {
      if (currentConversation) {
        handleTitleEdit(currentConversation.id, editValue)
      }
    }

    if (editingTitleId === currentConversation?.id) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="bg-transparent border border-blue-400 rounded px-2 outline-none text-white font-medium"
          style={{
            fontSize: "clamp(24px, 5vw, 32px)",
            fontWeight: "600",
          }}
          maxLength={50}
        />
      )
    }

    return (
      <h2
        onClick={() => currentConversation && startEditingTitle(currentConversation.id)}
        className="text-xl sm:text-2xl font-medium mb-1 cursor-pointer hover:text-blue-300 transition-colors duration-200 group flex items-center gap-2"
        style={{
          color: "#ffffff",
          fontSize: "clamp(24px, 5vw, 32px)",
          fontWeight: "600",
        }}
        title={currentConversation ? "Click to edit title" : ""}
      >
        <span>{currentConversation?.title || "JPLx13 Chat"}</span>
        {currentConversation && (
          <Edit3 
            size={16} 
            className="opacity-0 group-hover:opacity-60 transition-opacity duration-200" 
            style={{ color: "#a0a0a0" }}
          />
        )}
      </h2>
    )
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen p-3 sm:p-5 flex overflow-hidden" style={{ gap: "12px" }}>
        {/* Left Sidebar with Background Shadow */}
        <div className="sidebar-container w-72 sm:w-80 flex-shrink-0 rounded-xl">
          <div className="sidebar rounded-xl flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className="text-2xl sm:text-3xl font-semibold"
                  style={{
                    color: "#ffffff",
                    fontSize: "clamp(24px, 5vw, 32px)",
                    fontWeight: "600",
                  }}
                >
                  JPLx13
                </h1>
                {isOnline && <div className="online-indicator" />}
                {messageSent && (
                  <div
                    className="text-xs px-2 py-1 rounded-full animate-pulse"
                    style={{
                      background: "rgba(8, 145, 178, 0.2)",
                      color: "#0891b2",
                      fontSize: "10px",
                    }}
                  >
                    Sent ✓
                  </div>
                )}
              </div>
              <p
                className="text-sm sm:text-base font-normal"
                style={{
                  color: "#e0e0e0",
                  fontSize: "clamp(14px, 3vw, 16px)",
                  fontWeight: "400",
                }}
              >
                Multi-Agent Brain Expander
              </p>
              {conversations.length > 0 && (
                <div
                  className="text-xs mt-1"
                  style={{
                    color: "#a0a0a0",
                    fontSize: "12px",
                  }}
                >
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input w-full pr-10 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#0891b2]"
                  style={{
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "14px",
                  }}
                />
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                  style={{ color: "#a0a0a0" }}
                />
              </div>
              {conversations.length > 0 && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all conversations? This action cannot be undone.")) {
                        clearAllConversations()
                      }
                    }}
                    className="text-xs px-2 py-1 rounded transition-all duration-200 hover:bg-red-500/20"
                    style={{
                      color: "#a0a0a0",
                      fontSize: "11px",
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* New Conversation Button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  createConversation()
                  setInput("")
                  removeFile()
                }}
                className="new-conversation-button w-full flex items-center gap-3 h-12 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02]"
                style={{
                  color: "white",
                  padding: "12px 24px",
                  fontWeight: "500",
                }}
              >
                <Plus size={20} />
                New Conversation
              </button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 px-4 scrollbar-thin">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <div style={{ color: "#a0a0a0", fontSize: "14px" }}>
                      No conversations yet
                    </div>
                    <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                      Start a new conversation to begin
                    </div>
                  </div>
                ) : (
                  conversations
                    .filter(conv => 
                      searchQuery === "" || 
                      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conv) => (
                                         <div
                       key={conv.id}
                       onClick={() => switchConversation(conv.id)}
                       className="conversation-item group cursor-pointer transition-all duration-200 rounded-lg border"
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        color: "#e0e0e0",
                        borderColor: conv.active ? "rgba(8, 145, 178, 0.4)" : "rgba(255, 255, 255, 0.08)",
                        background: conv.active ? "rgba(8, 145, 178, 0.1)" : "transparent",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <ClickableTitle conversation={conv} />
                          <div className="text-xs opacity-75 line-clamp-2 mb-2" style={{ fontSize: "14px" }}>
                            {conv.lastMessage || "No messages yet"}
                          </div>
                          <div
                            className="text-xs"
                            style={{
                              color: "#a0a0a0",
                              fontSize: "12px",
                              fontWeight: "400",
                            }}
                          >
                            {formatTimestamp(conv.timestamp)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conv.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-red-500/20"
                          style={{ color: "#a0a0a0" }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Chat Area with Background Shadow */}
        <div className="main-area-container flex-1 min-w-0 rounded-xl">
          <div className="main-area rounded-xl flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 sm:p-6 pb-5 border-b border-gray-700 flex-shrink-0">
              <EditableHeaderTitle />
              <p
                className="text-sm font-normal"
                style={{
                  color: "#e0e0e0",
                  fontSize: "clamp(14px, 3vw, 16px)",
                  fontWeight: "400",
                }}
              >
                {currentConversation 
                  ? `${currentConversation.messages.length} messages • ${formatTimestamp(currentConversation.updatedAt)}`
                  : "Start a new conversation"
                }
              </p>
            </div>

            {/* Messages Area - Expanded */}
            <ScrollArea className="flex-1 p-4 sm:p-6 scrollbar-thin min-h-0">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <Bot size={48} className="mx-auto mb-6 sm:mb-6" style={{ color: "#0891b2" }} />
                    <h3
                      className="text-lg sm:text-xl font-medium mb-3"
                      style={{
                        color: "#ffffff",
                        fontSize: "clamp(20px, 4vw, 28px)",
                        fontWeight: "600",
                      }}
                    >
                      {currentConversation ? "Start a conversation" : "Welcome to JPLx13"}
                    </h3>
                    <p
                      className="text-sm sm:text-base mb-6 sm:mb-8"
                      style={{
                        color: "#e0e0e0",
                        fontSize: "clamp(14px, 3vw, 18px)",
                        fontWeight: "400",
                        maxWidth: "500px",
                        margin: "0 auto 32px auto",
                      }}
                    >
                      {currentConversation 
                        ? "Type your message below to start chatting with your AI assistant."
                        : "Your AI assistant with specialized agents for different tasks. Select an agent below or let Auto mode choose the best one for your query."
                      }
                    </p>

                    {/* Sample Chat Messages - More Prominent */}
                    <div className="chat-examples mb-6 sm:mb-8 max-w-3xl mx-auto">
                      <div
                        className="user-message user-message-bubble"
                        style={{
                          padding: "12px 16px",
                          maxWidth: "75%",
                          marginLeft: "auto",
                          marginBottom: "16px",
                          fontSize: "clamp(14px, 3vw, 16px)",
                        }}
                      >
                        How can you help me analyze market trends for my project?
                      </div>

                      <div
                        className="ai-message ai-message-bubble"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "18px 18px 18px 4px",
                          maxWidth: "85%",
                          marginBottom: "12px",
                          fontSize: "clamp(14px, 3vw, 16px)",
                        }}
                      >
                        I can help analyze market trends using my Research agent for current data and Data agent for
                        statistical analysis. Would you like me to start with industry research or competitive analysis?
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                            fontSize: "13px",
                            color: "#a0a0a0",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "#06b6d4",
                            }}
                          ></span>
                          <span>Research Agent • GPT-4o</span>
                        </div>
                      </div>

                      <div
                        className="user-message user-message-bubble"
                        style={{
                          padding: "12px 16px",
                          maxWidth: "70%",
                          marginLeft: "auto",
                          marginBottom: "16px",
                          fontSize: "clamp(14px, 3vw, 16px)",
                        }}
                      >
                        Start with industry research, please.
                      </div>

                      <div
                        className="ai-message ai-message-bubble"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "18px 18px 18px 4px",
                          maxWidth: "85%",
                          fontSize: "clamp(14px, 3vw, 16px)",
                        }}
                      >
                        Perfect! I'll analyze current industry trends, market size, growth projections, and key players
                        in your sector. This will give us a solid foundation for your project planning.
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                            fontSize: "13px",
                            color: "#a0a0a0",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "#06b6d4",
                            }}
                          ></span>
                          <span>Research Agent • GPT-4o</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const agentInfo = message.role === "assistant" ? getAgentInfo(message.agent || "auto") : null
                  const timestamp = message.timestamp || new Date()

                  return (
                    <div key={message.id} className="flex flex-col">
                      {message.role === "user" ? (
                        // User Message (Right-aligned)
                        <div className="flex justify-end mb-4">
                          <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                            <div
                              className="user-message user-message-bubble"
                              style={{
                                padding: "12px 16px",
                                marginBottom: "4px",
                              }}
                            >
                              <div
                                className="leading-relaxed whitespace-pre-wrap"
                                style={{
                                  fontSize: "clamp(14px, 3vw, 15px)",
                                  fontWeight: "400",
                                }}
                              >
                                {message.content}
                              </div>
                              {message.file && (
                                <div
                                  className="mt-2 p-2 rounded-lg transition-all duration-200"
                                  style={{
                                    background: "rgba(8, 145, 178, 0.15)",
                                    border: "1px solid rgba(8, 145, 178, 0.3)",
                                    fontSize: "12px",
                                    backdropFilter: "blur(8px)",
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Paperclip size={12} style={{ color: "#0891b2" }} />
                                    <span style={{ color: "#e0e0e0" }}>{message.file.name}</span>
                                    <span className="opacity-75" style={{ color: "#a0a0a0" }}>
                                      ({(message.file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 px-2">
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontSize: "12px",
                                  fontWeight: "400",
                                }}
                              >
                                {formatTimestamp(timestamp)}
                              </span>
                              <CheckCheck size={12} style={{ color: "#0891b2" }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // AI Message (Left-aligned)
                        <div className="flex items-start gap-3 mb-4">
                          <div className="flex flex-col items-center gap-1 mt-1">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                              style={{
                                background: message.isError
                                  ? "rgba(239, 68, 68, 0.2)"
                                  : `rgba(${agentInfo ? Number.parseInt(agentInfo.color.slice(1, 3), 16) : 8}, ${
                                      agentInfo ? Number.parseInt(agentInfo.color.slice(3, 5), 16) : 145
                                    }, ${agentInfo ? Number.parseInt(agentInfo.color.slice(5, 7), 16) : 178}, 0.2)`,
                                border: `1px solid ${message.isError ? "#ef4444" : agentInfo?.color || "#0891b2"}`,
                                backdropFilter: "blur(8px)",
                              }}
                            >
                              <span style={{ fontSize: "14px" }}>
                                {message.isError ? "⚠️" : agentInfo?.emoji || "🤖"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col max-w-[85%] sm:max-w-[80%]">
                            <div
                              className="ai-message ai-message-bubble"
                              style={{
                                borderRadius: "18px 18px 18px 4px",
                                padding: "12px 16px",
                                marginBottom: "4px",
                                border: message.isError
                                  ? "1px solid rgba(239, 68, 68, 0.3)"
                                  : "1px solid rgba(255, 255, 255, 0.12)",
                                background: message.isError ? "rgba(239, 68, 68, 0.1)" : "rgba(30, 60, 90, 0.92)",
                                backdropFilter: "blur(12px) saturate(200%)",
                              }}
                            >
                              {message.isError && (
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle size={16} style={{ color: "#ef4444" }} />
                                  <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "500" }}>Error</span>
                                </div>
                              )}
                              <div
                                className="leading-relaxed whitespace-pre-wrap"
                                style={{
                                  fontSize: "clamp(14px, 3vw, 15px)",
                                  fontWeight: "400",
                                  color: message.isError ? "#fca5a5" : "#ffffff",
                                }}
                              >
                                {message.content}
                              </div>
                              {message.downloadUrl && (
                                <div className="mt-3">
                                  <a
                                    href={message.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:transform hover:scale-105"
                                    style={{
                                      background: "rgba(37, 99, 235, 0.2)",
                                      color: "#2563eb",
                                      border: "1px solid rgba(37, 99, 235, 0.3)",
                                      backdropFilter: "blur(8px)",
                                    }}
                                    onClick={() => console.log(`📥 PDF Download: ${message.downloadUrl}`)}
                                  >
                                    <Download size={14} />
                                    Download PDF Report
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 px-2">
                              {agentInfo && !message.isError && (
                                <span
                                  style={{
                                    color: agentInfo.color,
                                    fontSize: "12px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {agentInfo.label} Agent
                                </span>
                              )}
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontSize: "12px",
                                  fontWeight: "400",
                                }}
                              >
                                {message.model}
                              </span>
                              <span
                                style={{
                                  color: "#a0a0a0",
                                  fontSize: "12px",
                                  fontWeight: "400",
                                }}
                              >
                                {formatTimestamp(timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {isLoading && (
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
                        style={{
                          background: `rgba(${Number.parseInt(agentSelection[agentState.selected].color.slice(1, 3), 16)}, ${Number.parseInt(
                            agentSelection[agentState.selected].color.slice(3, 5),
                            16,
                          )}, ${Number.parseInt(agentSelection[agentState.selected].color.slice(5, 7), 16)}, 0.3)`,
                          border: `1px solid ${agentSelection[agentState.selected].color}`,
                          backdropFilter: "blur(8px)",
                          animation: "pulse 2s infinite, glow 2s infinite",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>{agentSelection[agentState.selected].icon}</span>
                      </div>
                    </div>
                    <div className="flex flex-col max-w-[85%] sm:max-w-[80%]">
                      <div
                        className="ai-message ai-message-bubble"
                        style={{
                          borderRadius: "18px 18px 18px 4px",
                          padding: "12px 16px",
                          marginBottom: "4px",
                          background: "rgba(30, 60, 90, 0.92)",
                        }}
                      >
                        <div className="flex space-x-1">
                          <div
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ backgroundColor: agentSelection[agentState.selected].color }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              backgroundColor: agentSelection[agentState.selected].color,
                              animationDelay: "0.1s",
                            }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              backgroundColor: agentSelection[agentState.selected].color,
                              animationDelay: "0.2s",
                            }}
                          ></div>
                        </div>
                        {uploadState.progress > 0 && (
                          <div className="mt-2">
                            <div className="w-full rounded-full h-1" style={{ background: "rgba(255, 255, 255, 0.1)" }}>
                              <div
                                className="h-1 rounded-full transition-all duration-300"
                                style={{
                                  width: `${uploadState.progress}%`,
                                  background: `linear-gradient(90deg, ${agentSelection[agentState.selected].color}, #06b6d4)`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs mt-1" style={{ color: "#a0a0a0" }}>
                              Processing... {uploadState.progress}%
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 px-2">
                        <span
                          style={{
                            color: agentSelection[agentState.selected].color,
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {agentSelection[agentState.selected].icon} {agentSelection[agentState.selected].label} Agent
                          responding...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input Section */}
            <div className="p-4 sm:p-6 flex-shrink-0">
              {/* Upload Error Display */}
              {uploadState.error && (
                <div
                  className="mb-3 p-3 rounded-lg flex items-center gap-3 transition-all duration-300"
                  style={{
                    background: "rgba(255, 107, 53, 0.1)",
                    border: "1px solid rgba(255, 107, 53, 0.3)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <AlertCircle size={16} style={{ color: "#ff6b35" }} />
                  <span style={{ color: "#ffb299", fontSize: "13px", flex: 1 }}>{uploadState.error}</span>
                  <button
                    onClick={clearError}
                    className="transition-all duration-200 hover:bg-red-500/20 rounded p-1"
                    style={{ color: "#ff6b35", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                  {uploadState.error.includes("Connection failed") && (
                    <button
                      onClick={handleRetry}
                      className="ml-2 px-2 py-1 rounded text-xs transition-all duration-200 hover:bg-blue-500/20"
                      style={{
                        color: "#0891b2",
                        background: "rgba(8, 145, 178, 0.1)",
                        border: "1px solid rgba(8, 145, 178, 0.3)",
                      }}
                    >
                      <RefreshCw size={12} className="inline mr-1" />
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Agent Selection Row with Tooltips */}
              <div className="mb-4">
                <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full">
                  {Object.entries(agentSelection).map(([key, agent], index) => (
                    <div key={key} className="relative">
                      <button
                        ref={(el) => (agentButtonsRef.current[index] = el)}
                        type="button"
                        onClick={() => handleAgentSelect(key)}
                        disabled={isLoading}
                        onMouseEnter={() => setTooltip(key)}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={() => setTooltip(key)}
                        onBlur={() => setTooltip(null)}
                        className="agent-selection-button w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg transition-all duration-200"
                        style={{
                          background:
                            agentState.selected === key ? "rgba(40, 70, 100, 0.92)" : "rgba(30, 60, 90, 0.88)",
                          backdropFilter: "blur(12px) saturate(190%)",
                          border:
                            agentState.selected === key
                              ? `1px solid ${agent.color}`
                              : "1px solid rgba(255, 255, 255, 0.1)",
                          opacity: isLoading ? 0.4 : agentState.selected === key ? 1 : 0.6,
                          color: "#ffffff",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          animation:
                            isLoading && agentState.selected === key
                              ? "pulse 2s infinite, agentGlow 2s infinite"
                              : "none",
                          boxShadow:
                            isLoading && agentState.selected === key
                              ? `0 0 20px ${agent.color}40, 0 0 40px ${agent.color}20`
                              : agentState.selected === key
                                ? `0 0 12px ${agent.color}30`
                                : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>{agent.icon}</span>
                        <span
                          className="hidden sm:inline"
                          style={{
                            fontSize: "11px",
                            fontWeight: "500",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {agent.label}
                        </span>
                      </button>

                      {/* Tooltip */}
                      {agentState.showTooltip === key && (
                        <div
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-2"
                          style={{
                            background: "rgba(30, 60, 90, 0.95)",
                            backdropFilter: "blur(12px) saturate(200%)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "500",
                            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {agent.tooltip}
                          <div
                            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                            style={{
                              borderLeft: "4px solid transparent",
                              borderRight: "4px solid transparent",
                              borderTop: "4px solid rgba(30, 60, 90, 0.95)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs mt-2 text-center" style={{ color: "#a0a0a0" }}>
                  Tab: cycle agents • Esc: clear file • Ctrl+N: new chat • Ctrl+K: search • Click titles to edit
                </div>
              </div>

              {/* Selected File Chip - appears above input when file is selected */}
              {selectedFile && (
                <div
                  className="mb-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{
                    background: "rgba(30, 60, 90, 0.91)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(12px) saturate(200%)",
                    maxWidth: "fit-content",
                  }}
                >
                  <Paperclip size={14} style={{ color: "#0891b2" }} />
                  <span
                    style={{
                      color: "#e0e0e0",
                      fontSize: "13px",
                      fontWeight: "500",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedFile.name}
                  </span>
                  <span
                    style={{
                      color: "#a0a0a0",
                      fontSize: "11px",
                      fontWeight: "400",
                    }}
                  >
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="ml-1 p-1 rounded-full transition-all duration-200 hover:bg-red-500/20"
                    style={{
                      color: "#a0a0a0",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Message Form with Integrated File Upload */}
              <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-4">
                <div
                  className="flex-1 flex items-center gap-2 sm:gap-3 transition-all duration-200 focus-within:border-[#0891b2]"
                  style={{
                    background: "rgba(30, 60, 90, 0.88)",
                    backdropFilter: "blur(12px) saturate(190%)",
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "4px 4px 4px 12px",
                  }}
                >
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id="claude-file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.ics,.png,.jpg,.jpeg"
                  />

                  {/* Attachment Button */}
                  <label
                    htmlFor="claude-file-upload"
                    className="flex items-center justify-center transition-all duration-200 cursor-pointer rounded-lg"
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "transparent",
                      color: uploadState.progress > 0 ? "#06b6d4" : "#0891b2",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (uploadState.progress === 0) {
                        e.currentTarget.style.background = "rgba(8, 145, 178, 0.1)"
                        e.currentTarget.style.boxShadow = "0 0 12px rgba(8, 145, 178, 0.3)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadState.progress === 0) {
                        e.currentTarget.style.background = "transparent"
                        e.currentTarget.style.boxShadow = "none"
                      }
                    }}
                  >
                    {uploadState.progress > 0 ? (
                      <div
                        className="animate-spin"
                        style={{
                          width: "18px",
                          height: "18px",
                          border: "2px solid rgba(6, 182, 212, 0.3)",
                          borderTop: "2px solid #06b6d4",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      <Paperclip size={18} />
                    )}
                  </label>

                  {/* Text Input */}
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                    style={{
                      fontSize: "clamp(14px, 3vw, 15px)",
                      fontWeight: "400",
                      padding: "12px 8px",
                    }}
                    disabled={isLoading}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !selectedFile)}
                  className="send-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                  style={{
                    color: "white",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontWeight: "500",
                    fontSize: "clamp(13px, 3vw, 15px)",
                  }}
                >
                  <Send size={16} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
