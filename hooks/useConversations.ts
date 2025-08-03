"use client"

import { useState, useEffect, useCallback } from "react"
import type { Conversation, ChatMessage } from "../types/chat"

const STORAGE_KEY = "jplx13-conversations"

// Generate a concise, descriptive title (2-4 words) from the first user message
const generateTitle = (message: string): string => {
  // Remove common prefixes and clean the message
  let cleanMessage = message.trim().toLowerCase()
  
  // Remove common prefixes
  const prefixes = [
    "can you", "please", "help me", "i need", "how to", "what is", "explain", "tell me",
    "i want to", "i would like", "could you", "would you", "can someone", "does anyone",
    "i'm looking for", "i'm trying to", "i need help with", "i need assistance with"
  ]
  
  for (const prefix of prefixes) {
    if (cleanMessage.startsWith(prefix)) {
      cleanMessage = cleanMessage.substring(prefix.length).trim()
      break
    }
  }
  
  // Remove punctuation and extra whitespace
  cleanMessage = cleanMessage.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  
  // Split into words and filter out common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ])
  
  const words = cleanMessage.split(' ').filter(word => 
    word.length > 0 && !stopWords.has(word) && word.length > 2
  )
  
  // Take the first 2-4 meaningful words
  const titleWords = words.slice(0, 4)
  
  if (titleWords.length === 0) {
    return "New Chat"
  }
  
  // Capitalize each word and join
  const title = titleWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  return title
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          })),
        }))
        setConversations(conversationsWithDates)
        
        // Set the first conversation as active if none is active
        const activeConversation = conversationsWithDates.find(conv => conv.active)
        if (activeConversation) {
          setCurrentConversationId(activeConversation.id)
        } else if (conversationsWithDates.length > 0) {
          setCurrentConversationId(conversationsWithDates[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to load conversations from localStorage:", error)
    }
  }, [])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
      } catch (error) {
        console.error("Failed to save conversations to localStorage:", error)
      }
    }
  }, [conversations])

  // Create a new conversation
  const createConversation = useCallback((firstMessage?: string) => {
    const newId = Date.now().toString()
    const title = firstMessage ? generateTitle(firstMessage) : "New Conversation"
    
    const newConversation: Conversation = {
      id: newId,
      title,
      active: true,
      lastMessage: firstMessage || "",
      timestamp: new Date(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setConversations(prev => {
      // Deactivate all other conversations
      const updatedConversations = prev.map(conv => ({ ...conv, active: false }))
      return [...updatedConversations, newConversation]
    })

    setCurrentConversationId(newId)
    return newId
  }, [])

  // Switch to a different conversation
  const switchConversation = useCallback((conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => ({
        ...conv,
        active: conv.id === conversationId
      }))
    )
    setCurrentConversationId(conversationId)
  }, [])

  // Add a message to the current conversation
  const addMessage = useCallback((message: ChatMessage) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, message]
          const isFirstMessage = conv.messages.length === 0
          
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: message.content,
            timestamp: new Date(),
            updatedAt: new Date(),
            // Generate title from first user message
            title: isFirstMessage && message.role === "user" 
              ? generateTitle(message.content) 
              : conv.title
          }
        }
        return conv
      })
    )
  }, [currentConversationId])

  // Get the current conversation
  const getCurrentConversation = useCallback(() => {
    return conversations.find(conv => conv.id === currentConversationId) || null
  }, [conversations, currentConversationId])

  // Delete a conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== conversationId)
      
      // If we're deleting the current conversation, switch to another one
      if (conversationId === currentConversationId && filtered.length > 0) {
        const nextConversation = filtered[0]
        setCurrentConversationId(nextConversation.id)
        return filtered.map(conv => ({
          ...conv,
          active: conv.id === nextConversation.id
        }))
      }
      
      return filtered
    })
  }, [currentConversationId])

  // Update conversation title
  const updateConversationTitle = useCallback((conversationId: string, newTitle: string) => {
    const trimmedTitle = newTitle.trim()
    if (trimmedTitle.length === 0) return
    
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title: trimmedTitle, updatedAt: new Date() }
          : conv
      )
    )
    setEditingTitleId(null)
  }, [])

  // Start editing title
  const startEditingTitle = useCallback((conversationId: string) => {
    setEditingTitleId(conversationId)
  }, [])

  // Cancel editing title
  const cancelEditingTitle = useCallback(() => {
    setEditingTitleId(null)
  }, [])

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setConversations([])
    setCurrentConversationId(null)
    setEditingTitleId(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Format timestamp for display
  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }, [])

  return {
    conversations,
    currentConversationId,
    currentConversation: getCurrentConversation(),
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
  }
} 