---
title: Networking
description: Network requirements
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




Our cluster contains several hundreds of nodes around the world, and to make a cluster out of these we place certain connectivity requirements to join a node.

The nodes are mostly connected to a Science DMZ with 10G-100G speeds. To utilize this speed, they should support jumbo frames (9000 MTU) to all other nodes in the cluster. 
Also, the NRP usually requires the nodes to be on a Science DMZ, outside of traditional firewalls, IDS, and ACLs that significantly lower connection speed and also add restrictions that can make a node unusable to the NRP. See [ESNet architecture documents](https://fasterdata.es.net/science-dmz/science-dmz-architecture/)

Kubernetes is building a virtual (overlay) network on top of physical network, which makes all nodes see each other directly via established VXLAN tunnels. Also many services are using ports on nodes. Because we have so many locations, we can't work with each campus to handle the network policy for us. Instead, we ask the local admins to open the node completely to the world, and use the cluster-wide Network Policies provided by Calico network plugin to handle the firewall.

The nodes are expected to have access to both ScienceDMZ and public Internet (could be at a slower speed) to pull container images from docker hub and google container image repository.

## Calico Network Policies

[Calico](https://docs.projectcalico.org) is the network plugin we use for Kubernetes. It provides the [GlobalNetworkPolicy](https://docs.projectcalico.org/reference/resources/globalnetworkpolicy) resource to [manage the preNAT network policy on hosts](https://docs.projectcalico.org/security/calico-network-policy) in a way that allows us to protect the hosts from the world, while still allowing all needed connectivity between the hosts. With some exceptions, hosts will have a few ports and ICMP open to the world, and only allow full connectivity between the cluster hosts defined by our [networkset](https://gitlab.nrp-nautilus.io/prp/calico/-/blob/master/networksets.yaml). Because the cluster is constantly changing, it's not possible to manage the local university policies by sending emails to each admin, and central management is the only way that works.

You can review the [current policy applied to the cluster](https://gitlab.nrp-nautilus.io/prp/calico/-/blob/master/policy_new.yaml). It adds the IPTables rules to the nodes to filter the incoming traffic in additional to multiple other rules that Kubernetes uses to route packets between hosts. This is often incompatible with manual iptables rules or firewalld enabled on the node, and because of that we ask you to turn those off.
