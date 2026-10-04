import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';

// One JSON-RPC client for every namespaces component. The portal keys sessions by
// cookie, so every request carries credentials.
export const rpc = new Client(
  new RequestManager([new HTTPTransport(import.meta.env.PUBLIC_SVC_URL + '/rpc', { credentials: 'include' })])
);

// What groups.ListUserGroups returns for each node. Name is the full path from the
// root ("nrp/unl/unl-hcc"); IsMember is true only where the user is a direct member.
export interface GroupNode {
  Name: string;
  IsK8sNamespace?: boolean;
  IsLiteLLMOrg?: boolean;
  IsMilvusDB?: boolean;
  IsMember?: boolean;
}

export interface Feature {
  key: 'is_k8s_namespace' | 'is_litellm_org' | 'is_milvus_db';
  label: string;
}

export const FEATURES: Feature[] = [
  { key: 'is_k8s_namespace', label: 'K8s' },
  { key: 'is_litellm_org', label: 'LLM' },
  { key: 'is_milvus_db', label: 'Milvus' },
];

export const leaf = (path: string) => path.slice(path.lastIndexOf('/') + 1);
export const parentPath = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
export const ancestors = (path: string) => {
  const parts = path.split('/');
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
};

export const nodeFeatures = (n: GroupNode | undefined) => {
  if (!n) return [];
  const on: string[] = [];
  if (n.IsK8sNamespace) on.push('K8s');
  if (n.IsLiteLLMOrg) on.push('LLM');
  if (n.IsMilvusDB) on.push('Milvus');
  return on;
};

export interface Index {
  byPath: Map<string, GroupNode>;
  children: Map<string, string[]>;
  roots: string[];
  memberPaths: Set<string>;
}

export const buildIndex = (nodes: GroupNode[]): Index => {
  const byPath = new Map(nodes.map((n) => [n.Name, n]));
  const children = new Map<string, string[]>();
  const roots: string[] = [];
  for (const n of nodes) {
    const parent = parentPath(n.Name);
    if (parent && byPath.has(parent)) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent)!.push(n.Name);
    } else {
      roots.push(n.Name);
    }
  }
  const byLeaf = (a: string, b: string) => leaf(a).localeCompare(leaf(b));
  children.forEach((list) => list.sort(byLeaf));
  roots.sort(byLeaf);
  const memberPaths = new Set(nodes.filter((n) => n.IsMember).map((n) => n.Name));
  return { byPath, children, roots, memberPaths };
};

// The portal's rule (CheckUserCanAccessNamespace): you can manage a namespace when
// you are in the NRP-wide admins group AND a member of it or of any ancestor.
// Returns the path that grants it, or null.
export const managedThrough = (path: string, index: Index, isAdmin: boolean): string | null => {
  if (!isAdmin) return null;
  if (index.memberPaths.has(path)) return path;
  const up = ancestors(path).reverse();
  return up.find((p) => index.memberPaths.has(p)) ?? null;
};

export const descendantCount = (path: string, index: Index): number => {
  const kids = index.children.get(path) ?? [];
  return kids.reduce((sum, k) => sum + 1 + descendantCount(k, index), 0);
};

// Filtering matches on the leaf name. Ancestors of a match stay visible so the
// tree keeps its shape, but they are not counted as matches.
export const matchFilter = (index: Index, query: string) => {
  const q = query.trim().toLowerCase();
  const matched = new Set<string>();
  const visible = new Set<string>();
  if (!q) return { q, matched, visible };
  for (const path of index.byPath.keys()) {
    if (leaf(path).toLowerCase().includes(q)) {
      matched.add(path);
      visible.add(path);
      ancestors(path).forEach((a) => visible.add(a));
    }
  }
  return { q, matched, visible };
};

// Splits a label around the first match so the template can bold it.
export const highlightParts = (text: string, q: string) => {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return [{ text, hit: false }];
  return [
    { text: text.slice(0, i), hit: false },
    { text: text.slice(i, i + q.length), hit: true },
    { text: text.slice(i + q.length), hit: false },
  ].filter((p) => p.text);
};

// Safe localStorage access: private windows and blocked storage throw.
export const remember = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* per-viewer convenience only */
    }
  },
};

export const loginUrl = () => import.meta.env.PUBLIC_SVC_URL + '/auth?next=' + encodeURIComponent(window.location.href);
