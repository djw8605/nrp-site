---
title: Title
description: Description
---

## Yunikorn scheduler

Nautilus is currently transitioning to the Yunikorn scheduler as an experiment in most namespaces (with the exception of several system ones). It's work in progress, and we're updating the documentation, monitoring pages and policies. This page is tracking all the changes.

#### TL;DR

If your namespace is using less than guaranteed resource and resource is low, your new pod can preempt a pod from another namespace that is above the guaranteed value on that resource.

#### General layout

Each namespace is represented as a *queue* in yunikorn, which can be seen at the [Queues page](https://yunikorn.nrp-nautilus.io/#/queues). The queues are forming a tree structure.

Most namespaces are located under the *general* queue with default guaranteed resources.

There are special ones belonging to universities hosting our equipment. You can add your namespace to one of privileged groups in the portal ("Group" field) or by requesting [in matrix](/userdocs/start/contact/).

[Interactive](#interactive-use) queues are set for namespaces generally running interactive use applications (Jupyterhubs, Coder, etc).

Scavenging queues are set with miniman guaranteed resources and can be preempted by any other namespace. Those are for large jobs that can easily tolerate being preempted.

During the scheduling process Yunikorn is trying to optimize the resources such that every queue would get at least the guaranteed resources. This means that if a queue is consuming less than guaranteed, it can preempt pods from another queue which is above the guaranteed.

Laws of preemption in yunikorn:

* Preemption policies are strong suggestions, not guarantees
* Preemption can never leave a queue lower than its guaranteed capacity
* A task cannot preempt other tasks in the same application
* A task cannot trigger preemption unless its queue is under its guaranteed capacity
* A task cannot be preempted unless its queue is over its guaranteed capacity
* A task can only preempt a task with lower or equal priority
* A task cannot preempt tasks outside its preemption fence

There's work being done on automating the configuration for guaranteed resources to match the resources of equipment hosted by each university. Once it's done, members of the university will have priority to use at least the resources hosted in that location.

The behavior is different from the standard kubernetes scheduler, where only priority matters. Now the priority can be equal or less for the pod to be preempted, and the queue consumed resources relative to the queue guarantees is the key factor for determining the preemption.

[More documentation on preemption](https://yunikorn.apache.org/docs/user_guide/preemption_cases#yunikorn-preemption)

[Documentation on gang scheduling](https://yunikorn.apache.org/docs/user_guide/gang_scheduling)

#### Scheduling inside a namespace

For namespaces with multiple users it's possible to have fair scheduling by manually assigning the applicationId to jobs. The jobs will be [fairly sorted](https://yunikorn.apache.org/docs/user_guide/sorting_policies/#fairsortpolicy). Please use the [documentation to assign the applicationId](https://yunikorn.apache.org/docs/user_guide/labels_and_annotations_in_yunikorn).

Using this will allow new pods to be scheduled ahead of older ones belonging to a large application, but will do no preemption between the pods (the pods of larger application will not be killed when pods from a smaller application are trying to start).

#### Interactive use

It's better to disable the preemption for interactive pods such as jupyterhub, coder and other pods where user is actively doing stuff. We can add namespaces to the "Interactive" queues [on request](/userdocs/start/contact/), making those non-preemptable even when the queue is above the guaranteed capacity.