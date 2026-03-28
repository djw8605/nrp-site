---
title: GitLab Runners
description: A Cluster Admin Guide Running Gitlab CI/CD Runners
---

# Restore GitLab Runner KubeVirt VMs (docker:dind, docker tag)

Minimal guide for the production GitLab runners: **docker** executor, **docker:dind** image, **docker** tag. The docker-tagged runners are KubeVirt VMs not Kubernetes Pods. The configuration for each VM is in a secret in the namespace. Duplicate and get a new runner token from Gitlab for new secret. Duplicate runner DataVolume before applying VM.

### Running a Runner VM

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: runner2
  namespace: gitlab
spec:
  runStrategy: Always
  dataVolumeTemplates:
  - metadata:
      name: runner2-root
    spec:
      source:
        http:
          url: https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img
      pvc:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 20Gi
        storageClassName: rook-ceph-block
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
                - key: topology.kubernetes.io/zone
                  operator: In
                  values:
                  - ucsd
                  - ucsd-nrp
                  - ucsd-sdsc
      accessCredentials:
      - sshPublicKey:
          propagationMethod:
            configDrive: {}
          source:
            secret:
              secretName: runners-pub-keys
      architecture: amd64
      domain:
        cpu:
          cores: 12
        devices:
          autoattachGraphicsDevice: true
          autoattachSerialConsole: true
          disks:
          - disk:
              bus: virtio
            name: harddrive
          - disk:
              bus: virtio
            name: rootdisk
            bootOrder: 1
          - disk:
              bus: virtio
            name: cloudinit
        machine:
          type: q35
        resources:
          limits:
            memory: 48Gi
            cpu: 12
          requests:
            memory: 48Gi
            cpu: 12
      volumes:
      - dataVolume:
          name: runner2-root
        name: rootdisk
      - emptyDisk:
          capacity: 300Gi
        name: harddrive
      - cloudInitConfigDrive:
          secretRef:
            name: runner2-userdata
        name: cloudinit
```

---

## Verify

```bash
virtctl ssh ubuntu@runner1 -n gitlab -- sudo gitlab-runner status
virtctl ssh ubuntu@runner2 -n gitlab -- sudo gitlab-runner status
# Both: executor=docker, image=docker:dind, tag_list=["docker"], S3 cache in config.toml
```

SSH (after `ssh-add` your key or use password): `virtctl ssh ubuntu@runner1 -n gitlab` / `virtctl ssh ubuntu@runner2 -n gitlab`.
