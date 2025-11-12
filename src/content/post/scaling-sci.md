---
publishDate: 2025-11-11T00:00:00Z
title: "How NRP Scales Global Scientific Research with Calico"
excerpt: NRP provides high-performance, secure, and observable networking for global scientific research
image: ~/assets/images/posts/nrp-calico-2025.png
category: Research
tags:
  - networking
  - HPC
  - Kubernetes
  - scientific-computing
  - Calico
---

The National Research Platform (NRP) enables scientists worldwide to run cutting-edge research by providing a large-scale, distributed computing infrastructure. With Kubernetes clusters spanning hundreds of nodes, thousands of scientific project namespaces, and high-speed connections across dozens of locations, NRP supports a wide range of computationally intensive workflows, from AI-driven simulations to genomics and climate modeling.

Maintaining high performance and security at this scale presents unique challenges. Traditional host firewalls and networking tools often introduce bottlenecks or are difficult to manage across a global platform. To overcome these challenges, NRP utilizes Calico for networking and security, allowing us to enforce fine-grained policies, maintain high throughput, and gain detailed visibility into network traffic across the platform.

Calico's flexibility makes it possible to support a diverse environment that includes dual-stack IPv4/IPv6, Layer-2 and Layer-3 connectivity, and integration with advanced hardware such as FPGAs and SmartNICs. This ensures that researchers can focus on science, not troubleshooting network issues.

> 🔗 **Read the full story:** For an in-depth look at how Calico supports NRP’s high-performance, globally distributed infrastructure, check out the post from [Tigera](https://www.tigera.io/blog/how-nrp-scales-global-scientific-research-with-calico/).