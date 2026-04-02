import { GoogleGenerativeAI } from '@google/generative-ai'

/* eslint-disable @typescript-eslint/no-explicit-any */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateSummary(content: string): Promise<string> {
  try {
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5']

    // Trim content to prevent lazy extraction on long blogs
    const trimmedContent = content.slice(0, 6000)

    const prompt = `
You are an expert blog summarizer.

TASK:
Create a high-quality summary of the blog below.

RULES:
- DO NOT copy any sentence from the blog
- You MUST paraphrase everything
- Focus on the entire content, not just the introduction
- Keep it between 120–180 words
- Make it engaging and easy to read

FORMAT:
- 2-3 sentence overview
- 3 bullet key points
- 1 closing sentence

BLOG:
${trimmedContent}
`

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 300,
          },
        })

        const m: any = model
        let result: any
        let text: string | null = null

        // Handle different SDK method variants safely
        if (typeof m.generateContent === 'function') {
          result = await m.generateContent(prompt)
          text = (await result.response).text()
        } else if (typeof m.generateText === 'function') {
          result = await m.generateText(prompt)
          text = result?.text
        } else if (typeof m.generate === 'function') {
          result = await m.generate(prompt)
          text = result?.text
        } else if (typeof m.call === 'function') {
          result = await m.call(prompt)
          text = result?.text
        }

        // Handle fallback candidate structure
        if (!text && result?.candidates?.length) {
          text = result.candidates
            .map((c: any) => c?.content?.[0]?.text || c?.text)
            .find(Boolean)
        }

        // 🔥 Anti-copy check (prevents extractive summaries)
        if (text && !content.includes(text.slice(0, 50))) {
          return text.trim()
        }

        console.warn(`Model ${modelName} returned extractive summary, retrying...`)
      } catch (err) {
        console.error(`Model ${modelName} failed:`, err)
      }
    }

    return fallbackSummary(content)
  } catch (error) {
    console.error('Gemini summary generation failed:', error)
    return fallbackSummary(content)
  }
}

// ✅ Smart fallback (better than raw slicing)
function fallbackSummary(content: string): string {
  const sentences = content.split('. ').slice(0, 3).join('. ')
  return sentences + '...'
}