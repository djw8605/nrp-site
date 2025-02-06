---
title: Install
description: Install
---


!!! note 
    These instructions are for nodes that we will not be joining the NRP by giving IPMI access to NRP admins.  If you are giving IPMI access to NRP admins, please contact NRP admins with details.

## To install or reinstall a new node:

1. If node is in the cluster already, first [make sure the node is not a part of ceph or is a gateway (metallb, ingress, etc)](/admindocs/cluster/node-mgmt/#general-things-to-look-at-when-rebooting-a-node). Ceph nodes can only be taken out one at a time, allowing time to recover after being brought back.

1. Find the network settings: IP, subnet, gateway, DNS (if not google/cloudflare)

1. Note the current disks setup - whether the node has similar OS drives for md RAID

1. Drain the node

1. Login to the node's IPMI screen

1. Attach the ubuntu 22.04 image via the virtual media

1. Reboot the node

1. Trigger the boot menu (usually F10), choose to boot from virtual media

1. Start the install [with media check off](https://askubuntu.com/questions/1313247/disable-integrity-check-on-ubuntu-server-20-04-1-iso)

1. Agree to everything it asks

1. Set up the network:
    
    1. DNS can be 1.1.1.1,8.8.8.8

    1. Disable unused networks

    1. Can use the [subnet calculator](https://www.tunnelsup.com/subnet-calculator) to figure out the subnet

1. For disk: if node has OS drive mirror, use custom layout:
  
    1. Delete all existing md arrays

    2. Click the drives you're going to use, choose reformat

    3. Add **unformatted** GPT partitions to the drives

    4. Create md array with those partitions

    5. For 2nd disk choose "Add as another boot device"

    6. Create `ext4` GPT partition on created MD array

    7. Proceed with installation

1. For username choose `nautilus`

1. Choose to install SSH server, optionally import key from github

1. Don't install any additional packages

1. In the end disconnect media, reboot

1. After the node boots, make the `nautilus` user sudoer with NOPASSWD:

    1. `sudo visudo`, `%sudo   ALL=(ALL:ALL) NOPASSWD:ALL`

    1. Add `mtu: 9000` to `/etc/netplan/00-installer-config.yaml`, exec `netplan apply`.  The `mtu` is under the ethernets device.


## Steps for NRP Administrators

The below steps are meant for NRP administrators, and do not need to be performed by site system administrators.

1. Make changes in ansible inventory file:

    1. Remove `runtime: docker` (containerd is default)

    1. Add:
        
            ansible_user: nautilus
            ansible_become: true

    1. Add up `lv_devices` and `containers_lv_size` if needed

1. If the node was previously installed with centos, delete the k8s VG: `vgremove k8s`, yes to all

1. Generate a `join_token` by logging into the controller and running:

        $ kubeadm token create

1. Run the [ansible playbook](https://gitlab.nrp-nautilus.io/prp/nautilus-ansible) according to docs:

        ansible-playbook setup.yml -l <node> -e join_token=...

## Labels done by cluster admins:

Check that proper labels were added by ansible:

```
host-endpoint: "true"
mtu: "9000"
```

Add the following labels:

`nautilus.io/network: "10000"` - network speed (10000/40000/100000) (needed for perfsonar maddash)

`netbox.io/site: UNL` - SLUG for netbox site (should exist)

`topology.kubernetes.io/region: us-central` - region (us-west, us-east, etc)

`topology.kubernetes.io/zone: unl` - zone

To set all labels run:

```bash
kubectl label node node_name nautilus.io/network="10000" netbox.io/site="UNL" topology.kubernetes.io/region="us-central" topology.kubernetes.io/zone="unl"
```

NOTE: `netbox/netbox-agent-*` pods are using the node topology labels on start and are NOT watching the changes. If labels were changed or added, these pods need restart to work properly.

## Cluster firewall

The node's CIRD should be in https://gitlab.nrp-nautilus.io/prp/calico/-/blob/master/networksets.yaml list for the node to be accessible by other cluster nodes