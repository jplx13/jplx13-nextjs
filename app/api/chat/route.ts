import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system:
      "You are JPLx13, a helpful AI assistant focused on architecture, design, and modern principles. Provide thoughtful, professional responses.",
  })

  return result.toDataStreamResponse()
}
