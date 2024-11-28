--------

> I'm getting `failed to refresh token`, `oauth2`, `server_error` errors when trying to access the cluster with kubectl.<br>

Get the config file again.

--------

> This happens too often, and I need to pull the config file over and over again.<br>

You're probably using kubectl concurrently (from several shells in parallel), which breaks the token update mechanism. [Consider using ServiceAccounts][8] for scripts.

Also it's possible CiLogon blocked your IP for abusing their service (if you were using the config via some scripts and some library tried to update the token too frequently)

--------

> My nautilus portal login is not working anymore<br>

You should be consistent in which institution you choose from CILogon list. Even if UCSD is using Google for AD accounts, for CILogon Google and UCSD are two different institutions, which would result in two different accounts.

--------

> My pod is stuck Terminating.

This happens for 2 reasons:
* The node running your pod went offline. The pod will finish terminating once the node is back online
* The storage attached to the pod can't be unmounted.<br>
In both cases you can ask an admin in matrix to look at your pod, or just wait for somebody to fix it.<br>
**DO NOT USE `kubectl  delete --grace-period=0 --force` to delete stuck pods! Those will indefinitely remain on the node, and will require the node reboot (if you happen to know which node was it)**

--------

> I tried to use `nvprof` in my GPU pod and got an error.

There is a [vulnerability](https://nvidia.custhelp.com/app/answers/detail/a_id/4738) in NVIDIA drivers still not fixed, and this feature is disabled by default. Enabling it requires too much effort, so for now we keep it default. Hopefully it will be fixed soon.

--------

> I get timeout connecting to the cluster using kubectl

Some WiFI networks, including UCSD guest WiFi, block access to non standard ports. Our cluster is using port 6443. Try using VPN or switching to a different connection.

--------

> How do I acknowledge support from PRP / Natulius in paper?

This work was supported in part by National Science Foundation (NSF) awards CNS-1730158, ACI-1540112, ACI-1541349, OAC-1826967, OAC-2112167, CNS-2100237, CNS-2120019, the University of California Office of the President, and the University of California San Diego's California Institute for Telecommunications and Information Technology/Qualcomm Institute. Thanks to CENIC for the 100Gbps networks.

[1]: /userdocs/start/get-access/
[2]: /userdocs/start/quickstart/
[3]: /userdocs/storage/ceph/#ceph_s3
[4]: /userdocs/storage/nextcloud/
[5]: https://kubernetes.io/docs/tasks/debug-application-cluster/get-shell-running-container/
[6]: https://en.wikipedia.org/wiki/Secure_copy
[7]: https://rclone.org/
[8]: /userdocs/running/scripts/
