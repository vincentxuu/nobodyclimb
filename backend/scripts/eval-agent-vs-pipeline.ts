#!/usr/bin/env tsx

/**
 * Agent vs Pipeline Eval Script
 *
 * 用 golden test set 比較 Agent 和 Pipeline 的回答品質。
 * 為 Phase 4（PipelineEngine 退場）提供數據依據。
 *
 * Usage:
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --live                    # 打 preview API 做 A/B eval
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --live --api-base <url>   # 指定 API base URL
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --live --concurrency 3    # 並行 3 個請求
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --live --token <jwt>      # 指定 auth token
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --dry-run                 # 印出會跑哪些測試
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --mock                    # 用假資料測試評分邏輯
 */

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoldenCase {
  id: string
  query: string
  category: string
  expected_tool: string
  expected_answer_keywords: string[]
  expected_filters?: Record<string, unknown>
  ci?: boolean
  ground_truth_answer: string
}

interface GoldenTestSet {
  version: string
  description: string
  cases: GoldenCase[]
}

interface ModeResult {
  answer: string
  groundedness: number
  quality: number
  latencyMs: number
  totalTokens: number
}

interface EvalResult {
  id: string
  query: string
  category: string
  groundTruth: string
  expectedTool: string
  agent: ModeResult
  pipeline: ModeResult
  winner: 'agent' | 'pipeline' | 'tie'
  agentQueryRoute?: string
  pipelineQueryRoute?: string
}

// ---------------------------------------------------------------------------
// Judge (keyword-based offline scoring — no LLM needed)
// ---------------------------------------------------------------------------

function scoreAnswer(
  answer: string,
  _groundTruth: string,
  keywords: string[]
): { groundedness: number; quality: number } {
  const matchedKeywords = keywords.filter((kw) =>
    answer.toLowerCase().includes(kw.toLowerCase())
  )
  const groundedness = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0.5

  const keywordRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0
  const hasSubstance = answer.length > 30 && !answer.includes('找不到') && !answer.includes('error')
  const isError = answer.includes('error') || answer.includes('Error') || answer.length < 10

  let quality: number
  if (isError) quality = 1
  else if (keywordRatio >= 0.8 && hasSubstance) quality = 4
  else if (keywordRatio >= 0.5 && hasSubstance) quality = 3
  else if (keywordRatio >= 0.2) quality = 2
  else quality = 1

  return {
    groundedness: Math.round(groundedness * 100) / 100,
    quality,
  }
}

function determineWinner(agent: ModeResult, pipeline: ModeResult): 'agent' | 'pipeline' | 'tie' {
  if (agent.quality > pipeline.quality) return 'agent'
  if (pipeline.quality > agent.quality) return 'pipeline'
  if (agent.groundedness > pipeline.groundedness + 0.1) return 'agent'
  if (pipeline.groundedness > agent.groundedness + 0.1) return 'pipeline'
  if (agent.latencyMs < pipeline.latencyMs * 0.8) return 'agent'
  if (pipeline.latencyMs < agent.latencyMs * 0.8) return 'pipeline'
  return 'tie'
}

// ---------------------------------------------------------------------------
// Live Mode — 打 preview API
// ---------------------------------------------------------------------------

interface AskResponse {
  success: boolean
  data?: {
    answer: string
    sources: Array<{ title: string; url?: string }>
    query_id: string
    query_route?: string
    suggested_questions: string[]
  }
  error?: string
  message?: string
}

async function askAPI(
  apiBase: string,
  query: string,
  evalMode: 'agent' | 'pipeline',
  token?: string
): Promise<{ answer: string; latencyMs: number; queryRoute?: string }> {
  const start = Date.now()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Eval-Mode': 'true',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${apiBase}/ai/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      eval_mode: evalMode,
      no_cache: true,
      include_sources: true,
    }),
  })

  const latencyMs = Date.now() - start

  if (!res.ok) {
    const errText = await res.text().catch(() => `HTTP ${res.status}`)
    return { answer: `[error] ${res.status}: ${errText.slice(0, 200)}`, latencyMs }
  }

  const json = (await res.json()) as AskResponse
  if (!json.success || !json.data) {
    return { answer: `[error] ${json.message ?? json.error ?? 'unknown'}`, latencyMs }
  }

  return {
    answer: json.data.answer,
    latencyMs,
    queryRoute: json.data.query_route,
  }
}

