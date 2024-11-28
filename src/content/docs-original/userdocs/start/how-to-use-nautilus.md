How Should I Use The NRP?
=========================

There are many ways to use resources on the NRP, whether you connect to the NRP's Jupyterhub instance to run Jupyter notebooks, or through interfacing with Kubernetes to create pods, jobs, or deployments. Here we will discuss some of the options available for you.

## JupyterHub

[Jupyterhub](/userdocs/jupyter/jupyterhub-service) is the arguably the most user-friendly way to interact with the NRP. It allows you to run [Jupyter notebooks](https://jupyter.org/) in a web browser, without having to worry about the underlying infrastructure. You can access Jupyterhub by visiting the [Jupyterhub](https://jupyterhub-west.nrp-nautilus.io) link and logging in with your institutional credentials. Once authenticated, you can choose the hardware specs to spawn your instance and run Jupyter notebooks as usual.

## Kubernetes

When interfacing with the NRP through Kubernetes, you have more control over the resources you use. You can create pods, jobs, and deployments, and specify the resources you need. This is useful when you need to run a specific software stack, or when you need to run a job that requires a specific amount of resources.

!!! Note

    In almost every case, Kubernetes jobs are the preferred way to run processing on the NRP. This is because jobs are designed to run to completion, and can be scaled up or down as needed.

To get started with Kubernetes, you can follow the [Quick Start](/userdocs/start/quickstart) and [Basic Kubernetes](/userdocs/tutorial/basic) sections. Once you are familiar with Kubernetes, you can create pods, jobs, and deployments as needed.

| Feature | Job | Pod | Deployment |
|---------|-----|-----|------------|
| **Description** | A job is a task that runs to completion. | A pod is a group of one or more containers, with shared storage and network resources. | A deployment is a way to manage a collection of pods. |
| **Management** | Runs jobs to successful completion, handles node failures | Runs a container, no handling of node failure or conatiner failure | Manages pods, scales up or down, handles conatiner failures |
| **Paralellism** | Can run arrays of jobs, or parallel jobs (see [Kubernetes docs](https://kubernetes.io/docs/concepts/workloads/controllers/job/#parallel-jobs)) | Can run multiple containers in a pod | Can run multiple replicas of a pod |
| **Max Resources** | Can specify resources needed for the job | 2 GPUs, 32 GB RAM and 16 CPU cores | Can specify resources needed for the deployment |
| **Max Runtime** | Runs to completion | 6 hours | 2 weeks |
| **Documentation** | [Jobs](/userdocs/running/jobs) | [Pods](https://kubernetes.io/docs/concepts/workloads/pods/) | [Deployments](/userdocs/running/long-idle) |


