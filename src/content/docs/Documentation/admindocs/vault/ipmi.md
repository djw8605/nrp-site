---
title: Updating IPMI info
description: Updating IPMI info
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::

Login to Vault from your local computer:

```
vault login -method=oidc --address=https://vault.nrp-nautilus.io
```

Compare the contents of the file in ansible with the contents of the file in vault.

```
vault kv get --field=contents nrp-secrets/nautilus-hosts-ipmi | diff - <path_to_ansible_repo>/nautilus-ansible/nautilus-hosts-ipmi.yaml
```

There's no git - you need to merge changes yourself. If needed, pull the remote file:

```
vault kv get --field=contents nrp-secrets/nautilus-hosts-ipmi > temp_ipmi.yaml
```

Upload the edited file with your changes to vault:

```
vault kv put nrp-secrets/nautilus-hosts-ipmi contents=@<path_to_ansible_repo>/nautilus-ansible/nautilus-hosts-ipmi.yaml
```
