---
title: Upgrades Introduction
description: Introduction to cluster upgrades
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::

**List of services that can be upgraded just by changing the container image version (parentheses contain the namespaces):** Synapse/Matrix (matrix-synapse, requires manual DB update), Element (matrix-synapse)

**List of services that are automatically upgraded in restarts (parentheses contain the namespaces):** SuperSplat (supersplat), WebODM (webodm), EtherPad (etherpad, requires manual PostgreSQL update), BentoPDF (bentopdf), Jitsi (jitsi), Draw.io (drawio), Yopass (yopass), HedgeDoc (hedgedoc), LanguageTool (nextcloud), Collabora (nextcloud)

Great server to keep track of expiring versions: [https://endoflife.date](https://endoflife.date)
