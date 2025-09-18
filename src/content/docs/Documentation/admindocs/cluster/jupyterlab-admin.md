---
title: JupyterLab Admin
description: JupyterLab administration guide.
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::





## Adding a User to JupyterLab

To grant access to the [JupyterLab](https://jupyterhub-west.nrp-nautilus.io) service, first verify the user's email address used for CILogon.

Add the email to the `allowed_users:` section in the [configuration template](https://gitlab.nrp-nautilus.io/prp/jupyterlab-west/-/blob/master/values.template.yaml) and commit the change.
