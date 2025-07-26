"use client"

import { useState, useCallback } from "react"
import type { AgentState } from "../types/chat"

export const useAgentSelection = (initialAgent = "auto") => {
  const [agentState, setAgentState] = useState<AgentState>({
    selected: initialAgent,
    isLoading: false,
    showTooltip: null,
  })

  const selectAgent = useCallback(
    (agentKey: string) => {
      console.log(`🎯 Agent Selection Change:`, {
        from: agentState.selected,
        to: agentKey,
        timestamp: new Date().toISOString(),
        isManualOverride: agentKey !== "auto",
      })

      setAgentState((prev) => ({
        ...prev,
        selected: agentKey,
      }))
    },
    [agentState.selected],
  )

  const setLoading = useCallback((loading: boolean) => {
    setAgentState((prev) => ({
      ...prev,
      isLoading: loading,
    }))
  }, [])

  const setTooltip = useCallback((tooltip: string | null) => {
    setAgentState((prev) => ({
      ...prev,
      showTooltip: tooltip,
    }))
  }, [])

  return {
    agentState,
    selectAgent,
    setLoading,
    setTooltip,
  }
}
