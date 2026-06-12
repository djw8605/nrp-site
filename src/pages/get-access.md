---
title: 'Get Access'
layout: '~/layouts/MarkdownLayout.astro'
---

To get access to the NRP Nautilus cluster:

1. Point your browser to the [NRP Nautilus portal][1]

1. On the portal page click on "Login" button at the top right corner

1. You will be redirected to the "CILogon" page:<br>

1. On this page, **select an Identity Provider** from the menu and **Click "Log On"** button to use your existing credentials for the chosen provider to sign in.  The provider is one of :

    1. If your institution is using CILogon as a federated certification authority it will be in the menu, select the name of your institution and use either a personal account or an institutional G-suite account.  This is usually  your institutional account name (email) and a password associated with it. 

    1. If your institution is not using CILogon, you can select "Google"

    **We require email to be visible. If you're using OrcID, please change the Email visibility settings for email to Everyone.**

1. After a successful authentication you will login on the portal.

    _On first login you become a **guest**.  Any admin user can 
    validate your guest account,  promote you to **user** and add your account to their **namespace**. You
    need to be assigned to at least one namespace (usually  a group project but can be your new namespace)._

1. To get access to a namespace, please contact it's owner (usually email). Once you are granted the **user** role in the cluster and are added to the
namespace, you will get access to all namespace resources. 

1. If you're starting a new project and would like to have your own namespace,
either for yourself or for your group, you can request to be promoted to the **admin** in [Nautilus Support chat](/contact). 
This will give you permission to create any number of namespaces and invite other users to your namespace(s). 
Please note, you'll be the one responsible for all activity happening in your namespaces.

1. Once you are made either a user or admin of a namespace, you'll need to accept the Acceptable Use Policy (AUP) on the portal page in order to get access to the cluster.

1. Follow [quick start][2] page to start using kubernetes.

[1]: https://nrp.ai

[2]: /documentation/userdocs/start/quickstart/
