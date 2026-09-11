#!/usr/bin/env tsx

/**
 * Agent vs Pipeline Eval Script
 *
 * 用 golden test set 比較 Agent 和 Pipeline 的回答品質。
 * 為 Phase 4（PipelineEngine 退場）提供數據依據。
 *
 * Usage:
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts           # 需要真實 D1/KV/R2 binding
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --dry-run  # 印出會跑哪些測試
 *   npx tsx backend/scripts/eval-agent-vs-pipeline.ts --mock     # 用假資料測試評分邏輯
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
  agent: ModeResult
  pipeline: ModeResult
  winner: 'agent' | 'pipeline' | 'tie'
}

// ---------------------------------------------------------------------------
// Judge (keyword-based offline scoring — no LLM needed)
// ---------------------------------------------------------------------------

function scoreAnswer(
  answer: string,
  groundTruth: string,
  keywords: string[]
): { groundedness: number; quality: number } {
  // Groundedness: what fraction of expected keywords appear in the answer
  const matchedKeywords = keywords.filter((kw) =>
    answer.toLowerCase().includes(kw.toLowerCase())
  )
  const groundedness = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0.5

  // Quality heuristic (1-4):
  // 4 = all keywords + reasonable length
  // 3 = most keywords
  // 2 = some keywords
  // 1 = few/no keywords or error
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
  // Primary: quality score. Secondary: groundedness. Tertiary: latency.
  if (agent.quality > pipeline.quality) return 'agent'
  if (pipeline.quality > agent.quality) return 'pipeline'
  if (agent.groundedness > pipeline.groundedness + 0.1) return 'agent'
  if (pipeline.groundedness > agent.groundedness + 0.1) return 'pipeline'
  if (agent.latencyMs < pipeline.latencyMs * 0.8) return 'agent'
  if (pipeline.latencyMs < agent.latencyMs * 0.8) return 'pipeline'
  return 'tie'
}

// ---------------------------------------------------------------------------
// Mock Mode
// ---------------------------------------------------------------------------

function generateMockResults(cases: GoldenCase[]): EvalResult[] {
  return cases.map((tc) => {
    const keywords = tc.expected_answer_keywords ?? []
    // Simulate agent: includes most keywords, faster
    const agentAnswer = `根據搜尋結果，${keywords.join('、')}相關的資訊如下：${tc.ground_truth_answer.slice(0, 100)}`
    const agentScore = scoreAnswer(agentAnswer, tc.ground_truth_answer, keywords)

    // Simulate pipeline: includes some keywords, slower
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
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isMock = args.includes('--mock')

  // Load golden test set
  const testSetPath = path.resolve(__dirname, '../tests/golden-test-set.json')
  const testSet: GoldenTestSet = JSON.parse(fs.readFileSync(testSetPath, 'utf-8'))
  const ciCases = testSet.cases.filter((c) => c.ci)

  console.log(`\nLoaded ${testSet.cases.length} cases, ${ciCases.length} marked CI\n`)

  if (isDryRun) {
    console.log('=== DRY RUN: Cases that would be evaluated ===\n')
    for (const tc of ciCases) {
      console.log(`  ${tc.id} [${tc.category}] ${tc.query}`)
      console.log(`    Expected tool: ${tc.expected_tool}`)
      console.log(`    Keywords: ${tc.expected_answer_keywords.join(', ')}`)
      console.log('')
    }
    console.log(`Total: ${ciCases.length} cases would run in ~${ciCases.length * 5}s (est. 5s/case × 2 modes)`)
    return
  }

  if (isMock) {
    console.log('=== MOCK MODE: Using simulated responses ===\n')
    const results = generateMockResults(ciCases)
    const report = generateReport(results, 'mock')
    console.log(report)

    // Save report
    const reportPath = path.resolve(__dirname, '../tests/eval-report-mock.md')
    fs.writeFileSync(reportPath, report, 'utf-8')
    console.log(`\nReport saved to: ${reportPath}`)

    // Save raw results
    const jsonPath = path.resolve(__dirname, '../tests/eval-results-mock.json')
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`Raw results saved to: ${jsonPath}`)
    return
  }

  // Live mode — requires Cloudflare Workers runtime
  console.log('=== LIVE MODE ===')
  console.log('')
  console.log('Live eval requires Cloudflare Workers runtime with D1/KV/R2 bindings.')
  console.log('To run live eval:')
  console.log('')
  console.log('  1. Deploy backend to preview: cd backend && pnpm deploy:preview')
  console.log('  2. Run eval against preview API:')
  console.log('     curl -X POST https://preview-api.nobodyclimb.cc/api/v1/ai/ask \\')
  console.log('       -H "Content-Type: application/json" \\')
  console.log('       -d \'{"query": "龍洞有哪些 5.10 的路線？"}\'')
  console.log('')
  console.log('  Or use --mock to test the eval framework with simulated data.')
  console.log('')
  console.log('Integration with Miniflare for local eval is a future enhancement.')
}

main().catch(console.error)
