/**
 * The NRP MCP gateway host, and the doc pages that explain how to publish to it.
 *
 * Registered MCP servers are reachable at `https://mcp.nrp-nautilus.io/<path>`,
 * where the path is either `/<namespace>/<name>` (granted automatically to a
 * member of that namespace) or `/<name>` (a top-level name, reviewed by an NRP
 * admin). The host is data, not markup, so the readout on `/mcp` and the URL
 * previews the same page generates can never disagree.
 *
 * The portal has its own copy of this host, in `portal.mcp_registry.public_host`:
 * it builds `MCPServerInfo.PublicURL` server-side, and that value is what the
 * table renders. This constant is what the page shows before any row exists
 * (the live preview on the apply form).
 *
 * The Starlight docs under `userdocs/ai/mcp-hosting` and
 * `admindocs/ai/mcp-registry` still carry the host literally: theirs sit inside
 * fenced code samples, which do not interpolate. If the host ever changes, grep
 * for `mcp.nrp-nautilus.io`.
 */
const host = 'https://mcp.nrp-nautilus.io';

export const MCP_ENDPOINT = {
  /** Origin only, for building preview URLs and prose. */
  host,
  /** Bare hostname, for the `Host` header and allow-list copy. */
  hostname: 'mcp.nrp-nautilus.io',
  /** The shape of a namespace-tier public path. */
  pathExample: '/<namespace>/<name>',
  /** How to run and register a server. The "how do I publish this" page. */
  docsHref: '/documentation/userdocs/ai/mcp-hosting',
  /** Reviewing top-level names, and what the portal writes into the cluster. */
  adminDocsHref: '/documentation/admindocs/ai/mcp-registry',
} as const;
