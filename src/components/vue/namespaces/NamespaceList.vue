<template>
  <div class="flex h-full flex-col">
    <div
      class="grid gap-2.5 border-b border-hairline bg-surface-1 p-3 lg:sticky lg:top-[77px] lg:z-10 lg:rounded-tl-lg"
    >
      <label class="ns-field flex items-center gap-2 px-3 py-2">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
          class="shrink-0 text-muted"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-3.5-3.5"></path>
        </svg>
        <span class="sr-only">Filter namespaces by name</span>
        <input
          v-model="query"
          type="search"
          placeholder="Filter by name"
          class="w-full bg-transparent text-sm text-heading placeholder:text-muted focus:outline-none"
        />
      </label>
      <div class="flex items-center justify-between gap-2">
        <div class="ns-segment" role="radiogroup" aria-label="Namespace view">
          <button type="button" role="radio" :aria-checked="view === 'mine'" @click="setView('mine')">
            Mine ({{ mineCount }})
          </button>
          <button type="button" role="radio" :aria-checked="view === 'tree'" @click="setView('tree')">
            Tree ({{ index.byPath.size }})
          </button>
        </div>
        <span v-if="filter.q" class="text-xs text-muted" aria-live="polite">{{ matchLabel }}</span>
      </div>
    </div>

    <!-- Mine: the groups you are a direct member of -->
    <nav v-if="view === 'mine'" class="py-1" aria-label="Your namespaces">
      <p v-if="mineRows.length === 0" class="px-3 py-4 text-sm text-muted">
        {{
          filter.q
            ? `None of your namespaces match "${query.trim()}".`
            : 'You are not a direct member of any namespace.'
        }}
        <button v-if="filter.q" type="button" class="link-quiet" @click="setView('tree')">Search the tree</button>
      </p>
      <ul>
        <li v-for="row in mineRows" :key="row.path">
          <a
            :href="`?ns=${encodeURIComponent(row.path)}`"
            class="ns-row grid gap-0.5 py-2 pr-3"
            :class="[row.child ? 'pl-7' : 'pl-3', row.path === selected ? 'is-selected' : '']"
            :aria-current="row.path === selected ? 'page' : undefined"
            @click.prevent="$emit('select', row.path)"
          >
            <span class="flex items-baseline justify-between gap-2">
              <span class="font-mono text-sm text-heading">
                <template v-for="(part, i) in highlightParts(leaf(row.path), filter.q)" :key="i"
                  ><mark v-if="part.hit" class="ns-hit">{{ part.text }}</mark
                  ><template v-else>{{ part.text }}</template></template
                >
              </span>
              <span class="flex shrink-0 gap-1">
                <span v-for="f in nodeFeatures(index.byPath.get(row.path))" :key="f" class="ns-chip">{{ f }}</span>
              </span>
            </span>
            <span class="font-mono text-xs text-muted">{{ row.note }}</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Tree: the full hierarchy you can see -->
    <ul v-else ref="treeEl" role="tree" aria-label="Namespace hierarchy" class="py-1" @keydown="onTreeKey">
      <li v-if="treeRows.length === 0" class="px-3 py-4 text-sm text-muted">
        No namespaces match "{{ query.trim() }}".
      </li>
      <li
        v-for="row in treeRows"
        :key="row.path"
        role="treeitem"
        :aria-level="row.depth + 1"
        :aria-expanded="row.hasKids ? row.open : undefined"
        :aria-selected="row.path === selected"
        :tabindex="row.path === focusPath ? 0 : -1"
        :data-path="row.path"
        class="ns-row flex cursor-pointer flex-wrap items-center gap-x-1 gap-y-0.5 py-1.5 pr-3"
        :class="[
          row.path === selected ? 'is-selected' : '',
          filter.q && !filter.matched.has(row.path) ? 'is-context' : '',
        ]"
        :style="{ paddingLeft: `${0.5 + row.depth * 1.1}rem` }"
        @click="onTreeClick(row)"
        @focus="focusPath = row.path"
      >
        <button
          v-if="row.hasKids"
          type="button"
          tabindex="-1"
          class="grid h-6 w-6 shrink-0 place-items-center rounded text-muted hover:text-heading"
          :aria-label="row.open ? `Collapse ${leaf(row.path)}` : `Expand ${leaf(row.path)}`"
          @click.stop="toggle(row.path)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
            :class="row.open ? 'rotate-90' : ''"
          >
            <path d="m9 6 6 6-6 6"></path>
          </svg>
        </button>
        <span v-else class="h-6 w-6 shrink-0" aria-hidden="true"></span>
        <span class="ns-tree-name min-w-0 truncate font-mono text-sm text-heading">
          <template v-for="(part, i) in highlightParts(leaf(row.path), filter.q)" :key="i"
            ><mark v-if="part.hit" class="ns-hit">{{ part.text }}</mark
            ><template v-else>{{ part.text }}</template></template
          >
          <span v-if="row.hasKids && !row.open" class="ml-1 text-xs text-muted"
            >{{ row.count }}<span class="sr-only"> subgroups</span></span
          >
        </span>
        <!-- Labels sit right of the name, and drop to a line of their own when the name needs the room. -->
        <span class="ml-auto flex shrink-0 items-center gap-1">
          <span v-if="index.memberPaths.has(row.path)" class="text-xs font-semibold text-link">member</span>
          <span v-for="f in nodeFeatures(index.byPath.get(row.path))" :key="f" class="ns-chip ns-chip-tight">{{
            f
          }}</span>
        </span>
      </li>
    </ul>

    <div class="mt-auto border-t border-hairline px-3 py-2.5">
      <a class="link-quiet text-sm" href="/documentation/userdocs/start/hierarchy">How namespaces are organized</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  ancestors,
  descendantCount,
  highlightParts,
  leaf,
  matchFilter,
  nodeFeatures,
  parentPath,
  remember,
  type Index,
} from './model';

