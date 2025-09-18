---
title: Getting Certs
description: Getting Certs
---

:::caution
This page contains administrative documentation intended for cluster administrators and operators. This content may not be relevant for regular users.
:::




#### Using cert-manager to generate a certificate from Vault (NSI example)

1. Use [the Vault guide](https://www.vaultproject.io/docs/auth/approle) to generate the approle token for your namespace
2. Create the Issuer in the namespace to generate the certificate from Vault:

        apiVersion: cert-manager.io/v1
        kind: Issuer
        metadata:
        name: vault-issuer
        spec:
          vault:
            auth:
            appRole:
              path: approle
              roleId: <approle ID>
              secretRef:
                key: secretId
                name: cert-manager-vault-approle
            path: nsi/sign/nsi
            server: https://vault.nrp-nautilus.io

    and corresponding secret:

        apiVersion: v1
        data:
          secretId: <base64-encoded approle secret>
        kind: Secret
        metadata:
          name: cert-manager-vault-approle
        type: Opaque

3. Create the Certificate to retrieve one:

        apiVersion: cert-manager.io/v1
        kind: Certificate
        metadata:
          name: opennsa
        spec:
          commonName: nsi0.calit2.optiputer.net
          duration: 720h0m0s
          issuerRef:
            kind: Issuer
            name: vault-issuer
          renewBefore: 120h0m0s
          secretName: nsi0-calit2-cert

Done!
