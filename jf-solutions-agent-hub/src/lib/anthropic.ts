import { createAnthropic } from "@ai-sdk/anthropic"

const anthropicProvider = createAnthropic({
  apiKey: process.env.CLAUDE_API_KEY ?? "",
})

export const claude = anthropicProvider("claude-sonnet-4-6")
