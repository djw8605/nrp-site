CEPH S3
=======

To log into the CEPH control pod:

    West Control Pod

    kubectl exec -it -n rook $(kubectl get pods -n rook --selector=app=rook-ceph-tools --output=jsonpath={.items..metadata.name}) -- bash

    East Control Pod

    kubectl exec -it -n rook-east $(kubectl get pods -n rook-east --selector=app=rook-ceph-tools --output=jsonpath={.items..metadata.name}) -- bash

    Central Control Pod

    kubectl exec -it -n rook-central $(kubectl get pods -n rook-central --selector=app=rook-ceph-tools --output=jsonpath={.items..metadata.name}) -- bash


Adding Users
------------

Once logged into the CEPH control pod, run the command to add a user:

    West Pool

    radosgw-admin --rgw-realm=nautiluss3 --rgw-zone=nautiluss3 --rgw-zonegroup=nautiluss3 user create --uid <uid> --display-name "<name>" --email "<email>"

    East Pool
    
    radosgw-admin --rgw-realm=easts3 --rgw-zone=easts3 --rgw-zonegroup=easts3 user create --uid <uid> --display-name "<name>" --email "<email>"

    Central Pool

    radosgw-admin --rgw-realm=centrals3 --rgw-zone=centrals3 --rgw-zonegroup=centrals3 user create --uid <uid> --display-name "<name>" --email "<email>"

The `access_key` and `secret_key` is in the output from the above command.

If the request is from the Matrix support channel, use the user's nickname as `uid`, name as `name` and the email address as `email`.

Deleting Users' Buckets
-----------------------

#### Step 1: Link the Bucket

```bash
radosgw-admin bucket link --uid=USER --bucket=BUCKET
```

- Replace `USER` with the admin’s ID.
- Replace `BUCKET` with the name of the user’s bucket.

#### Step 2: Delete All Objects in the Bucket

```bash
rclone delete S3:bucket-name/ --transfers 1000 --checkers 2000 --disable ListR --progress
```

- `--transfers 1000`: Number of parallel file transfers.
- `--checkers 2000`: Number of simultaneous checks.
- `--disable ListR`: **Speeds up deletion** by skipping recursive listing.
- `--progress`: Shows progress.

#### Step 3: Remove the Bucket

```bash
rclone rmdir S3:bucket-name --progress
```