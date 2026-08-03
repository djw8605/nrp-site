# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The site serves **four distinct audiences**, all confirmed as primary. There is no single dominant
user, and that is a product fact rather than an unresolved question — it is why the navigation carries
both marketing and operational surfaces.

1. **Researchers running workloads.** Grad students, postdocs, and faculty who need GPUs, petabyte-scale
   storage, or a hosted LLM endpoint for their own science. Job: get an account, get into a namespace,
   run something. Currently the audience the homepage leads with.
2. **Educators bringing a course.** Faculty and instructors who need JupyterHub, Coder, or GPUs for a
   class and explicitly do not want to learn Kubernetes. Job: get a namespace sized for a cohort before
   the semester starts. Served by `/education`.
3. **Institutions contributing hardware.** Campus IT, HPC center staff, and PIs deciding whether to put
   nodes into the pool. Job: evaluate the arrangement, then hand over IPMI access. **The entire resource
   model depends on this audience, and the site addresses them least** — worth correcting.
4. **Cluster operators and the NRP team.** The people running Nautilus. They are a real audience for the
   public site, not only for internal tooling: the Dashboards menu, `/live`, `/llm-status`,
   `/reservations`, `/diagnose`, and `/namespaces` exist for them.

## Product Purpose

The National Research Platform pools research computing — GPUs, FPGAs and specialized hardware,
petabyte-scale S3/Ceph storage, and a rotating catalog of hosted open-weight LLMs — across 70+ sites and
offers it **free** to eligible institutions. It is funded by the U.S. National Science Foundation.

Success is twofold and the two halves are interdependent: getting researchers and educators onto the
platform, and getting institutions to contribute hardware into the pool. Neither works alone.

## Positioning

Three things a neighboring product could not truthfully copy:

- **Free to eligible institutions**, because it is NSF-funded rather than cost-recovered. Community
  colleges qualify, not only R1 universities.
- **Contribute-and-keep-priority.** An institution that contributes hardware gets priority on its own
  nodes whenever it wants them; when it is idle, everyone else gets opportunistic access. The NRP
  installs the OS, configures the node, and handles upgrades — it only needs IPMI access.
- **Genuine geographic distribution.** 400+ nodes at 70+ locations on three continents behind one
  Kubernetes API, which makes network and data-locality experiments possible that no single-region
  commercial cloud supports.

## Operating Context

**Access path** (from `src/pages/get-access.md`, and the shape of the whole product):

1. Log in through **CILogon** federated identity — the user's institutional IdP, or Google as a
   fallback. Email must be visible to the provider.
2. First login makes you a **guest**.
3. Any **admin** validates the guest, promotes them to **user**, and adds them to a **namespace**.
4. The user accepts the **Acceptable Use Policy** (`static/NRP-AUP.pdf`) on the portal.
5. Namespace admins are personally responsible for all activity in their namespaces. New groups request
   admin promotion in the support chat.

This vouching model — a human admin taking responsibility for each account — is the real gate, not a
self-serve signup.

**Surfaces and tooling in daily use:** Nautilus (Kubernetes) directly via `kubectl`; hosted JupyterHub
and a private-JupyterHub option; Coder browser IDE; S3 and Ceph storage; an OpenAI-compatible inference
endpoint with per-user API keys scoped to LLM-enabled namespaces; Grafana dashboards and an accounting
system; perfSONAR network dashboards.

**Community rituals:** bi-weekly office hours over Zoom; recorded trainings on Docker, Kubernetes, and
JupyterHub; the National Research Platform workshop series (7NRP most recently); a Matrix-based Nautilus
Support chat that is the primary help channel and is syndicated onto the site.

## Capabilities and Constraints

