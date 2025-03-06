---
title: User PVC Issues
description: Fixes for common problems that users face with PVCs
---

import { Tabs, TabItem, Steps } from '@astrojs/starlight/components';

import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="Fixing XFS Corruption in Rook Ceph RBD Volumes">
    # **Fixing XFS Corruption in Rook Ceph RBD Volumes**

    If the user's PersistentVolume and PVC becomes XFS-corrupted and shows errors like:

    ```
    mount: /mnt: mount(2) system call failed: Structure needs cleaning.
    ```

    ---
    
    <Steps>

    1. Retrieve the PersistentVolume (PV) YAML:

    ```sh
    kubectl get pv <pv-name> -o yaml
    ```

    2. Locate the **volume handle** (e.g., `csi-vol-<uuid>`) and identify the correct **Ceph pool**.

    3. Ensure you have a `rook-direct-mount` pod available to interact with RBD.

    ---

    1. In the `rook-direct-mount` pod, map the volume to create a local device:

    ```sh
    rbd map csi-vol-<your-volume-id> --pool <your-pool-name>
    ```

    **Example Output:**

    ```
    /dev/rbd5
    ```

    ---

    1. Try mounting the volume to see the error:

    ```sh
    mount /dev/rbd5 /mnt
    ```

    If you see the "Structure needs cleaning" message, the filesystem needs repair.

    ---

    1. Run `xfs_repair` to inspect the filesystem:

    ```sh
    xfs_repair /dev/rbd5
    ```

    2. If it asks to mount the volume first, **force the repair and discard the log** (this may cause minor data loss but recovers the structure):

    ```sh
    xfs_repair -L /dev/rbd5
    ```

    ---

    1. After repair, try mounting again:

    ```sh
    mount /dev/rbd5 /mnt
    ```

    2. Verify the filesystem:

    ```sh
    ls -lah /mnt
    ```

    3. Once everything looks good, unmount and unmap the device:

    ```sh
    umount /mnt
    rbd unmap /dev/rbd5
    ```

    </Steps>

    ---
  </TabItem>
</Tabs>
