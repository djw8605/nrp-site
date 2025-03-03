---
title: JupyterLab Access Management
description: Guide for managing user access to the JupyterLab service.
---


## Adding a User to JupyterLab

To grant access to the [JupyterLab](https://jupyterhub-west.nrp-nautilus.io) service, first verify the user's email address used for CILogon. It should match the record in the [user portal](https://portal.nrp-nautilus.io/users).

Add the email to the `allowed_users:` section in the [configuration template](https://gitlab.nrp-nautilus.io/prp/jupyterlab-west/-/blob/master/values.template.yaml) and commit the change.
