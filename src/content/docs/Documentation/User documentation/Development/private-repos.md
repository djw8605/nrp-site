---
title: Private Repo
---

Follow these steps to provide access to container images stored in the **private** [:fontawesome-brands-gitlab:Nautilus GitLab][1] repository.

1. Go to your repository  **Settings->Repository->Deploy Tokens**, and [create a deploy token][3] with **read_registry** flag enabled. 
1. Follow the instructions for [pulling image from private registry][2]. Your registry server __your-registry-server__
   will be  PRP's default docker images registry FQDN, identifies as one of 
   <br>&nbsp;&nbsp;&nbsp;&nbsp;**gitlab-registry.nrp-nautilus.io**
   <br>&nbsp;&nbsp;&nbsp;&nbsp;**gitlab-registry.nrp-nautilus.io/USERNAME/REPONAME**
   <br>where USERNAME is your Gitlab user name and REPONAME is your repository.
   <br><code>kubectl create -n somenamespace secret docker-registry regcred --docker-server=gitlab-registry.nrp-nautilus.io/somegroup/somerepo --docker-username=gitlab+deploy-token-XXX --docker-password=XXXXXXXXXXXX</code>

[1]: https://gitlab.nrp-nautilus.io

[2]: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/#create-a-secret-in-the-cluster-that-holds-your-authorization-token

[3]: https://docs.gitlab.com/ce/user/project/deploy_tokens/
