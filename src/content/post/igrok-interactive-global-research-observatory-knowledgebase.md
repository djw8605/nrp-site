---
title: 'IGROK: Interactive Global Research Observatory Knowledgebase'
date: Tue, 16 May 2023 18:08:31 +0000
draft: false
tags: ['Updates']
---

IGROKs are research devices deployed on or near the R&E networks production backbones.

We have deployed the Bluefield 2 devices in 1U DC/AC-powered nodes on PacWave in Los Angeles, Sunnyvale, and Seattle. We have one at UCSD/SDSC in the National Research Platform (NRP) development cluster and another at StarLight in Chicago. We are shipping one to the University of Guam and one to NYSERnet in New York.

These are joined to the NRP Nautilus Kubernetes cluster and used for sFlow ingress from the regional backbone routers into the IGROK network analysis stack. This stack includes perfSONAR, sFlow, inMon Traffic Sentinel, OpenALTO/G2, and ElastiFlow. All the nodes in the cluster participate in perfSONAR MaDDash Mesh testing. We run all-to-all traceroute testing as part of the MaDDash which provides us with additional information that OpenALTO/G2 uses for locating bottleneck structures.

![](https://nationalresearchplatform.org/wp-content/uploads/2023/05/igrok1.png)

**_Figure 1: Bluefield 2 IGROK node specifications._**

![](https://nationalresearchplatform.org/wp-content/uploads/2023/05/igrok2.png)

**_Figure 2: Locations of the Bluefield 2 IGROK nodes._**

These Bluefield 2 devices will also be used for RARE/Freerouter experiments in the international P4 testbed.

We have other DPU/Accelerators deployed on the NRP Nautilus cluster. The presentation below covers all the DPU/Accelerators we have currently deployed: Xilinx U55C, Xilinx SN1000, Xilinx T1 and T2 Telco accelerators, Fungible FS1600 and 8x FC200 DPUs.

\[office\_doc id='4819'\]

We are currently investigating PCIe Gen5 Sapphire Rapids and PCIe Gen5 AMD EPYC 9004 platforms for CXL v1.1/2.0 devices.