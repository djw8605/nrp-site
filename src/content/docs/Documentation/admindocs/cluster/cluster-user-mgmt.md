---
title: User Roles Management
description: Manage user roles and permissions within namespaces.
---

# Managing User Roles

This document outlines the steps to manage user roles and permissions within the platform.

## Add a User to a Namespace

After authentication, a user is designated as a **guest**. Admins can promote the user to a **user** by adding them to a namespace.

Open the [Namespace Manager](https://portal.nrp-nautilus.io/profileN), select the desired namespace:

<img class="" src="/admindocs/images/select-namespace.png">

At the bottom, enter the user's name or email and click "Add user":
<img class="" src="/admindocs/images/add-user.png">

## Promote a User to Admin

To promote a user to an **admin**, typically requested by faculty or an existing admin:

Run the following command:
```bash
kubectl edit prpuser
```

This opens **vi** to edit the user details. Search for the user's email and change the **Role** in the **spec** section to **admin**.

As an admin, the user can create namespaces in the [Namespace Manager](https://portal.nrp-nautilus.io/profileN). If added to a namespace, they will have admin rights for that namespace.

To promote a user from **user** to **admin** of the same namespace, change the role, then remove the user from the namespace and re-add them via [Namespace Manager](https://portal.nrp-nautilus.io/profileN).

## Demote an Admin to User

To demote an admin to a **user**, run the following command:
```bash
kubectl edit prpuser
```

Change the **Role** to **user**, then remove the user from the namespace and re-add them via [Namespace Manager](https://portal.nrp-nautilus.io/profileN).
