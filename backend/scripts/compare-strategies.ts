#!/usr/bin/env tsx

/**
 * RAG Strategy Comparison Script
 *
 * Compares multiple evaluation reports side-by-side.
 *
 * Usage:
 *   tsx backend/scripts/compare-strategies.ts report-fast.json report-thorough.json report-corrective.json
 */

import fs from 'fs'

interface ReportMetrics {
  tool_accuracy: number | null
  faithfulness: number | null
  answer_relevancy: number | null
  recall_at_5: number | null
  filter_accuracy: number | null
  success_rate: number | null
}

interface PerfStats {
  latency_ms: { avg: number; p50: number; p95: number; min: number; max: number } | null
  token_count: { avg: number; total: number } | null
}

interface Report {
  strategy?: string
  metrics: ReportMetrics
  performance?: PerfStats
  summary: { total: number; passed: number; failed: number; errors: number }
  results: Array<{
    id: string
    query: string
    status: 'pass' | 'fail' | 'error'
    details: Record<string, unknown>
  }>
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

function loadReport(path: string): Report {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

function fmtPct(v: number | null): string {
  if (v === null) return '  N/A'
  const pct = (v * 100).toFixed(1)
  return `${pct.padStart(5)}%`
}

function fmtMs(v: number | null | undefined): string {
  if (v == null) return '  N/A'
  return `${String(v).padStart(5)}ms`
}

function colorPct(v: number | null, threshold = 0.8): string {
  if (v === null) return fmtPct(v)
  if (v >= threshold) return `${GREEN}${fmtPct(v)}${RESET}`
  if (v >= threshold * 0.8) return `${YELLOW}${fmtPct(v)}${RESET}`
  return `${RED}${fmtPct(v)}${RESET}`
}

function main() {
  const files = process.argv.slice(2)
  if (files.length < 2) {
    console.error('Usage: tsx compare-strategies.ts <report1.json> <report2.json> [report3.json ...]')
    process.exit(1)
  }

  const reports = files.map((f) => ({ file: f, report: loadReport(f) }))

  // Header
  const names = reports.map((r) => r.report.strategy ?? r.file.replace(/.*\//, '').replace('.json', ''))
  const colWidth = 12
  const header = ''.padEnd(22) + names.map((n) => n.padStart(colWidth)).join('')
  console.log(`\n${BOLD}RAG Strategy Comparison${RESET}\n`)
  console.log(header)
  console.log('─'.repeat(22 + colWidth * names.length))

  // Quality metrics
  const metricKeys: Array<{ key: keyof ReportMetrics; label: string }> = [
    { key: 'success_rate', label: 'Success Rate' },
    { key: 'tool_accuracy', label: 'Tool Accuracy' },
    { key: 'answer_relevancy', label: 'Answer Relevancy' },
    { key: 'faithfulness', label: 'Faithfulness' },
    { key: 'recall_at_5', label: 'Recall@5' },
    { key: 'filter_accuracy', label: 'Filter Accuracy' },
  ]

  console.log(`\n${BOLD}Quality Metrics${RESET}`)
  for (const { key, label } of metricKeys) {
    const row = label.padEnd(22) + reports.map((r) => colorPct(r.report.metrics[key]).padStart(colWidth + 9)).join('')
    console.log(row)
  }

  // Performance
  console.log(`\n${BOLD}Performance${RESET}`)
  const latRow = 'Latency (avg)'.padEnd(22) + reports.map((r) => fmtMs(r.report.performance?.latency_ms?.avg).padStart(colWidth)).join('')
  const p95Row = 'Latency (p95)'.padEnd(22) + reports.map((r) => fmtMs(r.report.performance?.latency_ms?.p95).padStart(colWidth)).join('')
  const tokRow = 'Tokens (avg)'.padEnd(22) + reports.map((r) => {
    const v = r.report.performance?.token_count?.avg
    return v != null ? String(v).padStart(colWidth) : '  N/A'.padStart(colWidth)
  }).join('')
  console.log(latRow)
  console.log(p95Row)
  console.log(tokRow)

  // Summary
  console.log(`\n${BOLD}Summary${RESET}`)
  const passRow = 'Passed'.padEnd(22) + reports.map((r) => `${r.report.summary.passed}/${r.report.summary.total}`.padStart(colWidth)).join('')
  const failRow = 'Failed'.padEnd(22) + reports.map((r) => String(r.report.summary.failed).padStart(colWidth)).join('')
  const errRow = 'Errors'.padEnd(22) + reports.map((r) => String(r.report.summary.errors).padStart(colWidth)).join('')
  console.log(passRow)
  console.log(failRow)
  console.log(errRow)

  // Per-case diff: find cases where strategies disagree
  const allIds = new Set(reports.flatMap((r) => r.report.results.map((res) => res.id)))
  const disagreements: Array<{ id: string; query: string; statuses: string[] }> = []

  for (const id of allIds) {
    const statuses = reports.map((r) => {
      const result = r.report.results.find((res) => res.id === id)
      return result?.status ?? 'missing'
    })
    if (new Set(statuses).size > 1) {
      const query = reports[0].report.results.find((r) => r.id === id)?.query ?? ''
      disagreements.push({ id, query: query.slice(0, 50), statuses })
    }
  }

  if (disagreements.length > 0) {
    console.log(`\n${BOLD}Disagreements (${disagreements.length} cases)${RESET}`)
    const disHeader = 'ID'.padEnd(10) + 'Query'.padEnd(52) + names.map((n) => n.padStart(colWidth)).join('')
    console.log(disHeader)
    console.log('─'.repeat(62 + colWidth * names.length))
    for (const d of disagreements.slice(0, 20)) {
      const row = d.id.padEnd(10) + d.query.padEnd(52) + d.statuses.map((s) => {
        const colored = s === 'pass' ? `${GREEN}${s}${RESET}` : s === 'fail' ? `${RED}${s}${RESET}` : `${YELLOW}${s}${RESET}`
        return colored.padStart(colWidth + 9)
      }).join('')
      console.log(row)
    }
    if (disagreements.length > 20) {
      console.log(`  ... and ${disagreements.length - 20} more`)
    }
  }

  console.log()
}

main()
