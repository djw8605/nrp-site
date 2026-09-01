---
title: Private Repos
description: "Let pods pull container images from the private GitLab registry in your group or project."
---

Follow these steps to provide access to container images stored in the **private** [Nautilus GitLab](https://gitlab.nrp-nautilus.io) repository.

1. Go to your repository **Settings->Repository->Deploy Tokens**, and [create a deploy token][3] with **read_registry** flag enabled.

1. Follow the instructions for [pulling image from private registry][2]. Your registry server **your-registry-server**
   will be NRP's default docker images registry FQDN, identifies as one of
   - **gitlab-registry.nrp-nautilus.io**
   - **gitlab-registry.nrp-nautilus.io/USERNAME/REPONAME**

   where **USERNAME** is your Gitlab user name and **REPONAME** is your repository.

   ```bash
   kubectl create -n somenamespace secret docker-registry regcred --docker-server=gitlab-registry.nrp-nautilus.io/somegroup/somerepo --docker-username=gitlab+deploy-token-XXX --docker-password=XXXXXXXXXXXX
   ```

[2]: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/#create-a-secret-in-the-cluster-that-holds-your-authorization-token
[3]: https://docs.gitlab.com/ce/user/project/deploy_tokens/
