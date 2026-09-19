/**
 * Thorough graph — 高品質、單輪精排模式（3-6s，2-4 次 LLM 呼叫）
 *
 * 完整 pipeline：semanticCache → textNormalize → intentClassifier → metadataFilter →
 * queryEmbedding → HyDE → queryExpansion → hybridRetrieval → semanticRerank →
 * diversityFilter → domainRerank → responseGeneration → responseQualityJudge →
 * generationRetry(queryRewrite) → conversationMemory
 *
 * 與 baseline 共用同一個 graph 定義 — baseline 就是 Thorough。
 */
export {
  baselineGraph as thoroughGraph,
  buildBaselineGraph as buildThoroughGraph,
} from './baseline'
