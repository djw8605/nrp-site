/**
 * The NRP-managed LLM endpoint, and the doc pages that explain how to use it.
 *
 * The base URL used to be typed literally in exactly one place on the site --
 * the Chatbox config template inside `components/vue/LLMToken.vue` -- which is
 * why /llmtoken, the page a visitor lands on to get a key, never displayed the
 * one string they came for. It lives here so the panel on that page and the
 * config the same page generates can never disagree.
 *
 * The Starlight docs under `userdocs/ai/llm-managed/` still carry the host
 * literally: theirs sit inside fenced code samples, which do not interpolate.
 * If the host ever changes, grep for `ellm.nrp-nautilus.io`.
 */
const host = 'https://ellm.nrp-nautilus.io';

export const LLM_ENDPOINT = {
  /** Origin only, for clients that append their own `/v1`. */
  host,
  /** What an OpenAI-compatible client wants as its base URL. */
  baseUrl: `${host}/v1`,
  /** Auth, Python, curl, cache isolation. The "how do I use this" page. */
  docsHref: '/documentation/userdocs/ai/llm-managed/api-access',
  /** Ready-made configs for coding CLIs -- OpenCode, Claude Code, Copilot CLI. */
  clientConfigsHref: '/documentation/userdocs/ai/llm-managed/client-configs',
} as const;
