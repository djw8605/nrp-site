# Cluster User Management

This document covers topics of user management in National Research Platform kubernetes cluster. A user needs to first [get an account on NRP portal](userdocs/start/get-access).

## Add a user to an existing namespace

After a successful authentication, the user becomes a **guest**. Either an admin of a namespace or a cluster admin can promote the user from **guest** to **user** by adding the user to a namespace.

Open [Namespace manager](https://portal.nrp-nautilus.io/profileN) in a browser, select the namespace:

<img class="" src="/admindocs/images/select-namespace.png">

Scroll to the bottom, type in the user's name or email, and cilick the "Add user" button:
<img class="" src="/admindocs/images/add-user.png">

## Promote a user to **admin**

This task is usually requested by a faculty member in order to create namespaces, or an existing namespace admin wants to add another user as a namespace admin.

Run command:
```
kubectl edit prpuser
```
This command opens **vi** to edit the users, search for the user's email, and change the value of **Role** in **spec** section to **admin**.

As an admin, the user can create namespaces from [Namespace manager](https://portal.nrp-nautilus.io/profileN). If the user is added to a namespace, he/she will be added as an **admin** of the namespace.

If the user is a **user** of a namespace, and needs to be promoted to an **admin** of the same namespace, after changing the role to admin, delete the user from the namespace and add him/her again from [Namespace manager](https://portal.nrp-nautilus.io/profileN).

## Demote a namespace admin to **user**

Similar to the promoting process, run command:
```
kubectl edit prpuser
```
Change the value of **Role** to **user**, then delete the user from the namespace and add him/her again from [Namespace manager](https://portal.nrp-nautilus.io/profileN).
