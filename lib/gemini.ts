import { GoogleGenerativeAI } from '@google/generative-ai'

const MAX_WORDS = 200

export async function generateSummary(content: string): Promise<string | null> {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  // Minimum content check
  if (wordCount < 30) {
    return 'This post is too short to generate a meaningful summary.'
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[Gemini] GEMINI_API_KEY missing')
    throw new Error('GEMINI_API_KEY is missing from environment variables')
  }

    // Instantiate the client (library expects a string API key in this version)
    const genAI = new GoogleGenerativeAI(apiKey)

    // Discover models dynamically from the API so we use only supported names/methods
    let modelsToTry: string[] = []
    try {
      const listFn = (genAI as unknown as { listModels?: () => Promise<unknown> }).listModels
      const listResp = listFn ? await listFn.call(genAI) : undefined
      const respTyped = listResp as unknown as { models?: unknown[] } | undefined
      let available = Array.isArray(respTyped?.models) ? respTyped!.models! : []

      // If SDK listing didn't return models, try the REST ListModels endpoint with the API key
      if (available.length === 0) {
        try {
          console.log('[Gemini] SDK listModels empty, trying REST ListModels endpoint')
          const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`
          const r = await fetch(url)
          if (r.ok) {
            const j = await r.json()
            const restModels = Array.isArray(j?.models) ? j.models : []
            if (restModels.length > 0) {
              available = restModels
              console.log('[Gemini] REST ListModels returned', restModels.length, 'models')
            } else {
              console.warn('[Gemini] REST ListModels returned no models')
            }
          } else {
            console.warn('[Gemini] REST ListModels HTTP error:', r.status, await r.text())
          }
        } catch (restErr) {
          console.warn('[Gemini] REST ListModels attempt failed:', String(restErr))
        }
      }
    console.log('[Gemini] available models count:', available.length)
      // prefer models that advertise generateContent or have 'bison'/'gemini' in name
      const preferred: string[] = []
      const others: string[] = []
      type ModelInfo = { name?: string; model?: string; id?: string; supportedMethods?: string[] }
      for (const mRaw of available) {
        const m = mRaw as ModelInfo
        const name = (m.name || m.model || m.id || '').toString()
        const methods = Array.isArray(m.supportedMethods) ? m.supportedMethods : []
        if (!name) continue
        if (methods.includes('generateContent') || /bison|gemini|text/i.test(name)) {
          preferred.push(name)
        } else {
          others.push(name)
        }
      }
      modelsToTry = [...preferred, ...others]
    } catch (e) {
      console.warn('[Gemini] listModels failed, falling back to default model list', String(e))
      modelsToTry = ['gemini-1.5-flash', 'gemini-1.5', 'gemini-1.0', 'text-bison-001']
    }

    const basePrompt = `Summarize the following blog in under ${MAX_WORDS} words. Do NOT copy sentences directly from the blog. Produce a concise, original summary that captures the core idea. Use neutral tone.

  BLOG:
  ${content.slice(0, 10000)}
  `

    const modelErrors: string[] = []
    for (const modelName of modelsToTry) {
      try {
        console.log('[Gemini] Trying model:', modelName)
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 800,
          },
        })

        const result = await model.generateContent(basePrompt)
        const response = await result.response
        const raw = (typeof response.text === 'function') ? response.text().trim() : String(response).trim()
        console.log(`[Gemini][${modelName}] raw length:`, raw?.length)

        let summary = raw
        if (!summary || summary.length < 20) {
          console.warn(`[Gemini][${modelName}] Empty or too-short response`) 
          continue
        }

        // Shorten if too long
        const words = summary.split(/\s+/).filter(Boolean)
        if (words.length > MAX_WORDS) {
          console.log(`[Gemini][${modelName}] Summary too long (${words.length}) — requesting concise rewrite`)
          const shortenPrompt = `Shorten the following summary to under ${MAX_WORDS} words, preserving the core idea and avoiding copying from the original blog.\n\nSUMMARY:\n${summary}`
          const shortResult = await model.generateContent(shortenPrompt)
          const shortResp = await shortResult.response
          const shortText = (typeof shortResp.text === 'function') ? shortResp.text().trim() : String(shortResp).trim()
          if (shortText && shortText.length > 10) summary = shortText
        }

        // Paraphrase if too extractive
        if (isHighlyExtractive(summary, content)) {
          console.warn(`[Gemini][${modelName}] High verbatim overlap detected — requesting paraphrase`)
          const paraphrasePrompt = `Paraphrase the following so it is original and does not copy the blog text. Keep it under ${MAX_WORDS} words.\n\nSUMMARY:\n${summary}`
          const paraphraseResult = await model.generateContent(paraphrasePrompt)
          const paraphraseResp = await paraphraseResult.response
          const paraphraseText = (typeof paraphraseResp.text === 'function') ? paraphraseResp.text().trim() : String(paraphraseResp).trim()
          if (paraphraseText && paraphraseText.length > 10) summary = paraphraseText
        }

        // Enforce hard word limit
        const finalWords = summary.split(/\s+/).filter(Boolean)
        if (finalWords.length > MAX_WORDS) {
          summary = finalWords.slice(0, MAX_WORDS).join(' ')
          if (!/[.!?]$/.test(summary)) summary = summary.replace(/\s+[^\s]+$/, '') + '...'
        }

        console.log(`[Gemini][${modelName}] final words:`, summary.split(/\s+/).filter(Boolean).length)
        return summary
      } catch (modelErr: unknown) {
        console.error(`[Gemini][${modelName}] model attempt failed:`, modelErr)
        let errMsg = 'unknown error'
        if (typeof modelErr === 'string') errMsg = modelErr
        else if (modelErr instanceof Error) errMsg = modelErr.message
        else {
          try {
            errMsg = JSON.stringify(modelErr)
          } catch {
            errMsg = String(modelErr)
          }
        }
        modelErrors.push(`${modelName}: ${errMsg}`)
        // try next model
        continue
      }
    }

    // All attempts failed — produce an extractive fallback summary (better than raw prefix)
    console.error('[Gemini] All model attempts failed or returned unsuitable output', modelErrors)
    const discovered = modelsToTry.length ? ` Available models: ${modelsToTry.join(', ')}` : ''
    if (modelErrors.length) console.error('[Gemini] model errors:', modelErrors.join(' | '), discovered)

    const fallback = extractiveSummary(content, MAX_WORDS)
    // Prefix so UI/consumers know this was a fallback, but keep it readable
    return `[FALLBACK] ${fallback}`


  /**
   * Simple extractive summarizer: score sentences by word frequency and
   * pick top sentences until maxWords reached. Returns a readable summary.
   */
  function extractiveSummary(text: string, maxWords: number): string {
    const cleanText = text.replace(/\s+/g, ' ').trim()
    if (!cleanText) return ''

    // Split into sentences (naive but effective for blog text)
    const sentences = cleanText.split(/(?<=[.!?])\s+/)

    // Basic stop words list
    const stop = new Set([
      'the','is','in','and','to','a','of','it','that','this','with','for','as','on','are','was','be','by','an','or','from','at','which','but','have','has','its','not','they','their','will','can'
    ])

    // Build frequency map
    const freq = new Map<string, number>()
    for (const word of cleanText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)) {
      if (!word || stop.has(word)) continue
      freq.set(word, (freq.get(word) || 0) + 1)
    }

    // Score sentences
    const scored: Array<{ idx: number; sentence: string; score: number; words: number }> = []
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i].trim()
      if (!s) continue
      const tokens = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
      let score = 0
      for (const t of tokens) {
        if (stop.has(t)) continue
        score += freq.get(t) || 0
      }
      scored.push({ idx: i, sentence: s, score, words: tokens.length })
    }

    // Pick top sentences by score
    scored.sort((a, b) => b.score - a.score)

    const selected = new Set<number>()
    const resultSentences: string[] = []
    let totalWords = 0
    for (const item of scored) {
      if (totalWords + item.words > maxWords) continue
      selected.add(item.idx)
      totalWords += item.words
    }

    // If none selected (very short or odd content), pick first sentence(s)
    if (selected.size === 0) {
      for (const s of sentences) {
        const w = s.split(/\s+/).filter(Boolean).length
        if (totalWords + w > maxWords) break
        resultSentences.push(s)
        totalWords += w
      }
      return resultSentences.join(' ')
    }

    // Preserve original order
    const ordered = Array.from(selected).sort((a, b) => a - b)
    for (const idx of ordered) {
      resultSentences.push(sentences[idx].trim())
    }

    // Final trim if still too long
    let out = resultSentences.join(' ')
    const outWords = out.split(/\s+/).filter(Boolean)
    if (outWords.length > maxWords) {
      out = outWords.slice(0, maxWords).join(' ')
      if (!/[.!?]$/.test(out)) out = out.replace(/\s+[^\s]+$/, '') + '...'
    }
    return out
  }
  
}

function isHighlyExtractive(summary: string, original: string): boolean {
  // Compute ratio of longest common substring / summary length to detect copy
  const s = summary.toLowerCase()
  const o = original.toLowerCase()
  // If more than 40% of summary appears verbatim in original, consider it extractive
  const maxLen = longestCommonSubstringLength(s, o)
  return maxLen / Math.max(1, s.length) > 0.4
}

function longestCommonSubstringLength(a: string, b: string): number {
  // Simple dynamic programming approach on characters (safe for short summaries)
  const m = a.length
  const n = b.length
  let result = 0
  const dp: number[] = new Array(n + 1).fill(0)
  for (let i = 1; i <= m; i++) {
    for (let j = n; j >= 1; j--) {
      if (a[i - 1] === b[j - 1]) {
        dp[j] = dp[j - 1] + 1
        if (dp[j] > result) result = dp[j]
      } else {
        dp[j] = 0
      }
    }
  }
  return result
}