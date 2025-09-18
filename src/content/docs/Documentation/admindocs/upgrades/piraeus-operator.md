---
title: Linstor
description: Linstor
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




Official way:

`kubectl apply -k "https://github.com/piraeusdatastore/piraeus-operator//config/default?ref=v2.9.0"`

NRP way:

* Get all manifests in the local file

`kustomize build "https://github.com/piraeusdatastore/piraeus-operator//config/default?ref=v2.9.0" > piraeus-2.9.0.yaml`

Fix operator mem and CPU limits:

```diff
--- /var/folders/b2/hgd_skcd7fxd1mvvsb2jq2cr0000gn/T/LIVE-408301260/apps.v1.Deployment.piraeus-datastore.piraeus-operator-controller-manager    2024-04-16 10:00:28
+++ /var/folders/b2/hgd_skcd7fxd1mvvsb2jq2cr0000gn/T/MERGED-3149965176/apps.v1.Deployment.piraeus-datastore.piraeus-operator-controller-manager 2024-04-16 10:00:28
         resources:
           limits:
-            cpu: "5"
-            memory: 3Gi
+            cpu: 500m
+            memory: 256Mi
           requests:
-            cpu: "1"
-            memory: 500Mi
+            cpu: 10m
+            memory: 64Mi
```

```diff
--- /var/folders/b2/hgd_skcd7fxd1mvvsb2jq2cr0000gn/T/LIVE-408301260/v1.ConfigMap.piraeus-datastore.piraeus-operator-image-config        2024-04-16 10:00:28
+++ /var/folders/b2/hgd_skcd7fxd1mvvsb2jq2cr0000gn/T/MERGED-3149965176/v1.ConfigMap.piraeus-datastore.piraeus-operator-image-config     2024-04-16 10:00:28
         resources:
           limits:
-            cpu: "5"
-            memory: 3Gi
+            cpu: 500m
+            memory: 256Mi
           requests:
-            cpu: "1"
-            memory: 500Mi
+            cpu: 10m
+            memory: 64Mi
```

Apply the modified file after reviewing the changes.

If failing with a secret can't be created, follow https://github.com/piraeusdatastore/piraeus-operator/issues/541
