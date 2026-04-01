import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateSummary(content: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
      Summarize the following blog post in approximately 200 words. 
      Write in third person, be concise and engaging.
      Do not use bullet points, write in paragraph form only.
      
      Blog post:
      ${content}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini summary generation failed:', error)
    // Return a fallback so post creation doesn't crash
    return content.slice(0, 200) + '...'
  }
}