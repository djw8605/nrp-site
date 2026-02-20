---
title: Kubernetes Upgrades
description: Kubernetes upgrade procedures
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::


#### Kubernetes upgrades

Check the [versions skew policy](https://kubernetes.io/releases/version-skew-policy/)

Also a good reading on [how to find the changes and how to upgrade](https://www.tauceti.blog/posts/kubernetes-upgrade-notes-1.32-1.33)

1. Scale down admiralty deployments and delete all virtual nodes - those prevent the upgrades
2. Follow the [upgrade guide](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/) for master.
   1. During the upgrade it's better to pre-pull the new images with `kubeadm config images pull`
3. If those were made and not in config, bring back all custom changes to controller-manager in /etc/kubernetes/manifests.

   Controller-manager: `- --allocate-node-cidrs=false`
   
4. Do the last step in the upgrade manual to restart the control plane again.

5. Do the same steps for every master node. You might want to do the main keepalived node (the one users are connecting to, it has the HA IP) the last, and switch the VIP to a different node before upgrading. To do it, modify the `/etc/keepalived/keepalived.conf` file: set `priority 99` on the current node with `priority 100`, and make another upgraded node `priority 100`. Then restart keepalived on both - the IP will switch to the new node.

-- Breathe out! The master upgrade is done. --

1. Do rolling upgrade of compute nodes using ansible upgrade playbook.
2. Upgrade the kubernetes version in the [portal dependencies libraries](https://gitlab.nrp-nautilus.io/prp/k8s_portal/-/blob/master/go.mod)
