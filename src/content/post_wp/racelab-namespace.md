---
title: 'RACELab - Namespace'
date: Wed, 15 Apr 2015 16:16:00 +0000
draft: false
tags: ['Namespaces']
---

![](https://prp.lsmarr.net/wp-content/uploads/2021/04/racelab.png)

**Namespace:**    RACELAB

**PI: **Chandra Krintz and Rich Wolski  
**Institution:** University of California, Santa Barbara  
**Project description:**

In The UCSB RACE Lab we are developing a new Functions-as-a-Service (FaaS) capability for Nautilus. The goal of the project is to be able to develop applications for Nautilus in the same way that they program commercial FaaS platforms such as AWS Lambda, Microsoft Functions, and Google Functions. FaaS has emerged as a simple, highly scalable programming model that enables rapid development of scalable web services for deployment in public clouds. However, to date, no FaaS platform (commercial or otherwise) allows the development of services that use GPU accelerators to perform their operations. Our goal is provide a scalable FaaS capability for Nautilus that will enable programmers to write, debug, and deploy web services which use GPU processing to perform Machine Learning and AI computations in response to web requests.

  
Currently, we have a simple FaaS prototype working with Nautilus that we are using to train an image-recognizing Neural Network for doing automatic camera trap image classification. Our intention is to incorporate the capability into the [Where’s The Bear? project](https://vimeo.com/253527900) and then to explore providing such capabilities to the ecological science community at large.

  
This work is primarily due to Michael Zhang and his advisors and Kate McCurdy who is director of the Sedgwick Science Reserve Michael is a doctoral candidate in the Computer Science Department at UCSB and a member of the [RACE Lab](https://sites.cs.ucsb.edu/~ckrintz/racelab.html).  
In addition, we are planning to use this new capability as part for the [UCSB SmartFarm Project](https://sites.cs.ucsb.edu/~ckrintz/projects/index.html). This project uses on-line, real-time machine learning algorithms and a new edge-computing targeted distributed platform called SPOT (Software Platform of Things) to manage Internet of Things applications and deployments.

**Software**: Keras, TensorFlow, Kubernetes, Docker, OpenCV, RabbitMQ/Celery, Scikit-learn, NumPy