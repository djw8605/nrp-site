---
publishDate: 2026-06-24T00:00:00Z
title: "Inference as a Medium: A UCSD Art Class Runs Its Ethical-Dilemma Final on NRP"
excerpt: For the final of VIS 145B at UC San Diego, instructor Jon Paden's students built interactive artworks on a single theme — ethical dilemma — each one wired to NRP's LLM inference gateway and deployed on NRP GitLab Pages.
image: ~/assets/images/posts/art-class-on-nrp-opt2.png
category: Research
author: Jon Paden
tags:
  - education
  - digital-art
  - LLM
  - inference
  - gitlab
  - cloudflare
  - ucsd
---

When people picture the workloads running on the National Research Platform, they tend to picture climate models, genomics pipelines, or particle-physics jobs. They rarely picture a webcam staring back at a gallery visitor, scoring their personality from a single glance, and posting the verdict to Bluesky.

But that is exactly what a room full of undergraduate artworks did this spring. For the final project of **VIS 145B** at UC San Diego — a creative-coding and digital-art course taught by **Jon Paden** — students built interactive, browser-based pieces on a single shared theme: **ethical dilemma**. Almost every one of them ran its "intelligence" on NRP, calling the platform's large-language-model gateway for live inference and deploying the front end on NRP's GitLab Pages.

The class is about the ethics of digital art, and the brief pushed that question straight at the machine: what happens when you put an AI in the position of *judge* — of personality, of loyalty, of belief, of whether you deserve to keep your years of life — and then make a stranger live with the answer?

---

## The shape of the assignment

Paden framed the final around a now-classic distinction the students reference repeatedly in their own writing:

- **Type A dilemma** — both choices are morally defensible, but you can only pick one.
- **Type B dilemma** — both choices are uncomfortable, and there is no way to avoid all of them.

The constraint was not "use AI." It was "build a piece that puts a *person* inside a dilemma, in real time, in front of an audience." The AI was just the most efficient way to make the judgment feel authoritative — which is precisely the thing the course wanted students to interrogate.

The deliverables were correspondingly art-school, not CS-lab: an artwork title, a one-paragraph artist statement, process and performance documentation, and public links to a running app and a public repository with a README and credits.

---

## The NRP plumbing behind the art

This is the part that matters for the NRP audience, because it is a clean, repeatable pattern that any course — arts or sciences — can copy.

Paden gave the class two base repositories as starting points, both built to demonstrate how to get an LLM safely into a browser artwork running on NRP:

