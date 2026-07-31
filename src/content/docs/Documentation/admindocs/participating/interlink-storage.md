---
title: Ceph S3 for InterLink Jobs
description: Move data between NRP and remote Slurm jobs with Ceph S3
---

Kubernetes block PVCs do not mount on remote Slurm nodes. Use NRP Ceph S3 to move data between Kubernetes and the participating site.

```text
NRP -> Ceph S3 -> Slurm job -> Ceph S3 -> NRP
```

## 1. Create a private bucket

Visit [nrp.ai/s3](https://nrp.ai/s3) and create an app key named `interlink`. Use the access key and one-time secret emailed for this app key when configuring InterLink.

Do not use your main key. The main key is the parent credential with full access to your buckets; the `interlink` app key can be revoked independently without replacing your main key.

Follow the [Ceph S3 instructions](/documentation/userdocs/storage/ceph-s3/) to create a private bucket.

Use the outside HTTPS endpoint from Slurm compute nodes:

```text
https://s3-west.nrp-nautilus.io
```

Do not use a `rook-ceph-rgw-*.rook` endpoint. Those names resolve only inside Nautilus.

## 2. Create a Kubernetes Secret

```bash
kubectl create secret generic interlink-s3 \
  --namespace <namespace> \
  --from-literal=access-key='<access-key>' \
  --from-literal=secret-key='<secret-key>' \
  --from-literal=endpoint='https://s3-west.nrp-nautilus.io'
```

Do not store these values in an image, pod annotation, or Git repository.

## 3. Use the bucket from an InterLink job

The workload image must include the AWS CLI or another S3-compatible client. The following command downloads an input, runs the application, and uploads its result:

```yaml
command: ["/bin/bash", "-lc"]
args:
  - |
    set -euo pipefail
    work="${TMPDIR:-/tmp}/interlink-job"
    mkdir -p "$work"

    aws --endpoint-url "$S3_ENDPOINT" \
      s3 cp "s3://<bucket>/input/input.dat" "$work/input.dat"

    ./run-application "$work/input.dat" > "$work/result.dat"

    aws --endpoint-url "$S3_ENDPOINT" \
      s3 cp "$work/result.dat" \
      "s3://<bucket>/output/${HOSTNAME}/result.dat"
env:
  - name: AWS_ACCESS_KEY_ID
    valueFrom:
      secretKeyRef:
        name: interlink-s3
        key: access-key
  - name: AWS_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: interlink-s3
        key: secret-key
  - name: S3_ENDPOINT
    valueFrom:
      secretKeyRef:
        name: interlink-s3
        key: endpoint
```

`ExportPodData` must be enabled in the Kubernetes and site plugin configurations. Upload results before the process exits because Slurm scratch can be removed after completion, cancellation, failure, or preemption.

For large datasets, use the `rclone` or `s3cmd` configuration in the [Ceph S3 instructions](/documentation/userdocs/storage/ceph-s3/). If an application requires a POSIX filesystem, use storage already mounted on the site's Slurm compute nodes.