- **Eligibility: U.S. nonprofit research and education institutions.** International sites contribute
  hardware and host services, but the eligible user base is U.S. institutions. (Confirmed — the cited
  NRP paper's "over 75 locations in the U.S. and internationally" describes *sites*, not eligibility.)
- **NRP vs Nautilus is a hard terminology rule**, not a style preference. See Brand Commitments.
- **Documentation is a 143-page Starlight app** mounted at `/documentation`, with a hand-maintained
  sidebar. It is deliberately outside the marketing site's design system.
- **Cluster scale figures** (400+ nodes / 70+ locations / 3 continents / 5K+ users) live in
  `src/data/cluster-stats.ts` and must be verified against Grafana before changing. Note the cited paper
  says "over 75 locations" where the site says "70+".
- **No privacy policy and no terms of use exist.** Plausible analytics and CILogon authentication are
  both in play, so real ones need writing and institutional review. They must not be regenerated from a
  template — the previous ones were AstroWind demo pages naming a fictional "AstroWind LLC" as data
  controller. `static/NRP-AUP.pdf` is the closest existing real document.
- **A formal governance body exists** — confirmed. Its **name, composition, and public reference are not
  yet supplied**, so no site copy may describe it beyond the current general phrasing ("governed by the
  research community that uses it") until those details are provided. Do not invent a committee name.
- **Open:** whether a formal accessibility standard applies (see below), and what the project counts as
  its headline success metric.

## Brand Commitments

- **Name:** NRP / National Research Platform. Site is `nrp.ai`.
- **NRP is the platform; Nautilus is the Kubernetes cluster it runs on.** NRP is the public-facing name
  used in marketing copy and navigation; Nautilus is the technical name used in documentation, hostnames
  (`nrp-nautilus.io`), and cluster UI. They must not be merged into compound names like "NRP Nautilus".
- **Logo:** `src/assets/images/NRP_Horizontal_Logo.png.webp` — a blue → cyan → teal → green gradient
  wordmark. The site palette is sampled from it.
- **NSF acknowledgement is contractual.** Papers must acknowledge the NRP's NSF grants in the format
  specified by the AUP, and cite *The National Research Platform: Stretched, Multi-Tenant, Scientific
  Kubernetes Cluster* (ACM, `10.1145/3708035.3736060`). The NSF logo and award list appear in the site
  footer and on `/about`.

## Evidence on Hand

**Real, usable:**

- **Award numbers:** CNS-1730158, ACI-1540112, ACI-1541349, OAC-1826967, OAC-2112167, CNS-2100237,
  CNS-2120019. Duplicated in `src/navigation.ts` (`footerData.funding`) and `src/pages/about.astro`
  (`nsfAwards`) — keep in sync.
- **A peer-reviewed paper** describing the platform (ACM DOI above), suitable as third-party proof.
- **Named people with portraits:** PI Frank Würthwein plus co-PIs Tajana Rosing, Tom DeFanti, Mahidhar
  Tatineni, and Derek Weitzel; 13 more team members. Photos in `src/assets/images/people/`. Quality is
  inconsistent (one is black-and-white, framing and resolution vary from 72×72 to 1000×917).
- **Partner logos** in `src/assets/images/partners/`, rendered on `/partners`.
- **Workshop media:** 7NRP agenda, slides, tutorials, and a YouTube session playlist.
- **Live operational data:** Grafana, perfSONAR, the site map at `dash.nrp-nautilus.io/map`, and the
  Matrix support feed — all real and already surfaced on the site.
- **15 live blog posts** in `src/content/post/`.

**Absences future work must not fabricate:**

- No customer testimonials, quotes, or named success stories.
- No pricing or licensing — the platform is free, and a paid tier previously appeared only as leftover
  template content.
- No project history or timeline. There is a lineage (Larry Smarr is credited as PI of PRP, the
  predecessor), but no dates or transition narrative exist in the repository.
- No privacy policy, terms of use, or governance description.
- `src/content/post_wp/` (75 files) and `post_original/` (6) are an unregistered WordPress migration
  backlog and template demo posts. They are not published and are not evidence.

## Product Principles

1. **Free and federally funded is the headline, but capability is the hook.** Lead with what a
   researcher can do; state that it is free as the closing argument, not the opening one.
2. **Contribution and consumption are one loop.** Every audience-facing decision should make the
   contributor path as legible as the user path, because the pool only exists if institutions keep
   feeding it.
3. **No Kubernetes required — but Kubernetes is available.** Hosted JupyterHub, Coder, and the
   OpenAI-compatible endpoint must stay first-class for people who will never write a manifest, without
   hiding direct cluster access from those who want it.
4. **Access is vouched, not self-serve.** Anything describing signup must reflect the real
   guest → user → namespace → AUP path rather than implying instant access.
5. **Never fabricate institutional facts.** Award numbers, eligibility, governance, policy, and scale
   figures have authoritative sources; when one is missing, say so rather than filling it in.

## Accessibility & Inclusion

- The project enforces **WCAG 2 AA** in practice: `pa11y-ci` runs over nine key routes in CI, and both
  light and dark modes are contrast-verified. Nine of nine routes currently pass.
- **Open decision:** whether a *formal* standard applies (Section 508 / NSF award terms / institutional
  policy) as opposed to this being a self-imposed bar. This matters because a formal obligation would
  extend to the Starlight documentation, which is currently outside the design system.
- The audience includes community colleges and under-resourced institutions, so the site must not assume
  fast networks or modern hardware. Page-weight budget: under 450 KB at mobile viewport width.
