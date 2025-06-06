---
title: A New Way to Manage Resources on the National Research Platform (NRP)
---

The National Research Platform (NRP) is transitioning to a new system for managing computational resources. This upgrade gives research groups more direct control by delegating permissions to you. This new model will allow you to manage your own team's access and resources without needing to contact the NRP core team for every change, enabling everyone to get their work done faster and more efficiently.

### How It Works: The New Hierarchical System

The core of this upgrade is a **hierarchical management system**. This structure organizes users and resources in a clear, nested hierarchy, much like a folder structure:

* **Organizations:** The top level, such as a university or a large research consortium.
* **Labs:** Groups within an organization, typically led by a faculty member or primary researcher.
* **Projects:** Specific research initiatives within a lab.

This structure allows designated administrators to manage permissions for their own members across all their labs and projects.

### Getting Started: Your First Login

Access to the NRP is managed through **Authentik**, our new authentication system. It connects to your existing university or institutional account via [CILogon](https://www.cilogon.org).

1.  The first time you log in, you will be required to read and accept the [NRP Acceptable Use Policy (AUP)](/NRP-AUP.pdf).
2.  Once you accept the AUP, you become a registered user with access to all standard [NRP services and resources](/documentation/userdocs/start/resources/).

### Key Resources and How They're Managed

This new hierarchical model applies to all resources you use on the platform.

#### Kubernetes Compute

Our primary service is providing compute resources via Kubernetes. Under the new system, each **Project** you create in the hierarchy directly corresponds to a **namespace** in the Kubernetes cluster. This gives you a secure, dedicated space for your team's applications and workflows.

Some entities might not be tied to kubernetes namespace and instead be an LLM group or just an aggregator for another set of namespaces. Those will be created by cluster admins initially, but later also managed by namespace admins.

#### Group Administrators

Users with **faculty**, **researcher**, or **postdoc** status can request administrator permissions for their Lab or Organization. Admins can:

* Add or remove users from their groups.
* Create new Projects (i.e., Kubernetes namespaces).
* Manage resource allocations for their teams.

#### Other Resources

This same management approach will be used for other NRP resources, including:

* LLM proxy teams
* Storage allocations

### Fair Share Scheduling & Resource Allocation

The resource hierarchy will be integrated with the [Apache YuniKorn scheduler](https://yunikorn.apache.org) to manage how compute jobs are prioritized and allocated.

To ensure fairness and reward contributions, groups that donate hardware to the cluster receive an increased resource allowance. This bonus is automatically passed down to all the labs and projects within that group, ensuring your team directly benefits from your contributions on top of the base allocation available to everyone.