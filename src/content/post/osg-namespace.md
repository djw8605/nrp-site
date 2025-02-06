---
title: 'OSG - Namespace'
date: Wed, 15 Apr 2015 16:28:00 +0000
draft: false
tags: ['Namespaces']
---

![](https://prp.lsmarr.net/wp-content/uploads/2021/04/osg-1.png)

**Namespace:**    OSG

**PI:** Frank Wuerthwein  
**Institution: **University of California, San Diego  
**Project description:**

**Caching technology deployed on Nautilus cluster: **Stashcache is a caching infrastructure based on the XrootD software. We deploy stashcache containers at grid sites and also in the Internet backbone. The objective is to reduce latency for scientific datasets (open and private) that are accessed at several computing sites. At a computing site the “nearest” cache based on GeoIP is picked and accessed.  
**LIGO and the caching technology: **The LIGO experiment has computing resources located at several location in the US and above. Moreover it can also access the VIRGO computing resources located in Europe. LIGO uses OSG powered technology glideinWMS to run workflows on its own computing resources, VIRGO resources and opportunistic resources. Given the distributed nature of its computing it needs to be able to securely access (Only members of the LIGO collaboration can access these datasets) its input data. The secure caching infrastructure deployed all over using kubernetes provides this.  
Image credit: LIGO/T. Pyle

**Software:** XrootD