async function runLiveEval(
  cases: GoldenCase[],
  apiBase: string,
  concurrency: number,
  token?: string
): Promise<EvalResult[]> {
  const results: EvalResult[] = []
  const total = cases.length

  // Process in batches of `concurrency`
  for (let i = 0; i < cases.length; i += concurrency) {
    const batch = cases.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (tc, batchIdx) => {
        const idx = i + batchIdx + 1
        console.log(`  [${idx}/${total}] ${tc.id}: ${tc.query.slice(0, 40)}...`)

        // Agent mode
        const agentRes = await askAPI(apiBase, tc.query, 'agent', token)
        const agentScore = scoreAnswer(agentRes.answer, tc.ground_truth_answer, tc.expected_answer_keywords)

        // Pipeline mode
        const pipelineRes = await askAPI(apiBase, tc.query, 'pipeline', token)
        const pipelineScore = scoreAnswer(pipelineRes.answer, tc.ground_truth_answer, tc.expected_answer_keywords)

        const agent: ModeResult = {
          answer: agentRes.answer,
          ...agentScore,
          latencyMs: agentRes.latencyMs,
          totalTokens: 0,
        }

        const pipeline: ModeResult = {
          answer: pipelineRes.answer,
          ...pipelineScore,
          latencyMs: pipelineRes.latencyMs,
          totalTokens: 0,
        }

        const result: EvalResult = {
          id: tc.id,
          query: tc.query,
          category: tc.category,
          groundTruth: tc.ground_truth_answer,
          expectedTool: tc.expected_tool,
          agent,
          pipeline,
          winner: determineWinner(agent, pipeline),
          agentQueryRoute: agentRes.queryRoute,
          pipelineQueryRoute: pipelineRes.queryRoute,
        }

        console.log(`         → Agent Q=${agent.quality} G=${agent.groundedness} ${agentRes.latencyMs}ms | Pipeline Q=${pipeline.quality} G=${pipeline.groundedness} ${pipelineRes.latencyMs}ms | Winner: ${result.winner}`)
        return result
      })
    )
    results.push(...batchResults)
  }

  return results
}

// ---------------------------------------------------------------------------
// Mock Mode
// ---------------------------------------------------------------------------

function generateMockResults(cases: GoldenCase[]): EvalResult[] {
  return cases.map((tc) => {
    const keywords = tc.expected_answer_keywords ?? []
    const agentAnswer = `根據搜尋結果，${keywords.join('、')}相關的資訊如下：${tc.ground_truth_answer.slice(0, 100)}`
    const agentScore = scoreAnswer(agentAnswer, tc.ground_truth_answer, keywords)

    const pipelineKeywords = keywords.slice(0, Math.ceil(keywords.length * 0.7))
    const pipelineAnswer = `以下是${pipelineKeywords.join('、')}的查詢結果：${tc.ground_truth_answer.slice(0, 80)}`
    const pipelineScore = scoreAnswer(pipelineAnswer, tc.ground_truth_answer, keywords)

    const agent: ModeResult = {
      answer: agentAnswer,
      ...agentScore,
      latencyMs: 800 + Math.random() * 400,
      totalTokens: 500 + Math.floor(Math.random() * 300),
    }

    const pipeline: ModeResult = {
      answer: pipelineAnswer,
      ...pipelineScore,
      latencyMs: 1200 + Math.random() * 600,
      totalTokens: 800 + Math.floor(Math.random() * 400),
    }

    return {
      id: tc.id,
      query: tc.query,
      category: tc.category,
      groundTruth: tc.ground_truth_answer,
      expectedTool: tc.expected_tool,
      agent,
      pipeline,
      winner: determineWinner(agent, pipeline),
    }
  })
}

// ---------------------------------------------------------------------------
// Report Generation
// ---------------------------------------------------------------------------

