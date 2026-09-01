---
title: How National Research Platform (NRP) Manages Resources
description: How the NRP organizes users and resources into Organizations, Labs, and Projects, and what that means for the namespaces and services your group can use.
banner:
  content: |
    This page explains <strong>how</strong> the NRP organizes resources. For the steps to get an
    account and reach the cluster, follow
    <a href="/documentation/userdocs/start/getting-started/">Getting access</a>.
---

The National Research Platform (NRP) is using a novel way for managing computational resources. This new model allows managing the team's access and resources without needing to contact the NRP core team for every change, enabling everyone to get their work done faster and more efficiently.

:::note[Membership changes take a moment to reach the cluster]

- The portal updates the caches for groups info every minute.
- The k8s access token expires in half an hour. If you need to update the group membership sooner, use the [oidc-login clean command](/documentation/userdocs/start/getting-started#updating-namespace-membership).

:::

## How it works: the hierarchical system

The core of this upgrade is a **hierarchical management system**. This structure organizes users and resources in a clear, nested hierarchy, much like a folder structure:

- **Organizations:** The top level, such as a university or a large research consortium.
- **Labs:** Groups within an organization, typically led by a faculty member or primary researcher.
- **Projects:** Specific research initiatives within a lab.

This structure allows designated administrators to manage permissions for their own members across all their labs and projects.

### How this maps to what you use day to day

The documentation and the cluster itself use Kubernetes terms in most places. These are the same
objects seen from two angles:

| In the hierarchy         | On the cluster                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Project**              | A Kubernetes **namespace**                                                                 |
| **Group Administrator**  | The **namespace `admin`** who adds you to a namespace and answers for what runs in it      |
| **Lab** / **Organization** | Grouping above the namespace — it carries membership and allocation, not a namespace itself |

## Logging in

Access to the NRP is managed through **Authentik**, our single-sign-on authentication system. It connects to your existing university or institutional account via [CILogon](https://www.cilogon.org).

1. The first time you log in, you will be required to read and accept the [NRP Acceptable Use Policy (AUP)](/NRP-AUP.pdf).
2. Accepting the AUP registers your account. It does **not**, on its own, give you compute — you get that once a Group Administrator adds you to one of their Projects. [Getting access](/documentation/userdocs/start/getting-started/) walks through both halves, including how to request administrator rights if you are starting a new group.

Some [NRP services and resources](/documentation/userdocs/start/resources/) require their own separate registration; each one says so on its own page.

## Key resources and how they're managed

This new hierarchical model applies to all resources you use on the platform.

### Kubernetes compute

Our primary service is providing compute resources via Kubernetes. Under the new system, each **Project** you create in the hierarchy directly corresponds to a **namespace** in the Kubernetes cluster. This gives you a secure, dedicated space for your team's applications and workflows.

### LLM proxy

Groups can have the LLM Proxy capability, allowing creating LLM tokens in those.

### Vector database

Groups can have the Vector DB capability, which creates the database in our managed Vector DB.

## Group Administrators

Users with **faculty**, **researcher**, or **postdoc** status can request administrator permissions for their Lab or Organization. Admins can:

- Add or remove users from their groups.
- Create new Projects (i.e., Kubernetes namespaces).
- Manage resource allocations for their teams.

A Group Administrator is personally responsible for everything that runs in their Projects, and for keeping the member list current.

## Fair share scheduling and resource allocation

:::note[Not in effect yet]
Scheduling integration is planned, not deployed. Until it ships, jobs are scheduled as described in
[Cluster Policies](/documentation/userdocs/start/policies/).
:::

The resource hierarchy will be integrated with scheduling add-ons to manage how compute jobs are prioritized and allocated.

To ensure fairness and reward contributions, groups that donate hardware to the cluster will receive an increased resource allowance. This bonus is automatically passed down to all the labs and projects within that group, ensuring your team directly benefits from your contributions on top of the base allocation available to everyone. If your institution is weighing a hardware contribution, [Joining a server](/documentation/admindocs/participating/new-contributor-guide/) covers what is involved.