- 💻 [**`monkeytang/145b_aconci` (`FaceSwap` branch)**](https://gitlab.nrp-nautilus.io/monkeytang/145b_aconci/-/tree/FaceSwap) — *Advanced Face Swap with Cyberpunk Effects.* A pure-frontend p5.js + MediaPipe FaceMesh piece: 468-point face landmarks, blink-triggered face swapping from GIF frames, and a Max-Headroom-style glitch aesthetic. This was the front-end scaffolding the final built on.
- 💻 [**`monkeytang/145b_aivil`**](https://gitlab.nrp-nautilus.io/monkeytang/145b_aivil) — *Gorilla Date.* The base for the final assignment, and the one that documents the full integration: a Cloudflare Worker that proxies the browser to NRP's LLM gateway, handles CORS and token secrecy, keeps a shared conversation arc in Workers KV, and even reads a Discord channel so the audience's messages flow back into the model's context.

The integration pattern these encode:

1. **Inference runs on NRP.** Browser frames and prompts are sent to NRP's hosted-model endpoint (the Nautilus LLM / Envoy AI Gateway, `ellm.nrp-nautilus.io`), authenticated with an LLM token from a namespace — in this case Paden's `paden` namespace.
2. **A Cloudflare Worker sits in the middle.** A free-tier Worker holds the `NRP_TOKEN` as a secret, adds CORS headers, and forwards requests. The token never touches client-side code, and the browser never hits a cross-origin wall. The Worker URL is injected into the static site at build time via a GitLab CI variable (`VLM_PROXY_URL`).
3. **Model auto-discovery.** Rather than hard-coding a model name, the base Worker queries NRP's `/v1/models` on each call and picks the first available vision-capable model from a priority list (`gemma-small → gemma3 → qwen3-small → qwen3 → kimi → glm-4.5v`), caching the choice for a few minutes. When NRP rotates a model out, the piece self-heals instead of breaking mid-show.
4. **The front end ships on NRP GitLab Pages.** Each student forked into `gitlab.nrp-nautilus.io`, and the `.gitlab-ci.yml` deployed the static page to `*.pages.nrp-nautilus.io`.

:::note
The Gorilla Date base repo includes a full step-by-step Cloudflare + Discord setup guide and a health-check endpoint that reports whether every secret and binding is wired correctly. It is worth reading as a reference for *any* "static site that needs to call NRP inference without leaking a token" project.
:::

The result is that a non-systems audience — visual-arts undergraduates — shipped a dozen real-time, GPU-backed inference applications without ever touching a Kubernetes manifest. The hard parts (where the model runs, how it scales, how the token stays secret) were abstracted into a forkable template.

---

## The showcase

Twelve final pieces went up. The recurring move across them is to dress an arbitrary or unprovable judgment in the *aesthetics* of objectivity — clean dashboards, confidence intervals, formal "writs" — and then let the audience notice how readily they accept it. Almost all of them are deployed on NRP; one (the AI Therapist) is the lone exception, hosted elsewhere.

### Algorithmic authority — the machine as judge

**The Assessment** — *Chris McCurdy.* A webcam scores your Big Five (OCEAN) personality from a single photo, complete with confidence intervals and a clinical narrative, deliberately echoing real tools like HireVue's discontinued facial analysis. You can accept the evaluation or refuse it — but a running counter shows "of X people, Y refused," so even refusal is recorded.
[repo](https://gitlab.nrp-nautilus.io/Chris2929/vis-145b-final) · [app](https://vis-145b-final-b91c82.pages.nrp-nautilus.io/)

![The Assessment, tested from the command line: a single photo is POSTed to the Cloudflare Worker, which calls an NRP-hosted model and returns Big Five (OCEAN) scores with confidence intervals and a clinical narrative.](~/assets/images/posts/art-class-on-nrp-assessment.png)

**HireAI Corp™** — *Noah Gallardo.* A parody of automated hiring screeners. You enter name, age, gender, and ethnicity, "consent," and the system scores your eye contact, posture, and "culture fit," then files a cold assessment to a public Discord channel. There is no job. The asymmetry of consent — say yes and be judged publicly; say no and be safer than real applicants ever are — is the point.
[repo](https://gitlab.nrp-nautilus.io/NoahGallardo/145b_aivil/-/tree/final_project) · [app](https://145b-aivil-5091ce.pages.nrp-nautilus.io/)

![HireAI Corp™'s consent screen — the clinical, corporate framing that makes an automated "culture fit" judgment feel official before it files a verdict to a public Discord channel.](~/assets/images/posts/art-class-on-nrp-opt3.png)

**The Tribunal** — *Gabriel Gamez.* A live computer-vision installation that serves you a formal "Writ of Summons" and asks you to name three public figures you support. Each is judged in real time through a Kantian deontological lens; the figures' faces are pulled from Wikipedia and overlaid onto your own through live face tracking, then your pattern of support is profiled — and the verdict posted publicly to Bluesky. A pointed response to a political climate that demands unconditional allegiance.
[repo](https://gitlab.nrp-nautilus.io/gagamez/thetribunal) · [app](https://thetribunal-edbcf1.pages.nrp-nautilus.io/)

**Last Call** — *Athena Corpuz.* A camera watches a late-night diner. You photograph a scene, and the system extracts two genuinely valid but opposing moral obligations from it and asks the room to vote. Every five observations it pauses and reflects on what the room's choices reveal about the people watching — the machine watches the scene, the audience watches the machine, and everyone becomes a subject of analysis.
[repo](https://gitlab.nrp-nautilus.io/atcorpuz/acorpuz_vis145b_final) · [app](https://acorpuz-vis145b-final-26cef2.pages.nrp-nautilus.io/)

**Life expectancy** — *Emily Castro.* Your face is scanned and given a number of years remaining. Then a stranger is pulled from a database and their life is placed in your hands: extend your own expectancy at the cost of theirs. Either choice — accept a shorter life, or harm another to benefit yourself — is published to Discord and Bluesky with your name attached.
[repo](https://gitlab.nrp-nautilus.io/yeomil/145b_aivil/-/tree/main) · [app](https://145b-aivil-b1da89.pages.nrp-nautilus.io/)

**AI Therapist** — *Tyler Fairbanks.* An Eliza-style "therapist" that pointedly does *not* empathize — it degrades you for your feelings regardless of what they are — as an argument about what AI cannot do that humans can. *(The one piece not hosted on NRP.)*
[app](https://ai-therapist-2a2h.onrender.com/)

### Consent, surveillance, and belief

**Terms and Conditions** — *Elyssa Lee.* You enter your name, face a wall of legal text, get ten seconds, and "accept" by raising your hand. The screen then shows you one thing you just agreed to — already posted to Bluesky under your name. Every clause is modeled on language billions of people have already accepted unread.
[repo](https://gitlab.nrp-nautilus.io/elyssamlee/145b_aconci/-/tree/Assignment2PB) · [app](https://145b-aconci-58ce82.pages.nrp-nautilus.io/)

**Watchful** — *Astrid Liong.* A "community safety" platform whose every feature — observation forms, severity tags, trust scores, a surveillance index — exists in real products today. It puts you inside the logic that builds surveillance tools, choice by choice and report by report, until the reflection is unavoidable.
[repo](https://gitlab.nrp-nautilus.io/aliong/watchful) · [app](https://watchful-8b6a75.pages.nrp-nautilus.io/)

**The Congregation** — *Meena Kolli.* A piece about dogmatism and the bending of truth. Participants answer questions about belief; agreeing with another person's answer makes it glow brighter and more visible, disagreeing dims it into illegibility. Meanwhile the LLM rewrites each answer into something "more positive" before posting it to Bluesky — obscuring the original truth, the way reframing language reframes belief.
[repo](https://gitlab.nrp-nautilus.io/mekolli/religion/-/tree/main) · [app](https://religion-abf729.pages.nrp-nautilus.io/)

![The Congregation — answers glow brighter as others agree and dim into illegibility as they disagree, a wall of belief rendered as light and fire.](~/assets/images/posts/art-class-on-nrp-opt5.png)

**Insta Copyright Judge** — *Hallie Chan.* For small artists growing an Instagram art account: enter a fan-art theme and the AI predicts your odds of a copyright strike, searches the web for the relevant company's actual policy, *and* predicts the follower/like payoff — forcing the Type B choice between recognition and legal risk, with a public counter of who took the gamble.
[repo](https://gitlab.nrp-nautilus.io/hfchan/discord-ethics-judge) · [app](https://discordethics.hfchan.workers.dev/)

![Insta Copyright Judge — a neon scanner UI weighs a fan-art idea's odds of a copyright strike against its predicted follower payoff, dressing a Type B choice in arcade aesthetics.](~/assets/images/posts/art-class-on-nrp-opt4.png)

### Moral-choice games

**Ethical Dilemma Game** — *Lucian Woo.* A choice-driven game with no right answers, backed by a Cloudflare D1 database so vote patterns accumulate across all players. Each choice is tagged with a trait (compassion, boundaries, directness, caution) and the NRP-hosted LLM offers a deliberately *neutral*, non-judgmental one-sentence reflection — a direct reaction against the author's earlier "moral judge" project. (Notably, Woo chose the Canvas API over image generation, citing the environmental and ethical cost of generating a fresh image every play.)
[repo](https://gitlab.nrp-nautilus.io/lhwoo/lucian-145-b-a-ivil) · [app](https://lucian-145-b-a-ivil-aa76ad.pages.nrp-nautilus.io/)

![Ethical Dilemma Game's title screen — a stark, pixel-font statement of the whole assignment's premise: "There are no right answers. Only choices."](~/assets/images/posts/art-class-on-nrp-opt2.png)

**Honesty vs Friend** — *Yue Deng.* Five everyday student-life scenarios pit honesty against loyalty, with a real-time "Moral Pressure Meter" and a running record of your choices. The artist statement doubles as an honest account of human–AI collaboration: hand-drawn art extended with AI assistance, AI-assisted code and CI/CD — but the ethical and artistic decisions kept firmly with the author.
[repo](https://gitlab.nrp-nautilus.io/Yuemiao/honesty-vs-friend) · [app](https://honesty-vs-friend-301fc4.pages.nrp-nautilus.io/)

![Honesty vs Friend — warm, hand-drawn student art (extended with AI assistance, by the artist's own account) frames five everyday scenarios that pit honesty against loyalty.](~/assets/images/posts/art-class-on-nrp-opt1.png)

:::note
Student demos come and go as deployments and tokens cycle — some live links above may be intermittent. The public GitLab repositories on `gitlab.nrp-nautilus.io` are the durable record of the work.
:::

---

## Why this matters for NRP

It is easy to justify research cyberinfrastructure with research workloads. This class is a reminder of the other half of the mission: **teaching**. A visual-arts course at UCSD used NRP exactly the way a systems course or a genomics lab would — hosted LLM inference, namespaced tokens, GitLab CI, and Pages — and the students never had to become infrastructure engineers to do it. The base repos turned "call a GPU-backed model from a webpage, safely" into a fork-and-go template.

It is also a genuinely interesting demonstration of the platform's LLM gateway under real, bursty, interactive load: a dozen independent vision-and-language apps, hitting live models during a public show, with auto-discovery papering over model rotation. That is a different stress profile than a batch inference job, and it held up.

Mostly, though, it is a good answer to "what is the LLM gateway *for*?" Here it was for asking a room full of people whether they would trade a stranger's years for their own, and watching what they actually chose.

---

*Course: VIS 145B, Department of Visual Arts, UC San Diego, Spring 2026. Instructor: Jon Paden. Base repositories and student projects hosted on [`gitlab.nrp-nautilus.io`](https://gitlab.nrp-nautilus.io); LLM inference via the NRP Nautilus LLM gateway.*
