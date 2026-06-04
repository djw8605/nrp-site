---
title: Upgrades Introduction
description: Introduction to cluster upgrades
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::

**Make sure to update `src\pages\services-status.astro` and the `nautilus-config` ConfigMap in the `kube-system` namespace as well for [Services Status](/services-status/), if applicable.**

**Instructions for other cluster or service upgrades can be found in relevant individual pages. They likely require additional procedures.**

**List of services that can be upgraded just by changing the container image version (namespaces within parentheses):** Synapse (matrix-synapse, requires manual DB update), Element (matrix-synapse), Plausible Analytics (monitoring)

**List of services that are automatically upgraded in restarts (namespaces within parentheses):** SuperSplat (supersplat), WebODM (webodm), EtherPad (etherpad, requires manual PostgreSQL update), BentoPDF (bentopdf), Jitsi (jitsi), Draw.io (drawio), Yopass (yopass), HedgeDoc (hedgedoc), LanguageTool (nextcloud), Collabora (nextcloud)

Great server to keep track of expiring versions: [https://endoflife.date](https://endoflife.date)
