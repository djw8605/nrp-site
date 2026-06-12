---
publishDate: 2026-05-14T00:00:00Z
title: DOE American Science Cloud experiments with NRP — ESnet tutorial at 7NRP
excerpt: A recap of the DOE American Science Cloud (AmSC) tutorial that ESnet ran at the 7NRP workshop, covering the Genesis Mission context, the AmSC platform, and hands-on IRI Facility API work using NRP's training JupyterHub.
image: ~/assets/images/posts/amsc-7nrp-thumb.png
category: Events
tags:
  - conference
  - DOE
  - AmSC
  - IRI
  - ESnet
---

On **Tuesday, May 5, 2026**, the final Track A session of [7NRP](https://na.eventscloud.com/website/91919/) Tutorial Day was *"DoE American Science Cloud Experiments with NRP,"* presented by **Justas Balcas** and **Xi Yang** (Pilots & Prototypes group, Energy Sciences Network / Berkeley Lab) in the SDSC Auditorium from 3:30 – 5:00 PM. The session walked the room through the design of the U.S. Department of Energy's emerging **American Science Cloud (AmSC)** and explored what it would take to extend the AmSC stack to a heterogeneous, mixed-mode (partially dual-stack), multi-tenant Kubernetes cluster like NRP, then put attendees on a JupyterHub to exercise the DOE **Integrated Research Infrastructure (IRI)** facility APIs directly.

![Justas Balcas and Xi Yang opening the AmSC tutorial in the SDSC Auditorium](~/assets/images/posts/amsc-7nrp-pic2.jpg)

**Materials**
- 🖼️ [`DoE-American-Science-Cloud.pdf`](https://github.com/nrp-nautilus/7nrp/blob/main/5_doe_american_science_cloud/DoE-American-Science-Cloud.pdf) — slide deck (presented live)
- 💻 [**doe-iri/iri-facility-api-examples**](https://github.com/doe-iri/iri-facility-api-examples) — companion code repository with the hands-on IRI facility-API clients and notebooks
- 📋 [Tutorial Day session folder](https://github.com/nrp-nautilus/7nrp/tree/main/5_doe_american_science_cloud) on the [7NRP repo](https://github.com/nrp-nautilus/7nrp)
- 🗓️ [Full 7NRP agenda](https://na.eventscloud.com/website/91919/agenda/)

---

## Why AmSC, and why explore extending it to clusters like NRP

The talk opened with the policy context. On **November 24, 2025**, a White House Executive Order launched the **Genesis Mission** — *"a national initiative to build the world's most powerful scientific platform through AI"* — with the explicit goal of doubling the productivity and impact of American research within a decade.

**The American Science Cloud is the key building block of the Genesis Mission platform.** Its charter is to deliver a seamless integration of DOE science instruments, computing, experimental facilities, and networking — together with AI, data, modeling, and simulation software — through a single advanced programming interface, **the AmSC API**. The pitch to scientists is concrete: unified APIs for data/model/workflow access, a federated VO-style identity model, interoperability between DOE facilities and commercial cloud service providers, and an explicit target of cutting *time to insight* from months to days through composable, AI-driven workflows.

AmSC's **Minimum Viable Product** is scheduled for delivery in 12 months (by **9/30/2026**), with a clean four-quarter ramp: Federated Access Foundation (VO + IRI integration) at 3 months, Science Team Onboarding (API Gateway + Data Catalog + Workflow) at 6 months, Intelligent Workflow (agentic workflow + AmSC API v1 + IRI orchestration) at 9 months, and the full MVP release (ASCR/CSP link, unified discovery) at 12 months.

NRP could directly connect to AmSC. AmSC's Infrastructure Partners (IPs) include ASCR HPC (OLCF/Frontier, NERSC/Perlmutter, ALCF/Aurora, HPDF), ASCR Networking (ESnet), PNNL, Office of Science labs, applied energy labs, and commercial CSPs — and potentially the NRP, which could plug into AmSC as an IP through the same common abstraction layer everything else uses: the IRI-API (DOE Integrated Research Infrastructure API).

## AmSC architecture in one paragraph

Justas and Xi framed AmSC as a control plane / data plane split: a **Control Plane** ("the Brains") for orchestration, identity management and API routing; **Facilities** ("the Muscle") for heavy computation and petascale data movement; and a **Data Plane** of high-speed science data routes (e.g. ESnet L3VPN). The whole stack is operated with a GitOps philosophy (ArgoCD for versioned infra/app config) and zero-trust identity (PingGIC issuing short-lived JWTs into both an MVP "Open Enclave" at FISMA Low and a future "Secure Enclave" at FISMA Moderate). The platform surfaces six core infrastructure services — Container Platforms, Storage Interfaces, Secure Enclaves, Job Scheduling, **Resource Orchestration**, and **WAN Data Fabric** — with the last two being the ones AmSC contributes most directly on top of partner facilities.

Every service AmSC ships carries an explicit **Service Readiness** label (Concept → Sandbox → Incubator → Candidate → Graduated → Archived) with associated user-access, API-stability and SLA promises. Everything demoed at 7NRP is in the **Incubator** stage — the room was invited to test the services as AmSC beta users and send feedback.

## IRI Facility API v1 — what's actually shipping

The hands-on portion centered on the **IRI Facility API**, the common interface every AmSC infrastructure partner implements. Version 1 covers six resource families:

- **Facility** — facility, site, location, resource
- **Status** — incident, event, resource
- **Allocation** — project, user/project allocation, allocation entry, capability, resource
- **Compute** — job, resource (PSI/J-style submit / live status / delete-cancel, with backends for SLURM, PBS, Kube Kueue, HTCondor)
- **Filesystem** — file, path, resource (asynchronous local ops — chmod/chown/stat/ls/mkdir/cp/mv/compress/extract/download/upload — complementary to transfer frameworks)
- **Identity & Auth** — VO-issued tokens routed through the AmSC reverse proxy and the GM Single Sign-On (Ping GIC) federated identity hub

A periodic **Full Site Validation** runs the same operationId checklist against every facility — DemoAdapter, NERSC, ALCF, ESnet West, ESnet East are already operational; ORNL, PNNL, SLAC and BNL are work-in-progress. The latest validation report is published at [doe-iri/iri-facility-api-docs · verification/test_results/latest/full-report.md](https://github.com/doe-iri/iri-facility-api-docs/blob/main/verification/test_results/latest/full-report.md).

The roadmap to **v2** extends the static resource model (DTN endpoints, networking connectivity, CUI-aware capabilities, facility topology with DTN↔storage↔compute connectivity modeling) and brings the IRI API into agentic workflows — a "chat with IRI endpoints" prototype that lets a model submit and monitor jobs across facilities via natural language was shown live.

## Hands-on environment

The session ran on the same JupyterHub the rest of Track A used: [training.nrp-nautilus.io](https://training.nrp-nautilus.io/). From a JupyterLab terminal:

```bash
git clone https://github.com/doe-iri/iri-facility-api-examples
cd iri-facility-api-examples
```

Three notebooks, in order:

1. `Login-nrp.ipynb` — issue your own credentials
2. `Compute-jobs.ipynb` — submit a compute job against an IRI-API-backed facility
3. `Filesystem.ipynb` — local filesystem operations through the API

> ⚠️ **The training JupyterHub is provisioned specifically for 7NRP and was spun down after the workshop concluded on Thursday, May 7, 2026.** The notebooks and the slide deck remain available indefinitely. If you'd like to re-run these examples after the workshop — at your home institution, in a class, or for your own research — [contact us on Nautilus Support](https://nrp.ai/contact/) and we'll help you reproduce the environment on persistent NRP infrastructure, or point you to ESnet's IRI testbed directly.

![Justas and Xi closing the session on the AmSC summary slide — links to docs, API reference, examples and spec](~/assets/images/posts/amsc-7nrp-pic1.jpg)

## See also

- [DOE Integrated Research Infrastructure (IRI) — blueprint for the future](https://www.energy.gov/science/articles/integrated-research-infrastructure-blueprint-future)
- [ESnet](https://es.net/)
- [Berkeley Lab](https://www.lbl.gov/)
- The [other 7NRP Tutorial Day sessions](https://github.com/nrp-nautilus/7nrp)
