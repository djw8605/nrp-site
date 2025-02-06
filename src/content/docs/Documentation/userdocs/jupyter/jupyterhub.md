---
title: Deploy JupyterHub
description: Deploy JupyterHub
---

This guide is based on [Zero to jupyter](https://zero-to-jupyterhub.readthedocs.io/en/stable/) guide with stuff specific to Nautilus cluster. Also assuming you're the admin of the namespace you're deploying to.

Start from choosing the name for your project. It will look like `your_name.nrp-nautilus.io`

#### Register CiLogon application

Register your application at [https://cilogon.org/oauth2/register](https://cilogon.org/oauth2/register).

Set the callback url to `https://your_name.nrp-nautilus.io/hub/oauth_callback`

Client Type: `Confidential`

Scopes: `org.cilogon.userinfo,openid,profile,email`

Refresh Tokens: `No`

Save the client ID and Secret.

#### Create the namespace

Create a namespace for your project on [Nautilus portal](https://portal.nrp-nautilus.io/profileN) and annotate it with all information.

#### Install helm and download the helm chart

Follow the [install guide](https://zero-to-jupyterhub.readthedocs.io/en/stable/jupyterhub/installation.html), and use [this template](values.yaml) for the config:

1. Run `openssl rand -hex 32` and replace the `secret_token` in the yaml file with the generated key
2. Minimally set the `client_id`, `client_secret`, `admin_users`, `secret_token`, `oauth_callback_url`, `ingress.hosts` fields.
3. Add security with either `allowed_idps` or `allowed_users`. Do NOT leave your jupyterhub instance open for anyone to sign in, this may result in locking of your namespace.
4. `helm repo add jupyterhub https://jupyterhub.github.io/helm-chart/ && helm repo update`
5. `helm upgrade --cleanup-on-fail --install jhub jupyterhub/jupyterhub --namespace <namespace> --version=3.3.7 --values config.yaml`

Once the pods start, you should be able to see the installation under your selected name.

#### Automatic deployment

You can put your jupyterhub configuration in GitLab and automatically redeploy the application on repository changes. Please refer to [this guide](/userdocs/development/k8s-integration/) for details.
