import { GoogleGenerativeAI } from '@google/generative-ai'

/* eslint-disable @typescript-eslint/no-explicit-any */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateSummary(content: string): Promise<string> {
  try {
    // Try a list of models in order until one succeeds. Some accounts / API
    // versions don't support every Gemini model, so this avoids hard-failing
    // on a single model name.
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5',
      'gemini-1.0',
      'text-bison-001',
    ]

    const prompt = `
      Summarize the following blog post in approximately 200 words.
      Write in third person, be concise and engaging.
      Do not use bullet points, write in paragraph form only.

      Blog post:
      ${content}
    `

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })

        // Different versions of the Google client expose different method
        // names and return shapes. Try the most common ones gracefully.
        const m: any = model
        let result: any

        if (typeof m.generateContent === 'function') {
          result = await m.generateContent(prompt)
          if (result?.response) return (await result.response).text()
        } else if (typeof m.generateText === 'function') {
          result = await m.generateText(prompt)
          if (typeof result?.text === 'string') return result.text
        } else if (typeof m.generate === 'function') {
          result = await m.generate(prompt)
          if (typeof result?.text === 'string') return result.text
        } else if (typeof m.call === 'function') {
          result = await m.call(prompt)
          if (typeof result?.text === 'string') return result.text
        }

        // Some responses include candidates/content arrays
        if (result?.candidates?.length) {
          const candidateText = result.candidates
            .map((c: any) => c?.content?.[0]?.text || c?.text)
            .find(Boolean)
          if (candidateText) return candidateText
        }

        // If we reach here, the model call didn't return usable text — try
        // the next model in the list.
      } catch (err) {
        // If a model isn't available or supported for generateContent this
        // can throw a 404 from the API. Log and continue to fallback models.
        console.error(`Model ${modelName} failed:`, err)
        continue
      }
    }

    // Final graceful fallback if no model produced text
    return content.slice(0, 200) + '...'
  } catch (error) {
    console.error('Gemini summary generation failed (unexpected):', error)
    return content.slice(0, 200) + '...'
  }
}