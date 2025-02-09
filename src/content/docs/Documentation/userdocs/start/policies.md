---
title: Policies
description: Policies
---

:::note "TL;DR"

    - Use [*Job*](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/) to run [batch jobs](/userdocs/running/jobs/) and set *right* resources request
    - Use [*Deployment*](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) if you need a [**long-running pod**](/userdocs/running/long-idle/) and set **minimal** resources request.
    - Use [monitoring](/userdocs/running/monitoring/) to accurately set the resource requests.
    - Avoid wasting resources: if you've requested something, use it, and free up once computation is done.  Admins monitor resource utilization and will ban namespaces with under-utilized resources requests.
    - **Users running a Job with "sleep" command or equivalent (script ending with "sleep") will be banned from using the cluster.**

#### Acceptable Use Policy

<a href="https://docs.nrp.ai/assets/NRP-AUP.pdf">https://docs.nrp.ai/assets/NRP-AUP.pdf</a>

#### Namespace

One of the main concepts of running workloads in kubernetes is a namespace. A namespace creates an
isolated environment in which you can run your pods. It is possible to invite other users to your namespace
and it is possible to have access to multiple namespaces.

#### Pod and Container

A Kubernetes pod is a group of containers that are deployed together on the same host.
If you frequently deploy single-container pods, you can generally replace the word "pod" with "container".

#### Memory allocation


Kubernetes scheduler tries to accommodate all pods on the set of nodes according to pods definitions and node capacities. To help it serve you the best way, you need to define in your pod the resources you're going to consume. This is done using the Resource Limits and Requests section.

- [Specify memory request and memory limit][1]
- [Specify CPU request and CPU limit][2]

A **request** is what will be reserved for your pod on a node for scheduling purposes. A **limit** is the maximum which your pod should never exceed. If pod goes over its memory **limit**, it ***WILL BE KILLED***. If your pod was suddenly killed, please make sure you've got the limits set up right. [Google best practices post for requests and limits](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-resource-requests-and-limits)

While it's important to set the Limit properly, it's also important to not set the Request too high. Your **request should be as close as possible to the average resources** you're going to consume, and **limit should be a little higher than the highest peak** you're expecting to have. Use [monitoring](/userdocs/running/monitoring/) to set your requests and limits right.

If your RAM limit is much higher than request (more than ~20% higher), you can be in a situation when scheduler puts your pod on a node which only has requested amount of RAM available. Once the pod tries to allocate RAM above the request up to the limit, it will be killed before even reaching the limit, since the node only has requested amount. Same applies to CPUs: if your limit is much higher than request and you're using all available, the node might not have that many cores and will starve the resources, causing your job to run much slower. It's always a tradeoff, so use requests and limits wisely.

#### Interactive use vs batch


There are so called *operators* to control the behaviour of pods. Since pods don't stop themselves in normal conditions, and don't recover in case of node failure, we assume every pod running in the system without any controller to be interactive -- started for a short period of time for active development / debugging. We limit those to request a maximum of **2 GPUs, 32 GB RAM and 16 CPU cores**. Such pods will be **destroyed in 6 hours**, unless you request an exception for your namespace (in case you run jupyterhub or some other application controlling the pods for you).

If you need to run a larger and longer computation, you need to use one of available [Workload Controllers][4]. We recommend running those as [Jobs][5] - this will closely watch your workload and make sure it ran to completion (exited with 0 status), shut it down to free up the resources, and restart if node was rebooted or something else has happened. Please see the [guide on using those][6]. You can use [*Guaranteed QoS*](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/#create-a-pod-that-gets-assigned-a-qos-class-of-guaranteed) for those.

In case you need some pod to run idle for a long time, you can use the [Deployment controller](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#creating-a-deployment). Make sure you set *minimal request* and proper limits for those to get the [Burstable QoS](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/#create-a-pod-that-gets-assigned-a-qos-class-of-burstable)

#### Requesting GPUs


When you [request GPUs for your pod](/userdocs/running/gpu-pods), nobody else can use those until you stop your pod. You should only schedule GPUs that you can actually use. **The only reason to request more than a single GPU** is when your GPU utilization is close to 100% and you can leverage more.

GPUs are a limited resource shared by many users. If you plan on deploying large jobs (>50 GPUs) please present a plan in [matrix][3]


#### Workloads purging (2 weeks max runtime)

We currently have more than a thousand users in the system, and many of them leave behind their deployments when their
computation is done. There's no way for us to know whether some pod is useful or is abandoned. To clear the
abandoned deployments, there's periodic process which destroys the workloads created more than 2 weeks ago. In case
you're running [some permanent service](/userdocs/running/ingress/) and would want us to keep it running, you can contact admins in Matrix and ask
for an exception. Please provide an estimated period of service functioning and brief description of what the
service does. [Long idle pods](/userdocs/running/long-idle/) can't be added to exceptions list, since those are considered temporary and we need to be sure those are cleaned when not needed.

For workloads not in exceptions list you will get 3 notifications after which your workload will
be deleted. Any data in persistent volumes will remain.

#### System load


While you're welcome to use as much resources as needed, using those inefficiently is causing problems to others. The CPU load of the system consists of user load, system load and several others. If you run `top`, you'll see something like:

`Cpu(s): 26.9%us,  1.5%sy,  0.0%ni, 71.5%id,  0.0%wa,  0.0%hi,  0.1%si,  0.0%st`

Which means 27.9% of all system CPU time is spent on user tasks (computing), 1.5% on system stuff (kernel tasks), 71.5 idle, and so on. If system (kernel) load is more than \~15%, it indicates a problem with users code. Usually it's caused by too many threads (system is spending too much time just switching between those), or inefficient file I/O (lots of small files processed by too many workers) or something similar. In this case the system time is wasted not on processing.

If you were told your pod is causing too much load, look at your code and try to figure out where it's spending too much kernel time instead of computations.

[1]: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/#specify-a-memory-request-and-a-memory-limit
[2]: https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/#specify-a-cpu-request-and-a-cpu-limit
[3]: /userdocs/start/contact/
[4]: https://kubernetes.io/docs/concepts/
[5]: https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/
[6]: /userdocs/running/jobs/
