/**
 * Third-party benchmark scores for the NRP-managed models, used by
 * `components/ai/ModelBenchmarkChart.astro` on the Available Models page.
 *
 * Every number here is Artificial Analysis' own published figure, read off their
 * per-model pages. Nothing is computed or estimated locally — if AA does not
 * publish a score for a model, the field is `null` and the model is dropped from
 * that chart rather than being drawn at zero.
 *
 * AA benchmarks a *specific* configuration of each model, and the reasoning
 * setting moves these numbers a long way. `aaVariant` records which one, and the
 * variants below were chosen to match how NRP serves the model (reasoning on,
 * highest effort, since that is the default in every case). Re-check it when
 * updating: a score copied from the non-reasoning row is not comparable.
 *
 * `modelId` keys into the `models` content collection (`src/content/models/*.yaml`).
 * A key that no longer resolves is a build-time error in the chart component, so
 * renaming a model here cannot silently drop it from the graph.
 *
 * To refresh: open each `sourceUrl` and copy the two headline numbers. There is no
 * public JSON feed, and AA's terms do not permit redistributing their dataset —
 * this is a small quotation of published figures with attribution, kept in sync by
 * hand.
 */

import type { CreatorKey } from './model-creators';

export interface BenchmarkMetric {
  /** Axis / card title. */
  label: string;
  /** AA's own description line, reproduced under the title. */
  subtitle: string;
  /** Short note on what the benchmark actually measures. */
  note: string;
  /** Key on `ModelBenchmark` holding the value. */
  key: 'intelligenceIndex' | 'terminalBench';
  /** Unit suffix rendered after the value label, if any. */
  unit: string;
  sourceUrl: string;
}

export interface ModelBenchmark {
  /** `id` of the entry in the `models` collection. */
  modelId: string;
  /** AA's name for the exact configuration measured. */
  aaVariant: string;
  aaSlug: string;
  /** Key into `CREATORS` — decides the bar's colour and mark. */
  creator: CreatorKey;
  /** Artificial Analysis Intelligence Index, 0-100. */
  intelligenceIndex: number | null;
  /** Terminal-Bench v2.1, % of tasks resolved. */
  terminalBench: number | null;
  /**
   * AA flags the Intelligence Index as estimated when it could not run every
   * component evaluation itself. Drawn hatched, and footnoted.
   */
  intelligenceIndexEstimated?: boolean;
}

export const BENCHMARK_SOURCE = {
  name: 'Artificial Analysis',
  url: 'https://artificialanalysis.ai/leaderboards/models',
  /** Per-model pages live at `${modelUrlBase}/${aaSlug}`. */
  modelUrlBase: 'https://artificialanalysis.ai/models',
  /** Date the figures below were last read off AA. */
  retrieved: '2026-08-31',
} as const;

export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  {
    label: 'Intelligence',
    subtitle: 'Artificial Analysis Intelligence Index · Higher is better',
    note:
      'A composite of ten evaluations spanning reasoning, knowledge, instruction ' +
      'following, long context, and agentic tool use — AA’s single headline number ' +
      'for general capability.',
    key: 'intelligenceIndex',
    unit: '',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index',
  },
  {
    label: 'Coding',
    subtitle: 'Terminal-Bench v2.1 · % of tasks resolved · Higher is better',
    note:
      'Agentic coding: the model is dropped into a terminal and has to finish a real ' +
      'software task end to end. It is the coding-heaviest component of the ' +
      'Intelligence Index and the closest published proxy for “how well does this ' +
      'model drive a coding agent”.',
    key: 'terminalBench',
    unit: '%',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/terminalbench-v2-1',
  },
];

/**
 * Sorted by Intelligence Index descending, purely for readability of this file —
 * the chart sorts per metric.
 *
 * `qwen3-embedding` is deliberately absent: it is an embedding model, not a chat
 * model, and no chat benchmark applies to it.
 */
export const MODEL_BENCHMARKS: ModelBenchmark[] = [
  {
    modelId: 'glm-5',
    aaVariant: 'GLM-5.3 (max)',
    aaSlug: 'glm-5-3',
    creator: 'zai',
    intelligenceIndex: 59.5,
    terminalBench: 83.9,
  },
  {
    modelId: 'qwen3',
    aaVariant: 'Qwen3.8-Flash-Next',
    aaSlug: 'qwen3-8-flash-next',
    creator: 'alibaba',
    intelligenceIndex: 55.8,
    terminalBench: 86.1,
  },
  {
    modelId: 'qwen3-small',
    aaVariant: 'Qwen3.8 27B (xhigh)',
    aaSlug: 'qwen3-8-27b',
    creator: 'alibaba',
    intelligenceIndex: 52.0,
    terminalBench: 79.8,
  },
  {
    modelId: 'deepseek-v4-flash',
    aaVariant: 'DeepSeek V4 Flash 0731 (Reasoning, Max Effort)',
    aaSlug: 'deepseek-v4-flash',
    creator: 'deepseek',
    intelligenceIndex: 51.8,
    terminalBench: 78.7,
  },
  {
    modelId: 'kimi',
    aaVariant: 'Kimi K2.7 Code',
    aaSlug: 'kimi-k2-7-code',
    creator: 'moonshot',
    intelligenceIndex: 43.0,
    terminalBench: 67.4,
  },
  {
    modelId: 'minimax-m2',
    aaVariant: 'MiniMax-M2.7',
    aaSlug: 'minimax-m2-7',
    creator: 'minimax',
    intelligenceIndex: 38.9,
    terminalBench: 55.4,
  },
  {
    modelId: 'gemma',
    aaVariant: 'Gemma 4 31B (Reasoning)',
    aaSlug: 'gemma-4-31b',
    creator: 'google',
    intelligenceIndex: 29.7,
    terminalBench: 43.4,
  },
  {
    modelId: 'gpt-oss',
    aaVariant: 'gpt-oss-120b (high)',
    aaSlug: 'gpt-oss-120b',
    creator: 'openai',
    intelligenceIndex: 24.1,
    terminalBench: 26.2,
  },
  {
    modelId: 'gemma-small',
    aaVariant: 'Gemma 4 12B (Reasoning)',
    aaSlug: 'gemma-4-12b',
    creator: 'google',
    intelligenceIndex: 22.2,
    intelligenceIndexEstimated: true,
    terminalBench: 27.3,
  },
];
