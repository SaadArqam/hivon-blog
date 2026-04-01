import { generateSummary } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Content too short to summarize' },
        { status: 400 }
      )
    }

    const summary = await generateSummary(content)
    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Summarize route error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}