---
title: Origin SyncThing
description: Origin SyncThing
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




## Syncing user data to an origin

Create the syncthing instance looking at the user's data:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: syncthing-<namespace>
    name: syncthing-<namespace>
  namespace: <namespace>
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 1
  selector:
    matchLabels:
      k8s-app: syncthing-<namespace>
  strategy:
    type: Recreate
  template:
    metadata:
      creationTimestamp: null
      labels:
        k8s-app: syncthing-<namespace>
    spec:
      containers:
        - image: syncthing/syncthing
          imagePullPolicy: Always
          name: syncthing
          resources:
            limits:
              cpu: "2"
              memory: 2G
            requests:
              cpu: 100m
              memory: 100Mi
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /var/syncthing
              name: storage
            - mountPath: /share
              name: share
      dnsPolicy: ClusterFirst
      nodeSelector:
        topology.kubernetes.io/region: us-west
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: syncthing-<namespace>
        - name: share
          persistentVolumeClaim:
            claimName: <the user's data>
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: syncthing-<namespace>
  namespace: <namespace>
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: rook-ceph-block
```

Login to origin syncthing, set up the connection between origin's syncthing and the user's one.
