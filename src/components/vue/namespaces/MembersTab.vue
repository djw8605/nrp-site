<template>
  <div class="grid gap-5">
    <!-- Add or invite -->
    <div class="grid gap-1.5">
      <div class="flex flex-wrap items-start gap-2">
        <div class="min-w-[14rem] flex-1">
          <label for="ns-add" class="sr-only">Add by name, or paste an email address to invite</label>
          <AutoComplete
            v-model="newUser"
            input-id="ns-add"
            option-label="Title"
            :suggestions="suggestions"
            placeholder="Add by name, or paste an email address to invite"
            fluid
            :aria-describedby="note ? 'ns-add-note' : 'ns-add-help'"
            @complete="searchUsers"
            @keydown.enter="submitAdd"
          >
            <template #option="{ option }">
              <div class="grid">
                <span class="font-medium">{{ option.Name || option.Title || option.Email }}</span>
                <span v-if="option.Email" class="text-xs text-muted"
                  >{{ option.Email }}<template v-if="option.IDP"> · {{ option.IDP }}</template></span
                >
              </div>
            </template>
          </AutoComplete>
        </div>
        <button
          type="button"
          class="btn-primary !px-5 !py-2 text-sm"
          :disabled="!canSubmit || adding"
          @click="submitAdd"
        >
          {{ adding ? 'Adding…' : typedEmail ? 'Invite' : 'Add' }}
        </button>
        <button
          type="button"
          class="btn-tertiary !py-2 text-sm"
          :aria-expanded="bulkOpen"
          aria-controls="ns-add-many"
          @click="bulkOpen = !bulkOpen"
        >
          Add many
        </button>
      </div>
      <p v-if="note" id="ns-add-note" class="flex items-start gap-1.5 text-sm text-body" role="status">
        <svg
          class="mt-0.5 shrink-0 text-muted"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 11v5M12 8h.01"></path>
        </svg>
        <span>{{ note }}</span>
      </p>
      <p v-else id="ns-add-help" class="text-xs text-muted">
        People with an NRP account are added right away. Anyone else is added when they first log in. Invites expire
        after 2 months.
      </p>
    </div>

    <div v-if="bulkOpen" id="ns-add-many" class="grid gap-2 rounded-md bg-surface-1 p-3">
      <label for="ns-add-many-text" class="text-sm font-medium text-heading">Email addresses, one per line</label>
      <textarea
        id="ns-add-many-text"
        v-model="bulkText"
        rows="6"
        class="ns-field px-3 py-2 font-mono text-sm text-heading"
      ></textarea>
      <p class="text-xs text-muted">
        Existing accounts are added right away; everyone else gets an invite they redeem when they first log in.
      </p>
      <div>
        <button
          type="button"
          class="btn-secondary !px-4 !py-2 text-sm"
          :disabled="!bulkText.trim() || adding"
          @click="bulkAdd"
        >
          Add or invite everyone listed
        </button>
      </div>
    </div>

    <!-- Persistent result of the last removal, with Undo. No timeout (WCAG 2.2.1). -->
    <div
      v-if="undo"
      class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-surface-2 px-3 py-2 text-sm text-heading"
      role="status"
    >
      <span>{{ undo.message }}</span>
      <button type="button" class="link-quiet font-semibold" :disabled="undoing" @click="runUndo">
        {{ undoing ? 'Restoring…' : 'Undo' }}
      </button>
      <button type="button" class="ml-auto text-muted hover:text-link" aria-label="Dismiss" @click="undo = null">
        Dismiss
      </button>
    </div>

    <!-- Filter and bulk actions sit side by side, so you can filter then select -->
    <div class="flex flex-wrap items-center gap-3">
      <label class="ns-field flex max-w-xs flex-1 items-center gap-2 px-3 py-1.5">
        <svg
          width="14"
          height="14"
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
        <span class="sr-only">Filter members</span>
        <input
          v-model="memberQuery"
          type="search"
          placeholder="Filter members"
          class="w-full bg-transparent text-sm text-heading placeholder:text-muted focus:outline-none"
        />
      </label>
      <div
        v-if="selectedIds.size"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-surface-2 px-3 py-1.5 text-sm"
        role="group"
        aria-label="Selected members"
      >
        <span class="font-semibold text-heading" aria-live="polite">{{ selectedIds.size }} selected</span>
        <button type="button" class="font-medium text-danger hover:underline" @click="confirmBulkRemove = true">
          Remove from {{ name }}…
        </button>
        <button type="button" class="text-muted hover:text-link" @click="selectedIds = new Set()">
          Clear selection
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-muted" role="status">Loading members…</p>
    <p v-else-if="loadError" class="text-sm text-danger" role="alert">Could not load members: {{ loadError }}</p>

    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b border-hairline text-left text-eyebrow uppercase text-muted">
          <th class="w-11 py-0">
            <label class="grid h-11 w-11 cursor-pointer place-items-center">
              <input
                type="checkbox"
                class="ns-check"
                aria-label="Select all shown members"
                :checked="allShownSelected"
                :indeterminate.prop="someShownSelected"
                @change="toggleAllShown"
              />
            </label>
          </th>
          <th class="py-2 pr-3 font-semibold">Person</th>
          <th class="hidden py-2 pr-3 font-semibold sm:table-cell">Signs in with</th>
          <th class="w-11 py-2"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in shownUsers"
          :id="`ns-member-${u.ID}`"
          :key="u.ID"
          class="border-b border-hairline"
          :class="{ 'bg-surface-1': selectedIds.has(u.ID), 'ns-found': foundId === u.ID }"
        >
          <td class="py-0">
            <label class="grid h-11 w-11 cursor-pointer place-items-center">
              <input
                type="checkbox"
                class="ns-check"
                :aria-label="`Select ${u.Name || u.Email}`"
                :checked="selectedIds.has(u.ID)"
                @change="toggleOne(u.ID)"
              />
            </label>
          </td>
          <td class="py-2.5 pr-3">
            <div class="flex items-center gap-3">
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-heading"
                aria-hidden="true"
                >{{ initials(u) }}</span
              >
              <span class="grid min-w-0">
                <span class="font-medium text-heading">
                  {{ u.Name || u.Email }}
                  <span v-if="isMe(u)" class="text-xs font-normal text-muted">(you)</span>
                  <span
                    v-if="u.IsAdmin"
                    class="ml-1 whitespace-nowrap rounded-full border border-current px-1.5 text-xs font-semibold text-muted"
                    >NRP admin</span
                  >
                </span>
                <span class="text-xs text-muted [overflow-wrap:break-word]"
                  >{{ emailHead(u.Email) }}<wbr />{{ emailTail(u.Email) }}</span
                >
                <span class="font-mono text-xs text-muted [overflow-wrap:anywhere]">{{ u.ID }}</span>
              </span>
            </div>
            <p v-if="rowError?.id === u.ID" class="mt-1.5 flex items-start gap-1.5 text-sm text-danger" role="alert">
              <svg
                class="mt-0.5 shrink-0"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 8v5M12 16h.01"></path>
              </svg>
              <span>{{ rowError.message }}</span>
            </p>
          </td>
          <td class="hidden py-2.5 pr-3 text-xs text-muted sm:table-cell">{{ u.IDP || '—' }}</td>
          <td class="py-0 text-right">
            <button
              type="button"
              class="inline-grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-heading"
              :aria-label="`Actions for ${u.Name || u.Email}`"
              aria-haspopup="menu"
              @click="openMenu($event, u)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.8"></circle>
                <circle cx="12" cy="12" r="1.8"></circle>
                <circle cx="19" cy="12" r="1.8"></circle>
              </svg>
            </button>
          </td>
        </tr>
        <tr v-for="inv in shownInvites" :key="`invite-${inv.Email}`" class="border-b border-hairline">
          <td></td>
          <td class="py-2.5 pr-3">
            <div class="flex items-center gap-3">
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dashed border-current text-muted"
                aria-hidden="true"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 7 9 6 9-6"></path>
                </svg>
              </span>
              <span class="grid min-w-0">
                <span class="font-medium text-heading [overflow-wrap:break-word]"
                  >{{ emailHead(inv.Email) }}<wbr />{{ emailTail(inv.Email) }}</span
                >
                <span class="text-xs text-muted"
                  >Invited by {{ inv.InvitedBy === me ? 'you' : inv.InvitedBy }}, expires
                  {{ formatDate(inv.ExpiresAt) }}</span
                >
              </span>
            </div>
          </td>
          <td class="hidden py-2.5 pr-3 text-xs text-muted sm:table-cell">Not signed in yet</td>
          <td class="py-0 text-right">
            <button
              type="button"
              class="inline-grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-heading"
              :aria-label="`Actions for the invite to ${inv.Email}`"
              aria-haspopup="menu"
              @click="openInviteMenu($event, inv)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.8"></circle>
                <circle cx="12" cy="12" r="1.8"></circle>
                <circle cx="19" cy="12" r="1.8"></circle>
              </svg>
            </button>
          </td>
        </tr>
        <tr v-if="!shownUsers.length && !shownInvites.length">
          <td colspan="4" class="py-4 text-center text-sm text-muted">
            {{ memberQuery ? `No members match "${memberQuery}".` : 'No members yet.' }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="max-w-xl text-xs text-muted">
        {{ users.length }} member{{ users.length === 1 ? '' : 's'
        }}<template v-if="invites.length"
          >, {{ invites.length }} pending invite{{ invites.length === 1 ? '' : 's' }}</template
        >. NRP admin is one role across the whole platform: NRP admins who belong to {{ name
        }}<template v-if="parent"> or to a namespace above it</template> can manage it. Grant or remove it from a
        member's actions menu.
      </p>
      <div class="flex flex-wrap gap-2">
        <a v-if="adminUsers.length" class="btn-secondary !px-4 !py-2 text-sm" :href="mailto(adminUsers)"
          >Email admins</a
        >
        <a v-if="users.length" class="btn-secondary !px-4 !py-2 text-sm" :href="mailto(users)">Email all members</a>
      </div>
    </div>

    <Menu ref="menu" :model="menuItems" popup />

    <Dialog
      v-model:visible="confirmBulkRemove"
      modal
      :header="`Remove ${selectedIds.size} ${selectedIds.size === 1 ? 'person' : 'people'} from ${name}?`"
      :style="{ width: '30rem' }"
    >
      <p class="text-sm text-body">
        They lose access to {{ name }} and anything it grants, such as LLM keys scoped to it. You can undo this right
        after.
      </p>
      <ul class="mt-3 grid list-disc gap-1 pl-5 text-sm text-heading">
        <li v-for="u in selectedUsers" :key="u.ID">
          {{ u.Name || u.Email }}<span v-if="isMe(u)" class="text-muted"> (you)</span>
        </li>
      </ul>
      <template #footer>
        <button type="button" class="btn-secondary !px-4 !py-2 text-sm" @click="confirmBulkRemove = false">
          Cancel
        </button>
        <button type="button" class="ns-danger-btn" :disabled="removing" @click="removeUsers(selectedUsers)">
          {{ removing ? 'Removing…' : 'Remove' }}
        </button>
      </template>
    </Dialog>

    <Dialog
      :visible="!!adminTarget"
      modal
      :header="
        adminTarget?.IsAdmin
          ? `Remove NRP admin from ${who(adminTarget)}?`
          : `Make ${adminTarget ? who(adminTarget) : ''} an NRP admin?`
      "
      :style="{ width: '32rem' }"
      @update:visible="(v: boolean) => !v && (adminTarget = null)"
    >
      <div v-if="adminTarget" class="grid gap-3 text-sm text-body">
        <p class="text-muted">
          <span class="font-mono text-heading">{{ adminTarget.Email }}</span
          ><template v-if="adminTarget.IDP">, signs in with {{ adminTarget.IDP }}</template>
        </p>
        <template v-if="adminTarget.IsAdmin">
          <p>
            They stop managing every namespace, not only {{ name }}. They stay a member of the namespaces they belong
            to.
          </p>
        </template>
        <template v-else>
          <p>
            NRP admin is one role across the whole platform, not only {{ name }}. They will be able to manage every
            namespace they belong to and all subgroups beneath them.
          </p>
          <p>
            The NRP holds namespace admins responsible for all activity in the namespaces they manage. Only do this if
            you are vouching for them.
          </p>
        </template>
      </div>
      <template #footer>
        <button type="button" class="btn-secondary !px-4 !py-2 text-sm" @click="adminTarget = null">Cancel</button>
        <button type="button" class="btn-primary !px-4 !py-2 text-sm" :disabled="promoting" @click="toggleAdmin">
          {{ promoting ? 'Saving…' : adminTarget?.IsAdmin ? 'Remove NRP admin' : 'Make NRP admin' }}
        </button>
      </template>
    </Dialog>

    <Dialog v-model:visible="confirmLeave" modal :header="`Leave ${name}?`" :style="{ width: '30rem' }">
      <p class="text-sm text-body">
        You stop being a member of {{ name }}.
        <template v-if="via && via !== path">You can still manage it through {{ leaf(via) }}.</template>
        <template v-else>Unless you belong to a namespace above it, you will no longer see or manage it.</template>
      </p>
      <template #footer>
        <button type="button" class="btn-secondary !px-4 !py-2 text-sm" @click="confirmLeave = false">Cancel</button>
        <button type="button" class="ns-danger-btn" :disabled="removing" @click="removeUsers(users.filter(isMe))">
          {{ removing ? 'Leaving…' : 'Leave' }}
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import Dialog from 'primevue/dialog';
import Menu from 'primevue/menu';
import { useToast } from 'primevue/usetoast';
import { leaf, parentPath, rpc } from './model';

interface Member {
  ID: string;
  Name?: string;
  Email?: string;
  IDP?: string;
  IsAdmin?: boolean;
  CanDemote?: boolean;
}
interface Invite {
  Email: string;
  InvitedBy?: string;
  ExpiresAt?: string;
}

const props = defineProps<{ name: string; path: string; via: string | null; me: string }>();
const emit = defineEmits<{ count: [n: number] }>();
const toast = useToast();
const parent = computed(() => parentPath(props.path));

const users = ref<Member[]>([]);
const invites = ref<Invite[]>([]);
const loading = ref(true);
const loadError = ref('');

const loadMembers = async () => {
  try {
    const r = await rpc.request({ method: 'admin.GetNSUsers', params: { Namespace: props.name } });
    const admins = (r?.Admins ?? []).map((u: Member) => ({ ...u, IsAdmin: true }));
    const plain = (r?.Users ?? []).map((u: Member) => ({ ...u, IsAdmin: false }));
    users.value = [...admins, ...plain].sort((a, b) =>
      (a.Name || a.Email || '').localeCompare(b.Name || b.Email || '')
    );
    loadError.value = '';
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
    emit('count', users.value.length);
  }
};
const loadInvites = async () => {
  try {
    const r = await rpc.request({ method: 'admin.ListPendingNSInvites', params: { Namespace: props.name } });
    invites.value = r?.Invites ?? [];
  } catch {
    invites.value = [];
  }
};
loadMembers();
loadInvites();

const isMe = (u: Member) => !!u.Email && u.Email.toLowerCase() === props.me.toLowerCase();
const initials = (u: Member) =>
  (u.Name || u.Email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
const emailHead = (e?: string) => (e && e.includes('@') ? e.slice(0, e.indexOf('@') + 1) : (e ?? ''));
const emailTail = (e?: string) => (e && e.includes('@') ? e.slice(e.indexOf('@') + 1) : '');
const formatDate = (v?: string) => {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'unknown';
};
const mailto = (list: Member[]) => {
  const to = list
    .map((u) => u.Email)
    .filter(Boolean)
    .join(',');
  return `mailto:${to}?subject=${encodeURIComponent(`[NRP] ${props.name}`)}`;
};

// Filter and selection
const memberQuery = ref('');
const matches = (text?: string) => !!text && text.toLowerCase().includes(memberQuery.value.trim().toLowerCase());
const shownUsers = computed(() =>
  memberQuery.value.trim() ? users.value.filter((u) => matches(u.Name) || matches(u.Email)) : users.value
);
const shownInvites = computed(() =>
  memberQuery.value.trim() ? invites.value.filter((i) => matches(i.Email)) : invites.value
);
const selectedIds = ref(new Set<string>());
const adminUsers = computed(() => users.value.filter((u) => u.IsAdmin));
const selectedUsers = computed(() => users.value.filter((u) => selectedIds.value.has(u.ID)));
const allShownSelected = computed(
  () => shownUsers.value.length > 0 && shownUsers.value.every((u) => selectedIds.value.has(u.ID))
);
const someShownSelected = computed(
  () => !allShownSelected.value && shownUsers.value.some((u) => selectedIds.value.has(u.ID))
);
const toggleOne = (id: string) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
};
const toggleAllShown = () => {
  const next = new Set(selectedIds.value);
  if (allShownSelected.value) shownUsers.value.forEach((u) => next.delete(u.ID));
  else shownUsers.value.forEach((u) => next.add(u.ID));
  selectedIds.value = next;
};

// Add or invite
const newUser = ref<any>(null);
const suggestions = ref<any[]>([]);
const note = ref('');
const foundId = ref<string | null>(null);
const adding = ref(false);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const typedText = computed(() => (typeof newUser.value === 'string' ? newUser.value.trim() : ''));
const typedEmail = computed(() => (isEmail(typedText.value) ? typedText.value : ''));
const pickedUser = computed(() => (newUser.value && typeof newUser.value === 'object' ? newUser.value : null));
const canSubmit = computed(() => !!pickedUser.value || !!typedEmail.value);

let searchSeq = 0;
const searchUsers = async (e: { query: string }) => {
  const term = e.query.trim();
  if (term.length < 3) {
    suggestions.value = [];
    return;
  }
  const seq = ++searchSeq;
  try {
    const r = await rpc.request({ method: 'admin.ListUsersAC', params: { Term: term } });
    if (seq === searchSeq) suggestions.value = r?.Users ?? [];
  } catch {
    if (seq === searchSeq) suggestions.value = [];
  }
};

const showExisting = async (u: Member) => {
  note.value = `${u.Name || u.Email} is already a member of ${props.name}.`;
  memberQuery.value = '';
  foundId.value = u.ID;
  newUser.value = null;
  await nextTick();
  document.getElementById(`ns-member-${u.ID}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
};

const submitAdd = async () => {
  if (!canSubmit.value || adding.value) return;
  note.value = '';
  foundId.value = null;
  const existing = pickedUser.value
    ? users.value.find((u) => u.ID === pickedUser.value.ID)
    : users.value.find((u) => u.Email?.toLowerCase() === typedEmail.value.toLowerCase());
  if (existing) return showExisting(existing);
  if (typedEmail.value && invites.value.some((i) => i.Email.toLowerCase() === typedEmail.value.toLowerCase())) {
    note.value = `${typedEmail.value} already has a pending invite.`;
    newUser.value = null;
    return;
  }
  adding.value = true;
  try {
    if (pickedUser.value) {
      await rpc.request({ method: 'admin.AddNSUser', params: { Namespace: props.name, UserID: pickedUser.value.ID } });
      toast.add({
        severity: 'success',
        summary: `Added ${pickedUser.value.Name || pickedUser.value.Title} to ${props.name}`,
        life: 4000,
      });
    } else {
      const r = await rpc.request({
        method: 'admin.InviteNSUsers',
        params: { Namespace: props.name, Emails: [typedEmail.value] },
      });
      if (r?.Invalid?.length) throw new Error(`${r.Invalid.join(', ')} is not a valid email address.`);
      const added = r?.Added?.includes(typedEmail.value);
      toast.add({
        severity: 'success',
        summary: added ? `Added ${typedEmail.value}` : `Invited ${typedEmail.value}`,
        detail: added ? 'They already had an account.' : 'They are added when they first log in.',
        life: 5000,
      });
    }
    newUser.value = null;
    await Promise.all([loadMembers(), loadInvites()]);
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not add',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    adding.value = false;
  }
};

const bulkOpen = ref(false);
const bulkText = ref('');
const bulkAdd = async () => {
  const emails = bulkText.value
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!emails.length) return;
  adding.value = true;
  try {
    const r = await rpc.request({ method: 'admin.InviteNSUsers', params: { Namespace: props.name, Emails: emails } });
    const added = r?.Added?.length ?? 0;
    const invited = r?.Invited?.length ?? 0;
    const invalid: string[] = r?.Invalid ?? [];
    toast.add({
      severity: invalid.length ? 'warn' : 'success',
      summary: `Added ${added}, invited ${invited}`,
      detail: invalid.length ? `Not valid email addresses: ${invalid.join(', ')}` : undefined,
      life: invalid.length ? 10000 : 5000,
    });
    if (added || invited) bulkText.value = invalid.join('\n');
    await Promise.all([loadMembers(), loadInvites()]);
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not add',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    adding.value = false;
  }
};

// Remove, with Undo. Leaving yourself and bulk removal confirm first.
const removing = ref(false);
const confirmBulkRemove = ref(false);
const confirmLeave = ref(false);
const undo = ref<{ message: string; people: Member[] } | null>(null);
const undoing = ref(false);
const rowError = ref<{ id: string; message: string } | null>(null);

const removeUsers = async (people: Member[]) => {
  removing.value = true;
  const done: Member[] = [];
  try {
    for (const u of people) {
      try {
        await rpc.request({ method: 'admin.DeleteNSUser', params: { Namespace: props.name, UserID: u.ID } });
        done.push(u);
      } catch (err: unknown) {
        rowError.value = {
          id: u.ID,
          message: `Could not remove ${u.Name || u.Email}. ${err instanceof Error ? err.message : ''} Nothing changed for them.`,
        };
      }
    }
    if (done.length) {
      const who = done.length === 1 ? done[0]!.Name || done[0]!.Email : `${done.length} people`;
      undo.value = { message: `Removed ${who} from ${props.name}.`, people: done };
      selectedIds.value = new Set();
    }
    await loadMembers();
  } finally {
    removing.value = false;
    confirmBulkRemove.value = false;
    confirmLeave.value = false;
  }
};
const runUndo = async () => {
  if (!undo.value) return;
  undoing.value = true;
  try {
    for (const u of undo.value.people)
      await rpc.request({ method: 'admin.AddNSUser', params: { Namespace: props.name, UserID: u.ID } });
    undo.value = null;
    await loadMembers();
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not undo',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  } finally {
    undoing.value = false;
  }
};

// NRP admin is platform-wide, so the confirm says so. The backend reports
// CanDemote on admins whose adminship this caller is allowed to remove.
const adminTarget = ref<Member | null>(null);
const promoting = ref(false);
const who = (u: Member) => u.Name || u.Email || u.ID;
const toggleAdmin = async () => {
  const u = adminTarget.value;
  if (!u) return;
  const promote = !u.IsAdmin;
  promoting.value = true;
  try {
    await rpc.request({ method: 'admin.PromoteUser', params: { UserID: u.ID, IsPromoting: promote } });
    toast.add({
      severity: 'success',
      summary: promote ? `${who(u)} is now an NRP admin` : `${who(u)} is no longer an NRP admin`,
      life: 4000,
    });
    adminTarget.value = null;
    await loadMembers();
  } catch (err: unknown) {
    adminTarget.value = null;
    rowError.value = {
      id: u.ID,
      message: `Could not ${promote ? 'make' : 'remove'} ${who(u)} ${promote ? 'an' : 'as'} NRP admin. ${err instanceof Error ? err.message : ''} Nothing changed for them.`,
    };
  } finally {
    promoting.value = false;
  }
};

const cancelInvite = async (inv: Invite) => {
  try {
    await rpc.request({ method: 'admin.DeletePendingNSInvite', params: { Namespace: props.name, Email: inv.Email } });
    invites.value = invites.value.filter((i) => i.Email !== inv.Email);
    toast.add({ severity: 'success', summary: `Cancelled the invite to ${inv.Email}`, life: 4000 });
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Could not cancel the invite',
      detail: err instanceof Error ? err.message : String(err),
      life: 8000,
    });
  }
};

// One popup menu, filled per row before it opens.
const menu = ref<InstanceType<typeof Menu> | null>(null);
const menuItems = ref<any[]>([]);
const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({ severity: 'success', summary: `Copied ${what}`, life: 2500 });
  } catch {
    toast.add({ severity: 'warn', summary: 'Copy blocked', detail: text, life: 8000 });
  }
};
const openMenu = (e: Event, u: Member) => {
  const first = (u.Name || u.Email || '').split(' ')[0];
  menuItems.value = [
    ...(u.Email ? [{ label: isMe(u) ? 'Email yourself' : `Email ${first}`, url: `mailto:${u.Email}` }] : []),
    { label: 'Copy CILogon ID', command: () => copy(u.ID, 'the CILogon ID') },
    ...(!u.IsAdmin
      ? [{ label: 'Make NRP admin…', command: () => (adminTarget.value = u) }]
      : u.CanDemote
        ? [{ label: 'Remove NRP admin…', command: () => (adminTarget.value = u) }]
        : [{ label: `Only whoever made ${isMe(u) ? 'you' : 'them'} an admin can remove it`, disabled: true }]),
    { separator: true },
    isMe(u)
      ? { label: `Leave ${props.name}…`, class: 'ns-menu-danger', command: () => (confirmLeave.value = true) }
      : { label: `Remove from ${props.name}`, class: 'ns-menu-danger', command: () => removeUsers([u]) },
  ];
  menu.value?.toggle(e);
};
const openInviteMenu = (e: Event, inv: Invite) => {
  menuItems.value = [
    { label: 'Copy email', command: () => copy(inv.Email, 'the email') },
    { separator: true },
    { label: 'Cancel invite', class: 'ns-menu-danger', command: () => cancelInvite(inv) },
  ];
  menu.value?.toggle(e);
};
</script>

<style>
.ns-check {
  width: 1rem;
  height: 1rem;
  accent-color: var(--nrp-teal-700);
}
html.dark .ns-check {
  accent-color: var(--nrp-teal-400);
}
.ns-found {
  box-shadow: inset 0 0 0 2px var(--nrp-ring);
}
.ns-menu-danger .p-menu-item-label {
  color: var(--nrp-danger);
  font-weight: 500;
}
.ns-danger-btn {
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--nrp-danger);
  color: #fff;
}
html.dark .ns-danger-btn {
  color: var(--nrp-surface-page);
}
.ns-danger-btn:disabled {
  background: var(--nrp-surface-2);
  color: var(--nrp-text-muted);
  cursor: not-allowed;
}
.ns-danger-btn:focus-visible {
  outline: 2px solid var(--nrp-ring);
  outline-offset: 2px;
}
</style>
