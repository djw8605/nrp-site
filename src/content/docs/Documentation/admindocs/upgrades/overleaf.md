---
title: Overleaf
description: Description
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::

#### Upgrading Overleaf

First, find the latest version of the Overleaf Docker image from https://hub.docker.com/r/sharelatex/sharelatex/tags. Take note of the minor version number (e.g. "X.Y") you wish to upgrade to.

Then, go to https://gitlab.nrp-nautilus.io/nrp/overleaf/-/blob/main/Dockerfile and edit `ARG OVERLEAF_VERSION=` to the minor version you intend to upgrade to.

After pushing the changes, the CI/CD pipeline will build and push the image.

While the image builds, read the [Release Notes](https://github.com/overleaf/overleaf/wiki) for any changes that require manual migrations or upgrades. You may need to upgrade [MongoDB](https://docs.overleaf.com/on-premises/maintenance/updating-mongodb) or Redis as well per instructions of the release notes. Take note of all related information.

After the image build finishes, update the `overleaf` Deployment in the `overleaf` namespace, and make necessary changes to the YAML configuration file, restarting the pod.

Note that the Overleaf Toolkit is not supported in Kubernetes, so we need to manually maintain the Kubernetes Deployment based on the [`docker-compose.yaml`](https://github.com/overleaf/overleaf/blob/main/docker-compose.yml) configuration that Overleaf provides.