function generateReport(results: EvalResult[], mode: string): string {
  const lines: string[] = []
  lines.push(`# Agent vs Pipeline Eval Report`)
  lines.push('')
  lines.push(`> Mode: ${mode} | Date: ${new Date().toISOString().split('T')[0]} | Cases: ${results.length}`)
  lines.push('')

  // Detail table
  lines.push('| ID | Query | Category | Agent Q | Pipeline Q | Agent G | Pipeline G | Winner |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const r of results) {
    const queryShort = r.query.length > 25 ? r.query.slice(0, 25) + '…' : r.query
    const winIcon = r.winner === 'agent' ? '🤖' : r.winner === 'pipeline' ? '⚙️' : '🤝'
    lines.push(
      `| ${r.id} | ${queryShort} | ${r.category} | ${r.agent.quality} | ${r.pipeline.quality} | ${r.agent.groundedness} | ${r.pipeline.groundedness} | ${winIcon} ${r.winner} |`
    )
  }

  // Summary
  const agentWins = results.filter((r) => r.winner === 'agent').length
  const pipelineWins = results.filter((r) => r.winner === 'pipeline').length
  const ties = results.filter((r) => r.winner === 'tie').length
  const avgAgentQ = results.reduce((s, r) => s + r.agent.quality, 0) / results.length
  const avgPipelineQ = results.reduce((s, r) => s + r.pipeline.quality, 0) / results.length
  const avgAgentG = results.reduce((s, r) => s + r.agent.groundedness, 0) / results.length
  const avgPipelineG = results.reduce((s, r) => s + r.pipeline.groundedness, 0) / results.length
  const avgAgentLatency = results.reduce((s, r) => s + r.agent.latencyMs, 0) / results.length
  const avgPipelineLatency = results.reduce((s, r) => s + r.pipeline.latencyMs, 0) / results.length

  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`- **Agent wins**: ${agentWins}/${results.length}`)
  lines.push(`- **Pipeline wins**: ${pipelineWins}/${results.length}`)
  lines.push(`- **Ties**: ${ties}/${results.length}`)
  lines.push(`- Agent avg quality: ${avgAgentQ.toFixed(2)} | Pipeline avg quality: ${avgPipelineQ.toFixed(2)}`)
  lines.push(`- Agent avg groundedness: ${avgAgentG.toFixed(2)} | Pipeline avg groundedness: ${avgPipelineG.toFixed(2)}`)
  lines.push(`- Agent avg latency: ${Math.round(avgAgentLatency)}ms | Pipeline avg latency: ${Math.round(avgPipelineLatency)}ms`)

  // Tool selection accuracy
  const casesWithRoute = results.filter((r) => r.agentQueryRoute || r.pipelineQueryRoute)
  if (casesWithRoute.length > 0) {
    lines.push('')
    lines.push('## Tool Selection')
    lines.push('')
    const agentCorrect = casesWithRoute.filter((r) => r.agentQueryRoute === r.expectedTool).length
    const pipelineCorrect = casesWithRoute.filter((r) => r.pipelineQueryRoute === r.expectedTool).length
    lines.push(`- Agent tool accuracy: ${agentCorrect}/${casesWithRoute.length} (${Math.round(agentCorrect / casesWithRoute.length * 100)}%)`)
    lines.push(`- Pipeline tool accuracy: ${pipelineCorrect}/${casesWithRoute.length} (${Math.round(pipelineCorrect / casesWithRoute.length * 100)}%)`)
  }

  // Per-category breakdown
  const categories = [...new Set(results.map((r) => r.category))]
  if (categories.length > 1) {
    lines.push('')
    lines.push('## By Category')
    lines.push('')
    lines.push('| Category | Agent Avg Q | Pipeline Avg Q | Agent Wins | Pipeline Wins |')
    lines.push('|---|---|---|---|---|')
    for (const cat of categories) {
      const catResults = results.filter((r) => r.category === cat)
      const catAgentQ = catResults.reduce((s, r) => s + r.agent.quality, 0) / catResults.length
      const catPipelineQ = catResults.reduce((s, r) => s + r.pipeline.quality, 0) / catResults.length
      const catAgentWins = catResults.filter((r) => r.winner === 'agent').length
      const catPipelineWins = catResults.filter((r) => r.winner === 'pipeline').length
      lines.push(
        `| ${cat} | ${catAgentQ.toFixed(1)} | ${catPipelineQ.toFixed(1)} | ${catAgentWins}/${catResults.length} | ${catPipelineWins}/${catResults.length} |`
      )
    }
  }

  // Decision guidance
  lines.push('')
  lines.push('## Decision Guidance')
  lines.push('')
  if (agentWins > pipelineWins * 1.5) {
    lines.push('✅ **Agent clearly outperforms Pipeline.** Safe to proceed with Phase 4 (PipelineEngine retirement).')
  } else if (agentWins > pipelineWins) {
    lines.push('⚠️ **Agent slightly better.** Consider running with more test cases or on production traffic before retiring Pipeline.')
  } else if (pipelineWins > agentWins) {
    lines.push('❌ **Pipeline still wins.** Do NOT retire PipelineEngine yet. Investigate Agent weaknesses in losing categories.')
  } else {
    lines.push('🤝 **Roughly equal.** Agent provides flexibility advantages; consider gradual rollover with monitoring.')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  mode: 'dry-run' | 'mock' | 'live'
  apiBase: string
  concurrency: number
  token?: string
} {
  const isDryRun = argv.includes('--dry-run')
  const isMock = argv.includes('--mock')
  const isLive = argv.includes('--live')

  let apiBase = 'https://api-preview.nobodyclimb.cc/api/v1'
  const apiBaseIdx = argv.indexOf('--api-base')
  if (apiBaseIdx !== -1 && argv[apiBaseIdx + 1]) {
    apiBase = argv[apiBaseIdx + 1]
  }

  let concurrency = 1
  const concurrencyIdx = argv.indexOf('--concurrency')
  if (concurrencyIdx !== -1 && argv[concurrencyIdx + 1]) {
    concurrency = Math.max(1, Math.min(5, parseInt(argv[concurrencyIdx + 1], 10) || 1))
  }

  let token: string | undefined
  const tokenIdx = argv.indexOf('--token')
  if (tokenIdx !== -1 && argv[tokenIdx + 1]) {
    token = argv[tokenIdx + 1]
  }

  if (isDryRun) return { mode: 'dry-run', apiBase, concurrency, token }
  if (isMock) return { mode: 'mock', apiBase, concurrency, token }
  if (isLive) return { mode: 'live', apiBase, concurrency, token }

  // Default to showing help
  return { mode: 'dry-run', apiBase, concurrency, token }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = parseArgs(process.argv.slice(2))

  // Load golden test set
  const testSetPath = path.resolve(__dirname, '../tests/golden-test-set.json')
  const testSet: GoldenTestSet = JSON.parse(fs.readFileSync(testSetPath, 'utf-8'))
  const ciCases = testSet.cases.filter((c) => c.ci)

  console.log(`\nLoaded ${testSet.cases.length} cases, ${ciCases.length} marked CI\n`)

  if (config.mode === 'dry-run') {
    console.log('=== DRY RUN: Cases that would be evaluated ===\n')
    for (const tc of ciCases) {
      console.log(`  ${tc.id} [${tc.category}] ${tc.query}`)
      console.log(`    Expected tool: ${tc.expected_tool}`)
      console.log(`    Keywords: ${tc.expected_answer_keywords.join(', ')}`)
      console.log('')
    }
    console.log(`Total: ${ciCases.length} cases`)
    console.log(`Estimated time (live): ~${ciCases.length * 10}s (10s/case × 2 modes, concurrency=${config.concurrency})`)
    return
  }

  if (config.mode === 'mock') {
    console.log('=== MOCK MODE: Using simulated responses ===\n')
    const results = generateMockResults(ciCases)
    const report = generateReport(results, 'mock')
    console.log(report)

    const reportDir = path.resolve(__dirname, '../eval-results')
    fs.mkdirSync(reportDir, { recursive: true })
    const reportPath = path.resolve(reportDir, `mock-${new Date().toISOString().split('T')[0]}.md`)
    fs.writeFileSync(reportPath, report, 'utf-8')
    console.log(`\nReport saved to: ${reportPath}`)

    const jsonPath = path.resolve(reportDir, `mock-${new Date().toISOString().split('T')[0]}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`Raw results saved to: ${jsonPath}`)
    return
  }

  // Live mode
  console.log('=== LIVE MODE: Hitting API for A/B eval ===')
  console.log(`  API base: ${config.apiBase}`)
  console.log(`  Concurrency: ${config.concurrency}`)
  console.log(`  Auth: ${config.token ? 'token provided' : 'no token (anonymous)'}`)
  console.log(`  Cases: ${ciCases.length}`)
  console.log('')

  if (!config.token) {
    console.log('⚠  No --token provided. The /ai/ask endpoint requires auth.')
    console.log('   Get a JWT: curl -X POST <api>/auth/login -d \'{"email":"...","password":"..."}\'')
    console.log('   Then: npx tsx scripts/eval-agent-vs-pipeline.ts --live --token <jwt>')
    console.log('')
    return
  }

  const results = await runLiveEval(ciCases, config.apiBase, config.concurrency, config.token)
  const report = generateReport(results, `live (${config.apiBase})`)
  console.log('\n' + report)

  const reportDir = path.resolve(__dirname, '../eval-results')
  fs.mkdirSync(reportDir, { recursive: true })
  const datestamp = new Date().toISOString().split('T')[0]
  const reportPath = path.resolve(reportDir, `live-${datestamp}.md`)
  fs.writeFileSync(reportPath, report, 'utf-8')
  console.log(`\nReport saved to: ${reportPath}`)

  const jsonPath = path.resolve(reportDir, `live-${datestamp}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`Raw results saved to: ${jsonPath}`)
}

main().catch(console.error)