const props = defineProps<{ index: Index; selected: string | null; defaultView: 'mine' | 'tree' }>();
const emit = defineEmits<{ select: [path: string] }>();

const VIEW_KEY = 'nrp.namespaces.view';
const stored = remember.get(VIEW_KEY);
const view = ref<'mine' | 'tree'>(stored === 'mine' || stored === 'tree' ? stored : props.defaultView);
const setView = (v: 'mine' | 'tree') => {
  view.value = v;
  remember.set(VIEW_KEY, v);
};

const query = ref('');
const filter = computed(() => matchFilter(props.index, query.value));

const mineCount = computed(() => props.index.memberPaths.size);
const matchLabel = computed(() => {
  const n = view.value === 'mine' ? mineRows.value.length : filter.value.matched.size;
  return `${n} match${n === 1 ? '' : 'es'}`;
});

// Mine lists direct memberships. If the selected namespace is one you reach through
// a parent, it is shown nested under that parent so the selection never disappears.
const mineRows = computed(() => {
  const members = [...props.index.memberPaths].sort((a, b) => leaf(a).localeCompare(leaf(b)));
  const q = filter.value.q;
  const rows: { path: string; note: string; child?: boolean }[] = [];
  for (const path of members) {
    if (q && !leaf(path).toLowerCase().includes(q)) continue;
    rows.push({ path, note: parentPath(path) ? `in ${parentPath(path)}` : 'top level' });
    const sel = props.selected;
    if (sel && !props.index.memberPaths.has(sel) && sel.startsWith(path + '/') && !q) {
      const nearest = ancestors(sel)
        .reverse()
        .find((a) => props.index.memberPaths.has(a));
      if (nearest === path) rows.push({ path: sel, note: `through ${leaf(path)}`, child: true });
    }
  }
  return rows;
});

// Tree expansion: roots, the path to the selection and to each membership start open.
const expanded = ref(new Set<string>());
const openPathTo = (path: string) => ancestors(path).forEach((a) => expanded.value.add(a));
props.index.roots.forEach((r) => expanded.value.add(r));
props.index.memberPaths.forEach(openPathTo);
watch(
  () => props.selected,
  (sel) => {
    if (sel) openPathTo(sel);
  },
  { immediate: true }
);
const toggle = (path: string) => {
  const next = new Set(expanded.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  expanded.value = next;
};

interface TreeRow {
  path: string;
  depth: number;
  hasKids: boolean;
  open: boolean;
  count: number;
}
const treeRows = computed<TreeRow[]>(() => {
  const rows: TreeRow[] = [];
  const f = filter.value;
  const walk = (path: string, depth: number) => {
    if (f.q && !f.visible.has(path)) return;
    const kids = (props.index.children.get(path) ?? []).filter((k) => !f.q || f.visible.has(k));
    const open = f.q ? true : expanded.value.has(path);
    rows.push({ path, depth, hasKids: kids.length > 0, open, count: descendantCount(path, props.index) });
    if (open) kids.forEach((k) => walk(k, depth + 1));
  };
  props.index.roots.forEach((r) => walk(r, 0));
  return rows;
});

// Roving focus for the tree (WAI-ARIA tree pattern).
const treeEl = ref<HTMLElement | null>(null);
// One row is always tabbable, so the tree is reachable with Tab before anything is selected.
const focusPath = ref<string | null>(props.selected);
watch(
  treeRows,
  (rows) => {
    if (!rows.some((r) => r.path === focusPath.value)) focusPath.value = rows[0]?.path ?? null;
  },
  { immediate: true }
);
const focusRow = async (path: string) => {
  focusPath.value = path;
  await nextTick();
  treeEl.value?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)?.focus();
};
const onTreeClick = (row: TreeRow) => {
  focusPath.value = row.path;
  emit('select', row.path);
};
const onTreeKey = (e: KeyboardEvent) => {
  const rows = treeRows.value;
  const i = rows.findIndex((r) => r.path === focusPath.value);
  if (i < 0) return;
  const row = rows[i];
  const go = (j: number) => rows[j] && focusRow(rows[j].path);
  switch (e.key) {
    case 'ArrowDown':
      go(i + 1);
      break;
    case 'ArrowUp':
      go(i - 1);
      break;
    case 'Home':
      go(0);
      break;
    case 'End':
      go(rows.length - 1);
      break;
    case 'ArrowRight':
      if (row.hasKids && !row.open) toggle(row.path);
      else if (row.hasKids) go(i + 1);
      break;
    case 'ArrowLeft':
      if (row.hasKids && row.open && !filter.value.q) toggle(row.path);
      else if (parentPath(row.path)) focusRow(parentPath(row.path));
      break;
    case 'Enter':
    case ' ':
      emit('select', row.path);
      break;
    default:
      return;
  }
  e.preventDefault();
};
</script>
