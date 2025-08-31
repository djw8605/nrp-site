---
publishDate: 2025-07-29T00:00:00Z
title: NRP at PEARC25
excerpt: Advancing Distributed Cyberinfrastructure and In-Network Intelligence
image: ~/assets/images/posts/pearc25_1.jpg
category: Events
tags:
  - conference
---



The **National Research Platform (NRP)** had a strong presence at **PEARC25**, held July 20–24 in Columbus, Ohio. With contributions across paper sessions, workshops, and Birds-of-a-Feather (BoF) discussions, NRP demonstrated its growing role in enabling scalable, distributed scientific computing and educational cyberinfrastructure.

Led by **Principal Investigator Dr. Frank Würthwein**, who serves as the Executive Director of the **Open Science Grid** and Director of the **San Diego Supercomputer Center (SDSC)**, the NRP team continues to pioneer collaborative, federated infrastructure spanning over 75 sites globally. Co-PIs **Dr. Mahidhar Tatineni** (User Support Group Lead at SDSC/UCSD) and **Dr. Derek Weitzel** (Research Assistant Professor at the University of Nebraska–Lincoln) also joined in leading discussions and presenting advancements. Key technical efforts were driven by **Mohammad Firas Sada**, Chief Full Stack Developer at SDSC/UCSD, and **Igor Sfiligoi**, Lead Scientific Software Developer and Researcher at SDSC.

---

## 📄 NRP Paper Spotlight

**Session:** Systems & Software (S&SS-2-4)  
**Title:** *The National Research Platform: Stretched, Multi-Tenant, Scientific Kubernetes Cluster*
**Presenter:** Derek Weitzel
**Authors:** Derek Weitzel, Ashton Graves, Sam Albin, Huijun Zhu, Frank Würthwein, Mahidhar Tatineni, Dmitry Mishin, Elham Khoda, Mohammad Firas Sada, Larry Smarr, Thomas DeFanti, John Graham

This paper presented the NRP’s architecture as a distributed, multi-tenant **Kubernetes-based scientific cyberinfrastructure**. The platform spans U.S. and international sites and supports a wide range of scientific workflows, including AI/ML workloads, by federating diverse computational nodes, from single machines to large clusters.

The paper detailed core design principles such as:

- User-friendly access via **JupyterHub** and **Coder IDEs**
- Transparent and secure resource isolation via **multi-tenancy**
- **Unified monitoring, logging, and security threat detection**
- Integration of academic and community-owned compute/storage nodes

The NRP paper underscored the importance of community-driven infrastructure for sustainable, scalable science.

> 📚 [Learn how to cite this paper](https://nrp.ai/documentation/userdocs/start/faq/)
> 🔗 **DOI:** [10.1145/3708035.3736060](https://doi.org/10.1145/3708035.3736060)  
> 📄 **arXiv:** [arXiv:2505.22864](https://doi.org/10.48550/arXiv:2505.22864)
> 📊 **Slides:** [Zenodo](https://zenodo.org/records/16422100)


---

## 🤝 BoF Highlight

**BOF-16:** *National Research Platform (NRP) for Educators: Using a community-owned platform in the classroom*  
**Led by:**  
**Mahidhar Tatineni:** Co-PI and User Support Group Lead at SDSC/UCSD.  
**Frank Würthwein:** Principal Investigator of NPR, Executive Director of the Open Science Grid and Director of the San Diego Supercomputer Center (SDSC).  
**Derek Weitzel:** Co-PI and Research Assistant Professor School of Computing at UNL  
**Eric Van Dusen:** Outreach and Tech Lead for Data Science Undergraduate Studies at UC Berkeley.  
**Kyle Krick:** Research Computing Facilitator at SDSU.

This lively BoF session gathered educators and technologists to discuss NRP’s value in **academic classrooms**. The team showcased tools like:

- **Hosted and private JupyterHubs**
- **Coder IDEs** for instruction and coursework
- Access to **LLM services** for natural language-based education tools
- **Bring-your-own-hardware (BYOH)** support for local campuses

With participation from over 75 institutions, the session explored successful deployments, practical usage by faculty, and challenges in scaling cyberinfrastructure-enabled pedagogy.



---

## 🔬 Workshop Feature

**Workshop-6:** *Opportunities, Benefits and Challenges of Sharing Memory Between CPUs and GPUs*  
**Organizers:** Igor Sfiligoi, Mahidhar Tatineni, Dan Stanzione, John Cazes, Amit Ruhela

This well-attended workshop covered next-generation **shared memory architectures** by NVIDIA and AMD that unify CPU and GPU memory spaces. Participants gained insights into:

- Performance trade-offs between **unified and discrete memory systems**
- **Programming simplifications** through shared address spaces
- Platform-specific optimization strategies

The session was tailored to experienced developers and system operators looking to evaluate or deploy unified memory systems in scientific computing centers.

---

## 🌐 In-Network Machine Learning Paper

**Session:** Applications & Software (A&SW-7-1)  
**Title:** *Real-Time In-Network Machine Learning on P4-Programmable FPGA SmartNICs with Fixed-Point Arithmetic and Taylor Approximations*  
**Presenter:** Mohammad Firas Sada
**Authors:** Mohammad Firas Sada, John Graham, Mahidhar Tatineni, Dmitry Mishin, Thomas DeFanti, Frank Würthwein

This research introduced a novel system for **machine learning inference directly inside the network**, using **P4-programmable FPGA SmartNICs**. The team demonstrated how fixed-point arithmetic and Taylor approximations allow for efficient inference with reduced power and latency, paving the way for responsive, **edge-based AI in networked science systems**.

This project aligns closely with NRP’s goal of pushing computation **closer to data sources and network edges**, particularly in AI-driven scientific workflows.

> 🔗 **DOI:** [10.1145/3708035.3736086](https://dl.acm.org/doi/10.1145/3708035.3736086)  
> 📄 **arXiv:** [arXiv:2507.00428](https://arxiv.org/abs/2507.00428)
> 📊 **Slides:** [Zenodo](https://zenodo.org/records/16791369)
---

## Looking Forward

We’re grateful to the **PEARC25 organizers** and the broader **ACM PEARC community** for providing a platform to share and discuss these advances. As the NRP continues to grow, we look forward to deepening collaborations with educators, researchers, and developers across the globe.

Stay tuned for further updates and upcoming deployments, and as always, we invite the community to engage, contribute, and build with us.

---

*This blog post was edited using NRP's publicly hosted LLMs. [Learn more](https://nrp.ai/documentation/userdocs/ai/llm-managed/).*

![PEARC25](~/assets/images/posts/pearc25_1.jpg)
![NRP Paper](~/assets/images/posts/pearc25_2.jpg)

![BoF Session](~/assets/images/posts/pearc25_3.jpg)
![BoF Session](~/assets/images/posts/pearc25_4.jpg)
![BoF Session](~/assets/images/posts/pearc25_5.jpg)
![BoF Session](~/assets/images/posts/pearc25_6.jpg)