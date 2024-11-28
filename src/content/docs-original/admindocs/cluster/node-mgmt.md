# Cluster node Management

### General things to look at when rebooting a node

1. Does the node have any `rook-ceph-osd-*` pods? Check the corresponging ceph cluster for health, [make sure you bring down one node of *that cluster* at a time](#special-instruction-to-reboot-ceph-nodes)
1. Does the node have any `haproxy-ingress-*` pods? If node is coming down for a long time, disable the record in [Constellix DNS](https://dns.constellix.com/).
2. Does the node have the `nautilus.io/linstor-server` label? This node is the linstor server. Some are redundant, some are not.
3. Does the node have `nautilus.io/bgp-speaker` label? There are 2 nodes in the cluster used for MetalLB IPs, keep one of those alive.
4. Does the node have `node-role.kubernetes.io/master` label and is not admiralty virtual node? Rebooting this node will make the cluster not accessible.

## Prerequisites

1. [Install Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
on a local computer.

2. Clone the repo of ansible playbooks:

    ```
    git clone https://gitlab.nrp-nautilus.io/prp/nautilus-ansible.git
    ```

3. Pull the latest updates from the playbook repo:

    ```
      cd nautilus-ansible;
      git pull
    ```

## Reboot a node due to GPU failure

```
ansible-playbook reboot.yaml -i nautilus-ansible/nautilus-hosts.yaml -l <nodename>
```

### Special instruction to reboot Ceph nodes

If multiple nodes within a Ceph cluster need to be rebooted, in order to maintain enough OSDs for redundancy, only one node is allowed to be rebooted at a time.

Run this command to enter rook-ceph-tools pod shell, where <namespace> is the namespace of the corresponding Ceph cluster (one of `rook`, `rook-east`, `rook-pacific`, `rook-haosu`, `rook-suncave`):

```
kubectl exec -it -n <namespace> $(kubectl get pods -n <namespace> --selector=app=rook-ceph-tools --output=jsonpath={.items..metadata.name}) -- bash
```

In the pod shell, run
```
watch ceph health detail
```

Wait until `[WRN] OSD_DOWN: 1 osds down` to disappear from the `ceph health detail` output to reboot the next node.
