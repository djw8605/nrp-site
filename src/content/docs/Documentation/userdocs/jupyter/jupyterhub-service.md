---
title: JupyterHub Service
description: JupyterHub Service
---

## [JupyterHub](https://jupyterhub-west.nrp-nautilus.io) on Nautilus

We provide a hosted [JupyterHub](https://jupyterhub-west.nrp-nautilus.io) service running in the NRP. 
Using the hosted JupyterHub which is convenient if you need to quickly run your workflow and do not want to learn
Kubernetes. Simply follow the above link (or [https://jupyterhub-west.nrp-nautilus.io](https://jupyterhub-west.nrp-nautilus.io)) and use your institutional credentials to login using CILogon.
Choose the hardware specs to spawn your instance.  Once authenticated you can run Jupyter notebooks as usual. 


Your persistent home folder initially will be limited to 5GB. If you need more, you can request it to be extended.

:::note[Idle Jupyter Notebooks]
Your Jupyter container will shut down 1hr after your browser disconnects from it. If you need your job to keep running, don't close the browser window.
You could either use a desktop with a persistent Internet connection or only use this for testing your code.
:::

## Available Images
Available images are described in the [scientific images section](/documentation/userdocs/running/sci-img/).

If you need more, proceed to [Step by Step Tensorflow with Jupyter](/documentation/userdocs/jupyter/jupyter-pod).