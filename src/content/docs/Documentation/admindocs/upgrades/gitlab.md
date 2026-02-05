---
title: GitLab
description: GitLab
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




#### Upgrading GitLab

Follow the [upgrade doc](https://docs.gitlab.com/ee/update/#upgrade-paths) ([upgrade paths](https://docs.gitlab.com/update/upgrade_paths/)).

Starting from v15 GitLab deprecates the Kubernetes connection currently used, and uses the agents. [Agents aren't supported in sameersbn's build](https://github.com/sameersbn/docker-gitlab/issues/2736) and we're using the [deprecated feature gate](https://github.com/sameersbn/docker-gitlab/issues/2494#issuecomment-1324484189)

Also need to upgrade the registry - pick the right version for GitLab deployed from [their repo](https://gitlab.com/gitlab-org/omnibus-gitlab/-/blob/16.10.2+ce.0/config/software/registry.rb?ref_type=tags) and check the registry version in that file.
