---
title: ESnet SmartNIC FPGA - Running
description: ESnet SmartNIC FPAG Tutorial - Notebook 3/3
---

## Running (Notebook 3/3): Running SmartNIC Logic on the FPGA

This notebook is **Part 3** of the **ESnet SmartNIC Tutorial on NRP** series. It continues from **Notebook 2** to provide an example for building the FPGA logic from our SmartNIC P4 code.

---

### Test Environment

This notebook was tested on the **National Research Platform (NRP)** using the **AMD/Xilinx Alveo U55C FPGA** and **Vivado 2023.1**. The Kubernetes pods were provisioned by [Coder](https://coder.nrp-nautilus.io).

If you run into any issues, please refer to the official [NRP Documentation](https://docs.nrp.ai), or reach out to us via [Matrix](https://element.nrp-nautilus.io) or [email](mailto:support@nationalresearchplatform.org).

Before using the ESnet SmartNIC tools, kindly review the official [ESnet SmartNIC Copyright Notice](https://github.com/esnet/esnet-smartnic-hw).

---

This notebook doesn't require Vivado or special software.

### Step 1: Acquiring the artifcats

You can start directly from this notebook if you have different development and deployment environments and already have the artifacts


```bash
echo "$BASH_VERSION"
```

    5.0.17(1)-release


If the above command doesn't show a bash version, **you may be running with a Python kernel. Please switch to a Bash kernel.**


```bash
cd ~/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/artifacts
ls
```

    bash: cd: /home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/artifacts: No such file or directory
    artifacts.au55c.p4_only.0.zip  Documents  esnet-smartnic  Pictures  Templates
    Desktop			       Downloads  Music		  Public    Videos



```bash
cp artifacts.u55c.p4_only.0.zip to ~/artifacts.u55c.p4_only.0.zip
```

    cp: target '/home/coder/artifacts.u55c.p4_only.0.zip' is not a directory




You should see your artifacts here.

For the sake of demonstration, we will be using an artifacts zip file that we have made publicly available.
**Please note that the artifacts use an evaluation license and will only work for 48 hours.** As a best practice, **always build fresh.** The way this issue materializes is with a SmartNIC that drops 100% of the packets, and stuck DPDK counters.


```bash
cd ~/
wget "https://nextcloud.nrp-nautilus.io/s/5LmLADJtNKmTYSp/download" -O "artifacts.au55c.p4_only.0.zip" 
```

    --2025-03-05 08:22:17--  https://nextcloud.nrp-nautilus.io/s/5LmLADJtNKmTYSp/download
    Resolving nextcloud.nrp-nautilus.io (nextcloud.nrp-nautilus.io)... 129.93.244.193, 2600:900:6:1301:1270:fdff:fe80:cde4
    Connecting to nextcloud.nrp-nautilus.io (nextcloud.nrp-nautilus.io)|129.93.244.193|:443... connected.
    HTTP request sent, awaiting response... 200 OK
    Length: 33635537 (32M) [application/zip]
    Saving to: ‘artifacts.au55c.p4_only.0.zip’
    
    artifacts.au55c.p4_ 100%[===================>]  32.08M  76.6MB/s    in 0.4s    
    
    2025-03-05 08:22:18 (76.6 MB/s) - ‘artifacts.au55c.p4_only.0.zip’ saved [33635537/33635537]
    


### Step 2: Setting up Docker


```bash
docker image ls
```

    REPOSITORY   TAG       IMAGE ID   CREATED   SIZE


The `ESnet SmartNIC` stack requires 3 Docker images:

1. **esnet-smartnic-fw**: The firmware image, requires the artifacts zip file (built for every logic).  
   Repo: [esnet-smartnic-fw](https://github.com/esnet/esnet-smartnic-fw)

2. **smartnic-dpdk-docker**: A containerized DPDK with `pktgen`, patched and built for Alveo FPGAs. Consistent for all FPGA models. Build once, pull, and run everywhere.  
   Repo: [smartnic-dpdk-docker](https://github.com/esnet/smartnic-dpdk-docker)

3. **xilinx-labtools-docker**: A Vivado Lab image that provides tools for flashing the cards. Consistent for all FPGA models. Build once, pull, and run everywhere.  
   Repo: [xilinx-labtools-docker](https://github.com/esnet/xilinx-labtools-docker)


We have provided publicly hosted versions of the `smartnic-dpdk-docker` and `xilinx-labtools-docker` images. These images are hosted on our community gitlab ([gitlab.nrp-nautilus.io](https://gitlab.nrp-nautilus.io)) in repositories. **The versions are not universal, the images with the latest tag are the ones tested with the versions of esnet-smartnic-hw and esnet-smartnic-fw that we refer to in most recent docs and notebooks.**


```bash
docker pull gitlab-registry.nrp-nautilus.io/esnet/xilinx-labtools-docker
docker tag gitlab-registry.nrp-nautilus.io/esnet/xilinx-labtools-docker xilinx-labtools-docker:${USER}-dev

docker pull gitlab-registry.nrp-nautilus.io/esnet/smartnic-dpdk-docker
docker tag gitlab-registry.nrp-nautilus.io/esnet/smartnic-dpdk-docker smartnic-dpdk-docker:${USER}-dev

```

    Using default tag: latest
    latest: Pulling from esnet/xilinx-labtools-docker
    
    [1B4c3075c9: Pulling fs layer 
    [1B882610d3: Pulling fs layer 
    [1Befdf60fd: Pulling fs layer 
    [1B685f2c52: Pulling fs layer 
    [1Ba4ac3123: Pulling fs layer 
    [1B907275f3: Pulling fs layer 
    [1B84aa5ace: Pulling fs layer 
    [1Be1bc9536: Pulling fs layer 
    [1B71174da9: Pulling fs layer 
    [1Ba19bb40b: Pulling fs layer 
    [8B685f2c52: Waiting fs layer 
    [8Ba4ac3123: Waiting fs layer 
    [5Bfailed to register layer: write /tools/Xilinx/Vivado_Lab/2023.1/lib/lnx64.o/librdi_iptasks.so: no space left on device
    Error response from daemon: No such image: gitlab-registry.nrp-nautilus.io/esnet/xilinx-labtools-docker:latest
    Using default tag: latest
    latest: Pulling from esnet/smartnic-dpdk-docker
    
    [1B4c3075c9: Pulling fs layer 
    [1B5082e2b7: Pulling fs layer 
    [1B650534b5: Pulling fs layer 
    [1Ba00a5344: Pulling fs layer 
    [1B8223c371: Pulling fs layer 
    [1B76f66088: Pulling fs layer 
    [1B72a1f4b3: Pulling fs layer 
    [1B51a4ed94: Pulling fs layer 
    [1BDigest: sha256:6475d747b0588e047de21e5ce5e3cd8e71fbf258f49bf2b388d99fe7281be89e
    Status: Downloaded newer image for gitlab-registry.nrp-nautilus.io/esnet/smartnic-dpdk-docker:latest
    gitlab-registry.nrp-nautilus.io/esnet/smartnic-dpdk-docker:latest



```bash
docker image ls
```

    REPOSITORY                                                   TAG         IMAGE ID       CREATED         SIZE
    smartnic-dpdk-docker                                         coder-dev   46405af76854   16 months ago   700MB
    gitlab-registry.nrp-nautilus.io/esnet/smartnic-dpdk-docker   latest      46405af76854   16 months ago   700MB



```bash
whoami
```

    coder


### Step 3: Prep the `esnet-smartnic-fw` repo

The last step is building the `esnet-smartnic-fw` image.


```bash
pwd
```

    /home/coder



```bash
cd ~/esnet-smartnic && \
git clone https://github.com/esnet/esnet-smartnic-fw.git && \
cd esnet-smartnic-fw && \
git checkout c064d4ac775ed1a4c50ec72dea3615f9c644433e && \
git submodule update --init --recursive && \
ls
```

    Cloning into 'esnet-smartnic-fw'...
    remote: Enumerating objects: 3649, done.[K
    remote: Counting objects: 100% (1185/1185), done.[K
    remote: Compressing objects: 100% (601/601), done.[K
    remote: Total 3649 (delta 756), reused 960 (delta 562), pack-reused 2464 (from 1)[K
    Receiving objects: 100% (3649/3649), 885.80 KiB | 5.75 MiB/s, done.
    Resolving deltas: 100% (2217/2217), done.
    Note: switching to 'c064d4ac775ed1a4c50ec72dea3615f9c644433e'.
    
    You are in 'detached HEAD' state. You can look around, make experimental
    changes and commit them, and you can discard any commits you make in this
    state without impacting any branches by switching back to a branch.
    
    If you want to create a new branch to retain commits you create, you may
    do so (now or later) by using -c with the switch command. Example:
    
      git switch -c <new-branch-name>
    
    Or undo this operation with:
    
      git switch -
    
    Turn off this advice by setting config variable advice.detachedHead to false
    
    HEAD is now at c064d4a Merge branch 'dev/jranger/test-automation-framework' into 'main'
    Submodule 'regio' (https://github.com/esnet/regio) registered for path 'regio'
    Cloning into '/home/coder/esnet-smartnic/esnet-smartnic-fw/regio'...
    Submodule path 'regio': checked out 'fbd8bdf1a7a628287e95c5cf667b14afc94203c5'
    build.sh     libsnp4	  README.fw.artifacts  sn-hw	    sn-stack
    Dockerfile   libsnutil	  README.md	       sn-p4-agent  subprojects
    example.env  LICENSE.md   regio		       sn-p4-cli
    libopennic   meson.build  sn-cli	       sn-p4-proto


**Copy the artifacts to sn-hw without renaming.**


```bash
cp ~/artifacts.au55c.p4_only.0.zip sn-hw/
ls sn-hw
```

    artifacts.au55c.p4_only.0.zip


`artifacts` is a prefix all `hw` artifacts start with.

`au55c` is the board model (U55C). For U280, it would be `au280`.

`p4_only` is the name of the example we built. Had we built our own, it would've had a name we specified.

`0` is the version. Specified in the Makefile..

### Step 4: Building the docker image

The root director of the repo requires a correctly filled `.env` file.


```bash
cat example.env | grep -i required -A 4
```

    # (Required) Hardware Application Name
    #  - Used to select the esnet-smartnic-hw artifact to build against
    #  - This is commonly the same name as the git repository that holds your smartnic plugin
    #  - Selects the artifact zip file from the sn-hw directory
    #SN_HW_APP_NAME=esnet-smartnic-ht
    --
    # (Required) Hardware Board Variant
    #  - Used to select the esnet-smartnic-hw artifact to build against
    #  - Selects the artifact zip file from the sn-hw directory
    #  - Examples: au280 au55c au250
    #SN_HW_BOARD=au280
    --
    # (Required) Hardware Version
    #  - Used to select the esnet-smartnic-hw artifact to build against
    #  - Selects the artifact zip file from the sn-hw directory
    #SN_HW_VER=0
    



```bash
cat <<EOL > .env
SN_HW_APP_NAME=p4_only
SN_HW_BOARD=au55c
SN_HW_VER=0
EOL
```


```bash
cat .env
```

    SN_HW_APP_NAME=p4_only
    SN_HW_BOARD=au55c
    SN_HW_VER=0


Now we can build the image with `./build.sh`. This might take ~30-40 minutes.


```bash
./build.sh
```

    Building container 'esnet-smartnic-fw:coder-dev'
    #0 building with "default" instance using docker driver
    
    #1 [internal] load .dockerignore
    #1 transferring context: 2B done
    #1 ...
    
    #2 [internal] load build definition from Dockerfile
    #2 transferring dockerfile: 2.47kB done
    #2 DONE 8.2s
    
    #1 [internal] load .dockerignore
    #1 DONE 9.6s
    
    #3 resolve image config for docker.io/docker/dockerfile:1
    #3 DONE 13.0s
    
    #4 docker-image://docker.io/docker/dockerfile:1@sha256:93bfd3b68c109427185cd78b4779fc82b484b0b7618e36d0f104d4d801e66d25
    #4 resolve docker.io/docker/dockerfile:1@sha256:93bfd3b68c109427185cd78b4779fc82b484b0b7618e36d0f104d4d801e66d25
    #4 resolve docker.io/docker/dockerfile:1@sha256:93bfd3b68c109427185cd78b4779fc82b484b0b7618e36d0f104d4d801e66d25 4.7s done
    #4 sha256:93bfd3b68c109427185cd78b4779fc82b484b0b7618e36d0f104d4d801e66d25 8.40kB / 8.40kB done
    #4 sha256:6427b0634e7650a14afc322b71a37b4654b4471539d1f9a19cb16525a2fb2e56 850B / 850B done
    #4 sha256:6e15488ac914a453a6e13f419cde418c67927d93d6b0a0f23b5c70c8ecda3fc6 1.26kB / 1.26kB done
    #4 sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9 0B / 12.78MB 1.3s
    #4 sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9 2.10MB / 12.78MB 1.8s
    #4 sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9 11.53MB / 12.78MB 1.9s
    #4 sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9 12.78MB / 12.78MB 2.0s
    #4 sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9 12.78MB / 12.78MB 5.9s done
    #4 extracting sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9
    #4 extracting sha256:8a2af9a64344571e7f712dde5e52bb25729d3ea0f3208ec86dd5af836b4ef1b9 0.5s done
    #4 DONE 18.9s
    
    #5 [internal] load build definition from Dockerfile
    #5 WARN: InvalidDefaultArgInFrom: Default value for ARG ${SMARTNIC_DPDK_IMAGE_URI} results in empty or invalid base image name (line 4)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 6)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 7)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 8)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 61)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 62)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 63)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 64)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 65)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 66)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 68)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 69)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 70)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 71)
    #5 WARN: LegacyKeyValueFormat: "ENV key=value" should be used instead of legacy "ENV key value" format (line 72)
    #5 DONE 0.0s
    
    #6 [internal] load metadata for docker.io/library/smartnic-dpdk-docker:coder-dev
    #6 DONE 0.0s
    
    #7 [internal] load .dockerignore
    #7 DONE 0.0s
    
    #8 [internal] preparing inline document
    #8 ...
    
    #9 [internal] load build context
    #9 transferring context: 35.47MB 0.2s done
    #9 ...
    
    #10 [stage-0 1/8] FROM docker.io/library/smartnic-dpdk-docker:coder-dev
    #10 ...
    
    #8 [internal] preparing inline document
    #8 DONE 11.7s
    
    #10 [stage-0 1/8] FROM docker.io/library/smartnic-dpdk-docker:coder-dev
    #10 ...
    
    #9 [internal] load build context
    #9 DONE 12.4s
    
    #10 [stage-0 1/8] FROM docker.io/library/smartnic-dpdk-docker:coder-dev
    #10 DONE 31.3s
    
    #11 [stage-0 2/8] RUN <<EOT (set -ex...)
    #11 7.562 + ln -fs /usr/share/zoneinfo/UTC /etc/localtime
    #11 7.564 + apt update -y
    #11 7.568 
    #11 7.568 WARNING: apt does not have a stable CLI interface. Use with caution in scripts.
    #11 7.568 
    #11 7.691 Get:1 http://linux.mirrors.es.net/ubuntu focal InRelease [265 kB]
    #11 7.748 Get:2 http://linux.mirrors.es.net/ubuntu focal-updates InRelease [128 kB]
    #11 7.761 Get:3 http://linux.mirrors.es.net/ubuntu focal-backports InRelease [128 kB]
    #11 7.774 Get:4 http://linux.mirrors.es.net/ubuntu focal-security InRelease [128 kB]
    #11 7.838 Get:5 http://linux.mirrors.es.net/ubuntu focal/multiverse amd64 Packages [177 kB]
    #11 7.858 Get:6 http://linux.mirrors.es.net/ubuntu focal/universe amd64 Packages [11.3 MB]
    #11 7.955 Get:7 http://linux.mirrors.es.net/ubuntu focal/main amd64 Packages [1275 kB]
    #11 7.964 Get:8 http://linux.mirrors.es.net/ubuntu focal/restricted amd64 Packages [33.4 kB]
    #11 7.970 Get:9 http://linux.mirrors.es.net/ubuntu focal-updates/universe amd64 Packages [1593 kB]
    #11 7.979 Get:10 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 Packages [4742 kB]
    #11 8.012 Get:11 http://linux.mirrors.es.net/ubuntu focal-updates/restricted amd64 Packages [4607 kB]
    #11 8.044 Get:12 http://linux.mirrors.es.net/ubuntu focal-updates/multiverse amd64 Packages [34.6 kB]
    #11 8.044 Get:13 http://linux.mirrors.es.net/ubuntu focal-backports/universe amd64 Packages [28.6 kB]
    #11 8.045 Get:14 http://linux.mirrors.es.net/ubuntu focal-backports/main amd64 Packages [55.2 kB]
    #11 8.070 Get:15 http://linux.mirrors.es.net/ubuntu focal-security/main amd64 Packages [4266 kB]
    #11 8.114 Get:16 http://linux.mirrors.es.net/ubuntu focal-security/multiverse amd64 Packages [30.9 kB]
    #11 8.114 Get:17 http://linux.mirrors.es.net/ubuntu focal-security/restricted amd64 Packages [4418 kB]
    #11 8.147 Get:18 http://linux.mirrors.es.net/ubuntu focal-security/universe amd64 Packages [1301 kB]
    #11 9.616 Fetched 34.6 MB in 2s (17.0 MB/s)
    #11 9.616 Reading package lists...
    #11 10.60 Building dependency tree...
    #11 10.79 Reading state information...
    #11 10.81 84 packages can be upgraded. Run 'apt list --upgradable' to see them.
    #11 10.81 + apt upgrade -y
    #11 10.81 
    #11 10.81 WARNING: apt does not have a stable CLI interface. Use with caution in scripts.
    #11 10.81 
    #11 10.85 Reading package lists...
    #11 11.84 Building dependency tree...
    #11 12.05 Reading state information...
    #11 12.07 Calculating upgrade...
    #11 12.55 The following packages will be upgraded:
    #11 12.55   apt base-files binutils binutils-common binutils-x86-64-linux-gnu bsdutils
    #11 12.55   ca-certificates distro-info-data e2fsprogs fdisk libapt-pkg6.0 libbinutils
    #11 12.55   libblkid1 libc-ares2 libc-bin libc-dev-bin libc6 libc6-dev libcap2
    #11 12.55   libcap2-bin libcom-err2 libctf-nobfd0 libctf0 libexpat1 libext2fs2 libfdisk1
    #11 12.55   libglib2.0-0 libgnutls30 libgssapi-krb5-2 libk5crypto3 libkrb5-3
    #11 12.55   libkrb5support0 libmount1 libnghttp2-14 libpam-modules libpam-modules-bin
    #11 12.55   libpam-runtime libpam0g libpcap-dev libpcap0.8 libpcap0.8-dev libperl5.30
    #11 12.55   libprocps8 libpython3.8-minimal libpython3.8-stdlib libsmartcols1
    #11 12.55   libsqlite3-0 libss2 libssh-gcrypt-4 libssl-dev libssl1.1 libsystemd0
    #11 12.55   libtasn1-6 libtiff5 libudev1 libuuid1 libxml2 linux-libc-dev locales login
    #11 12.55   logsave mount openssl passwd perl perl-base perl-modules-5.30 procps
    #11 12.55   python-pip-whl python3-idna python3-pip python3-pkg-resources
    #11 12.55   python3-setuptools python3-urllib3 python3.8 python3.8-minimal tar tzdata
    #11 12.55   unzip util-linux vim-common vim-tiny wget xxd
    #11 12.75 84 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
    #11 12.75 Need to get 46.2 MB of archives.
    #11 12.75 After this operation, 234 kB of additional disk space will be used.
    #11 12.75 Get:1 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libc6-dev amd64 2.31-0ubuntu9.17 [2521 kB]
    #11 12.85 Get:2 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libc-dev-bin amd64 2.31-0ubuntu9.17 [71.8 kB]
    #11 12.85 Get:3 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 linux-libc-dev amd64 5.4.0-208.228 [1118 kB]
    #11 12.86 Get:4 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libc6 amd64 2.31-0ubuntu9.17 [2721 kB]
    #11 12.89 Get:5 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 base-files amd64 11ubuntu5.8 [60.3 kB]
    #11 12.89 Get:6 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 bsdutils amd64 1:2.34-0.1ubuntu9.6 [63.3 kB]
    #11 12.89 Get:7 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 login amd64 1:4.8.1-1ubuntu5.20.04.5 [220 kB]
    #11 12.89 Get:8 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libperl5.30 amd64 5.30.0-9ubuntu0.5 [3941 kB]
    #11 12.93 Get:9 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 perl amd64 5.30.0-9ubuntu0.5 [224 kB]
    #11 12.93 Get:10 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 perl-base amd64 5.30.0-9ubuntu0.5 [1514 kB]
    #11 12.94 Get:11 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 perl-modules-5.30 all 5.30.0-9ubuntu0.5 [2739 kB]
    #11 12.97 Get:12 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 tar amd64 1.30+dfsg-7ubuntu0.20.04.4 [240 kB]
    #11 12.97 Get:13 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libblkid1 amd64 2.34-0.1ubuntu9.6 [137 kB]
    #11 12.97 Get:14 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libuuid1 amd64 2.34-0.1ubuntu9.6 [20.0 kB]
    #11 12.97 Get:15 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libfdisk1 amd64 2.34-0.1ubuntu9.6 [175 kB]
    #11 12.97 Get:16 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libmount1 amd64 2.34-0.1ubuntu9.6 [149 kB]
    #11 12.97 Get:17 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libsmartcols1 amd64 2.34-0.1ubuntu9.6 [100 kB]
    #11 12.97 Get:18 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 fdisk amd64 2.34-0.1ubuntu9.6 [120 kB]
    #11 12.98 Get:19 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 util-linux amd64 2.34-0.1ubuntu9.6 [1022 kB]
    #11 12.99 Get:20 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 locales all 2.31-0ubuntu9.17 [3868 kB]
    #11 13.02 Get:21 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libc-bin amd64 2.31-0ubuntu9.17 [634 kB]
    #11 13.03 Get:22 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libsystemd0 amd64 245.4-4ubuntu3.24 [267 kB]
    #11 13.03 Get:23 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libudev1 amd64 245.4-4ubuntu3.24 [75.2 kB]
    #11 13.03 Get:24 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libapt-pkg6.0 amd64 2.0.10 [843 kB]
    #11 13.04 Get:25 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libtasn1-6 amd64 4.16.0-2ubuntu0.1 [38.6 kB]
    #11 13.04 Get:26 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libgnutls30 amd64 3.6.13-2ubuntu1.12 [829 kB]
    #11 13.05 Get:27 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 apt amd64 2.0.10 [1280 kB]
    #11 13.06 Get:28 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpam0g amd64 1.3.1-5ubuntu4.7 [55.4 kB]
    #11 13.06 Get:29 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpam-modules-bin amd64 1.3.1-5ubuntu4.7 [41.2 kB]
    #11 13.06 Get:30 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpam-modules amd64 1.3.1-5ubuntu4.7 [261 kB]
    #11 13.06 Get:31 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 logsave amd64 1.45.5-2ubuntu1.2 [10.2 kB]
    #11 13.06 Get:32 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libext2fs2 amd64 1.45.5-2ubuntu1.2 [183 kB]
    #11 13.06 Get:33 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 e2fsprogs amd64 1.45.5-2ubuntu1.2 [527 kB]
    #11 13.07 Get:34 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 mount amd64 2.34-0.1ubuntu9.6 [115 kB]
    #11 13.07 Get:35 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libssl-dev amd64 1.1.1f-1ubuntu2.24 [1586 kB]
    #11 13.09 Get:36 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libssl1.1 amd64 1.1.1f-1ubuntu2.24 [1323 kB]
    #11 13.10 Get:37 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 python3.8 amd64 3.8.10-0ubuntu1~20.04.15 [387 kB]
    #11 13.10 Get:38 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpython3.8-stdlib amd64 3.8.10-0ubuntu1~20.04.15 [1675 kB]
    #11 13.12 Get:39 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 python3.8-minimal amd64 3.8.10-0ubuntu1~20.04.15 [1901 kB]
    #11 13.13 Get:40 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpython3.8-minimal amd64 3.8.10-0ubuntu1~20.04.15 [720 kB]
    #11 13.14 Get:41 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libsqlite3-0 amd64 3.31.1-4ubuntu0.6 [549 kB]
    #11 13.15 Get:42 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libexpat1 amd64 2.2.9-1ubuntu0.8 [75.6 kB]
    #11 13.15 Get:43 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpam-runtime all 1.3.1-5ubuntu4.7 [37.3 kB]
    #11 13.15 Get:44 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 passwd amd64 1:4.8.1-1ubuntu5.20.04.5 [797 kB]
    #11 13.16 Get:45 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libcom-err2 amd64 1.45.5-2ubuntu1.2 [9580 B]
    #11 13.16 Get:46 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libprocps8 amd64 2:3.3.16-1ubuntu2.4 [33.1 kB]
    #11 13.16 Get:47 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libss2 amd64 1.45.5-2ubuntu1.2 [11.3 kB]
    #11 13.16 Get:48 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 procps amd64 2:3.3.16-1ubuntu2.4 [232 kB]
    #11 13.16 Get:49 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 openssl amd64 1.1.1f-1ubuntu2.24 [621 kB]
    #11 13.17 Get:50 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 ca-certificates all 20240203~20.04.1 [159 kB]
    #11 13.17 Get:51 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 distro-info-data all 0.43ubuntu1.17 [5040 B]
    #11 13.17 Get:52 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libcap2 amd64 1:2.32-1ubuntu0.2 [15.7 kB]
    #11 13.17 Get:53 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libcap2-bin amd64 1:2.32-1ubuntu0.2 [26.2 kB]
    #11 13.17 Get:54 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libglib2.0-0 amd64 2.64.6-1~ubuntu20.04.8 [1289 kB]
    #11 13.18 Get:55 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libxml2 amd64 2.9.10+dfsg-5ubuntu0.20.04.9 [641 kB]
    #11 13.19 Get:56 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 python3-setuptools all 45.2.0-1ubuntu0.2 [330 kB]
    #11 13.19 Get:57 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 python3-pkg-resources all 45.2.0-1ubuntu0.2 [130 kB]
    #11 13.19 Get:58 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 tzdata all 2024b-0ubuntu0.20.04.1 [299 kB]
    #11 13.20 Get:59 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 vim-tiny amd64 2:8.1.2269-1ubuntu5.31 [580 kB]
    #11 13.20 Get:60 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 xxd amd64 2:8.1.2269-1ubuntu5.31 [50.2 kB]
    #11 13.20 Get:61 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 vim-common all 2:8.1.2269-1ubuntu5.31 [85.2 kB]
    #11 13.20 Get:62 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libgssapi-krb5-2 amd64 1.17-6ubuntu4.9 [121 kB]
    #11 13.20 Get:63 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libkrb5-3 amd64 1.17-6ubuntu4.9 [330 kB]
    #11 13.21 Get:64 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libkrb5support0 amd64 1.17-6ubuntu4.9 [31.3 kB]
    #11 13.21 Get:65 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libk5crypto3 amd64 1.17-6ubuntu4.9 [80.5 kB]
    #11 13.21 Get:66 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpcap0.8-dev amd64 1.9.1-3ubuntu1.20.04.1 [244 kB]
    #11 13.21 Get:67 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpcap0.8 amd64 1.9.1-3ubuntu1.20.04.1 [128 kB]
    #11 13.22 Get:68 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 wget amd64 1.20.3-1ubuntu2.1 [349 kB]
    #11 13.22 Get:69 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libctf0 amd64 2.34-6ubuntu1.10 [46.7 kB]
    #11 13.22 Get:70 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 binutils-x86-64-linux-gnu amd64 2.34-6ubuntu1.10 [1613 kB]
    #11 13.24 Get:71 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libbinutils amd64 2.34-6ubuntu1.10 [474 kB]
    #11 13.24 Get:72 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 binutils amd64 2.34-6ubuntu1.10 [3380 B]
    #11 13.24 Get:73 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 binutils-common amd64 2.34-6ubuntu1.10 [208 kB]
    #11 13.24 Get:74 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libctf-nobfd0 amd64 2.34-6ubuntu1.10 [48.1 kB]
    #11 13.24 Get:75 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libnghttp2-14 amd64 1.40.0-1ubuntu0.3 [79.9 kB]
    #11 13.24 Get:76 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libpcap-dev amd64 1.9.1-3ubuntu1.20.04.1 [3492 B]
    #11 13.24 Get:77 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libssh-gcrypt-4 amd64 0.9.3-2ubuntu2.5 [202 kB]
    #11 13.25 Get:78 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libtiff5 amd64 4.1.0+git191117-2ubuntu0.20.04.14 [164 kB]
    #11 13.25 Get:79 http://linux.mirrors.es.net/ubuntu focal-updates/universe amd64 python3-pip all 20.0.2-5ubuntu1.11 [231 kB]
    #11 13.26 Get:80 http://linux.mirrors.es.net/ubuntu focal-updates/universe amd64 python-pip-whl all 20.0.2-5ubuntu1.11 [1808 kB]
    #11 13.27 Get:81 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 python3-idna all 2.8-1ubuntu0.1 [36.2 kB]
    #11 13.27 Get:82 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 python3-urllib3 all 1.25.8-2ubuntu0.4 [88.7 kB]
    #11 13.27 Get:83 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 unzip amd64 6.0-25ubuntu1.2 [169 kB]
    #11 13.27 Get:84 http://linux.mirrors.es.net/ubuntu focal-updates/main amd64 libc-ares2 amd64 1.15.0-1ubuntu0.5 [36.9 kB]
    #11 16.79 debconf: delaying package configuration, since apt-utils is not installed
    #11 18.37 Fetched 46.2 MB in 1s (64.5 MB/s)
    (Reading database ... 16205 files and directories currently installed.)
    #11 19.82 Preparing to unpack .../libc6-dev_2.31-0ubuntu9.17_amd64.deb ...
    #11 21.25 Unpacking libc6-dev:amd64 (2.31-0ubuntu9.17) over (2.31-0ubuntu9.12) ...



```bash
docker image ls
```

### Step 5: Configuring the environment for the stack

The stack with the docker compose profile is in the `sn-stack` directory.


```bash
cd sn-stack && \
cat example.env
```

Similar to the root directory, the `sn-stack` directory requires a `.env` file correctly populated. There are three main environment variables that are needed for the stack to work:

1- The PCI bus address for the FPGA (this is always needed).

2- The USB iSerial for the correct FPGA (this is needed in a multi-FPGA scenario).

3- The profile to run in. In this experiment, we are running in `smartnic-mgr-vfio-unlock`, which allows us to use the smartnic directly without it being locked by DPDK and pktgen.

The command below gets us the list of all Xilinx pci devices that the pod sees. We pick the FPGA we want. Normally, users would reserve the FPGAs per node.


```bash
lspci -d 10ee:
```

The command below lists all USB devices with an iSerial, and looks for the iSerial starting with XF. You might get multiple results, for the mapping, please contact us.

**This works on our systems because the only USB devices with a serial number are the JTAG connections, but for different systems, there may be more USB connections, please carefully go through lsusb -vvv to get the correct device.**


```bash
sudo lsusb -vvv | grep -i iserial | grep -i XF
```


```bash
cat <<EOL > .env
FPGA_PCIE_DEV=0000:c1:00
HW_TARGET_SERIAL=XFL1QYVIDV45A
COMPOSE_PROFILES=smartnic-mgr-vfio-unlock
EOL
```


```bash
docker compose up -d
```

Now, our stack is up.

This will show information about the device such as the build version, build date/time and temperature:


```bash
docker compose exec smartnic-fw sn-cli dev version
docker compose exec smartnic-fw sn-cli dev temp
```

The USR_ACCESS value is typically the unique build pipeline number that produced the embedded FPGA bitfile. The BUILD_STATUS value holds an encoded date/time (Aug 30 at 05:32am) which is when the embedded FPGA bitfile build was started. The DNA value holds the factory-programmed unique ID of the FPGA

The script below resets the names of the ports, sets up app0 and app0 port and routes all egress packets to the propoer egress. 

For more details about the commands and options, please check out the appendix (Appendix A) below.


```bash
docker compose exec smartnic-fw bash -c '
sn-cli dev version
sn-cli sw in-port-rename cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw app0-port-redirect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw app1-port-redirect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw bypass-connect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw in-port-connect cmac0:app0 cmac1:app0 host0:app0 host1:app0
sn-cli sw status
sn-cli qdma setqs 1 1
sn-cli cmac enable
sn-cli cmac status
'
```


```bash
docker compose exec smartnic-fw sn-cli dev temp
```


```bash
docker compose exec smartnic-fw sn-cli probe stats
```


```bash
docker compose exec smartnic-fw sn-p4-cli info
```


```bash
docker compose exec smartnic-fw sn-p4-cli table-insert --help
```

### Step 6: Running DPDK

**Always make sure the stack is down before changing profiles.**


```bash
docker compose down
```


```bash
cat <<EOL > .env
FPGA_PCIE_DEV=0000:c1:00
HW_TARGET_SERIAL=XFL1QYVIDV45A
COMPOSE_PROFILES=smartnic-mgr-dpdk-manual
EOL
```

We bring the stack up with the correct profile for DPDK.

Please note that running in the DPDK profile requries **re-running the setup script we used previously, and whenever pktgen is close, the card is locked and all registers return 0s and Fs.**


```bash
docker compose up -d
```

**Please run pktgen in a terminal, otherwise it will hang.**

For more details about the commands and options, please check out the appendix (Appendix A) below.


```bash
##docker compose exec smartnic-dpdk pktgen -a $SN_PCIE_DEV.0 -a $SN_PCIE_DEV.1 -l 3-7 -n 3 -d librte_net_qdma.so --file-prefix $SN_PCIE_DEV- -- -v -m [4:5].0 -m [6:7].1
```

**Always make sure the stack is down before finishing your work.**


```bash
docker compose down -v --remove-orphans
```

For more details about the commands and options, please check out the appendix (Appendix A) below.

### Appendix A: `sn-cli` and `pktgen` options and commands:

#### Using the sn-cli tool

The sn-cli tool provides subcommands to help you accomplish many common tasks for inspecting and configuring the smartnic platform components.

All commands described below are expected to be executed within the `smartnic-fw` container environment. Use this command to enter the appropriate environment.
```
docker compose exec smartnic-fw bash
```

The `sn-cli` tool will automatically look for an environment variable called `SN_CLI_SLOTADDR` which can be set to the PCIe BDF address of the device that you would like to interact with. In the `smartnic-fw` container, this value will already be set for you.

##### Displaying device information with the "dev" subcommand

This will show information about the device such as the build version, build date/time, and temperature.

```
root@smartnic-fw:/# sn-cli dev version
Device Version Info
	DNA:           0x40020000012306a21c10c285
	USR_ACCESS:    0x000086d3 (34515)
	BUILD_STATUS:  0x04130920

root@smartnic-fw:/# sn-cli dev temp
Temperature Monitors
	FPGA SLR0:    45.551 (deg C)
```
The `USR_ACCESS` value is typically the unique build pipeline number that produced the embedded FPGA bitfile.  
The `BUILD_STATUS` value holds an encoded date/time (Aug 30 at 05:32am) which is when the embedded FPGA bitfile build was started.  
The `DNA` value holds the factory-programmed unique ID of the FPGA.

##### Inspecting and Configuring the CMAC (100G) Interfaces with the "cmac" subcommand

Enable/Disable one or more (or all by default) 100G MAC interfaces using these commands:

```
sn-cli cmac enable
sn-cli cmac disable

sn-cli cmac -p 0 enable
sn-cli cmac -p 1 disable
```
Enabling a CMAC interface allows frames to pass (Rx/Tx) at the MAC layer. These commands **do not affect** whether the underlying physical layer (PHY) is operational.

Display the current MAC and PHY status of one or more (or all by default) 100G MAC interfaces using these commands:

```
root@smartnic-fw:/# sn-cli cmac status
CMAC0
  Tx (MAC ENABLED/PHY UP)
  Rx (MAC ENABLED/PHY UP)

CMAC1
  Tx (MAC ENABLED/PHY UP)
  Rx (MAC ENABLED/PHY DOWN)
```
In the example output above, CMAC0 PHY layer is **UP** in both the Tx and Rx directions. The MAC is fully enabled. This link is operational and should be passing packets normally.

In the example output above, CMAC1 PHY layer is **DOWN** in the Rx (receive) direction. Possible causes for this are:
* No QSFP28 plugged into 100G port 0 the U280 card
* Wrong type of QSFP28 module plugged into 100G port 0
  * 100G QSFP28 SR4 or LR4 modules are supported
  * Some 100G AOC or DACs are known to work
  * QSFP+ 40G modules **are not supported**
  * QSFP 5G modules **are not supported**
* QSFP28 card improperly seated in the U280 card
  * Check if the QSFP28 module is inserted upside down and physically blocked from being fully inserted
  * Unplug/replug the module, ensuring that it is properly oriented and firmly seated
* Fiber not properly inserted
  * Unplug/replug the fiber connection at each end
* Far end is operating in 4x25G or 2x50G split mode
  * The smartnic platform **does not support** 4x25G or 2x50G mode
  * Only 100G mode is supported on each of the U280 100G interfaces
  * Configure far end in 100G mode
* Far end has RS-FEC (Reed-Solomon Forward Error Correction) enabled
  * The smartnic platform **does not support** RS-FEC
  * Disable RS-FEC on the far end equipment

A more detailed status can also be displayed using the `--verbose` option. Note that the `--verbose` option is a global option and thus must be positioned **before** the `cmac` subcommand.

```
root@smartnic-fw:/# sn-cli --verbose cmac -p 1 status
CMAC1
  Tx (MAC ENABLED/PHY UP)
	           tx_local_fault 0
  Rx (MAC ENABLED/PHY DOWN)
	         rx_got_signal_os 0
	               rx_bad_sfd 0
	          rx_bad_preamble 0
	 rx_test_pattern_mismatch 0
	  rx_received_local_fault 0
	  rx_internal_local_fault 1
	           rx_local_fault 1
	          rx_remote_fault 0
	                rx_hi_ber 0
	           rx_aligned_err 0
	            rx_misaligned 0
	               rx_aligned 0
	                rx_status 0
```

Display summary statistics for packets Rx'd and Tx'd from CMAC ports:

```
root@smartnic-fw:/# sn-cli cmac stats
CMAC0: TX      0 RX      0 RX-DISC      0 RX-ERR      0
CMAC1: TX      0 RX      0 RX-DISC      0 RX-ERR      0
```
Note: The CMAC counters are only cleared/reset when the FPGA is reprogrammed.

##### Inspecting and Configuring the PCIe Queue DMA (QDMA) block with the "qdma" subcommand

The QDMA block is responsible for managing all DMA queues used for transferring packets and/or events bidirectionally between the U280 card and the Host CPU over the PCIe bus. In order for any DMA transfers to be allowed on either of the PCIe Physical Functions (PF), an appropriate number of DMA Queue IDs must be provisioned. This can be done using the `qdma` subcommand.

Configure the number of queues allocated to each of the PCIe Physical Functions:

```
sn-cli qdma setqs 1 1
```
This assigns 1 QID to PF0 and 1 QID to PF1. The `setqs` subcommand also takes care of configuring the RSS entropy -> QID map with an equal weighted distribution of all allocated queues. If you're unsure of how many QIDs to allocate, using `1 1` here is your best choice.

Inspect the configuration of the QDMA block:

```
sn-cli qdma status
```

Packet, byte, and error counters are tracked for packets heading between the QDMA engine and the user application. You can display them with this command:

```
sn-cli qdma stats
```
Refer to the `open-nic-shell` documentation for an explanation of exactly where in the FPGA design these statistics are measured.

##### Inspecting packet counters in the smartnic platform with the "probe" subcommand

The smartnic platform implements monitoring points in the datapath at various locations. You can inspect these counters using this command:

```
sn-cli probe stats
```
Refer to the `esnet-smartnic-hw` documentation for an explanation of exactly where in the FPGA design these statistics are measured.

##### Configuring the smartnic platform ingress/egress/bypass switch port remapping functions with the "sw" subcommand

The smartnic platform implements reconfigurable ingress and egress port remapping, connections, and redirecting. You can inspect and modify these configuration points using the "sw" subcommand.

Most of the `sw` subcommands take one or more port bindings as parameters. The port bindings are of the form:

```
<port>:<port-connector>
```

Where:
* `<port>` is one of:
  * cmac0  -- 100G port 0
  * cmac1  -- 100G port 1
  * host0  -- DMA over PCIe Physical Function 0 (PF0)
  * host1  -- DMA over PCIe Physical Function 1 (PF1)
* `<port-connector>` is context dependent and is one of:
  * cmac0
  * cmac1
  * host0
  * host1
  * bypass -- a high bandwidth channel through the smartnic which does **NOT** pass through the user's application
  * app0   -- user application port 0 (typically a p4 program ingress)
  * app1   -- user application port 1 (only available when user implements it in verilog)
  * drop   -- infinite blackhole that discards all packets sent to it

##### Display the current configuration status
```
sn-cli sw status
```

##### Remap/rename physical input ports to logical input ports

The `in-port-rename` subcommand allows you to remap the identity of a smartnic platform physical ingress port to any logical port as seen by the user logic.  Once remapped (eg. from `a`->`b`), all following logic in the smartnic will perceive that the packet arrived on ingress port `b` even though it physically arrived on port `a`.  This can be useful for test injection scenarios but would typically be set to a straight-through mapping in production.
```
sn-cli sw in-port-rename a:b
```

To reset this mapping so each port maps to its usual identity:
```
sn-cli sw in-port-rename cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
```

##### Attach logical input ports to pipelines

The `in-port-connect` subcommand allows you to connect a logical input port to different processing pipelines within the smartnic.  This can be used to connect to a p4 program or to custom logic within the user application.  It can also be used to shunt all packets to a blackhole or to bypass packets around the user application entirely.

```
sn-cli sw in-port-connect cmac0:app0 cmac1:app0 host0:bypass host1:bypass
```

##### Connect input ports to output ports in the bypass path

The `bypass-connect` subcommand allows you to connect input ports directly to output ports as they pass through the bypass path (ie. not through the user application).  This is useful for providing direct connectivity from host PCIe PFs to 100G CMAC interfaces for network testing.

```
sn-cli sw bypass-connect host0:cmac0 host1:cmac1 cmac0:host0 cmac1:host1
```

**NOTE** any packets that follow the bypass path will not be processed by the user's p4 program

##### Override user application output port decisions and redirect to an alternate port

The `app0-port-redirect` and `app1-port-redirect` subcommands allow the user to override the forwarding decisions made by the user application and/or p4 program and redirect any given output port to a different output port.  This can be useful during development/debugging and in test fixtures.

**NOTE** there are separate overrides for the app0 outputs and the app1 outputs.

```
sn-cli sw app0-port-redirect cmac0:host0 cmac1:host1
sn-cli sw app1-port-redirect cmac0:host0 cmac1:host1
```

To reset this mapping so each output ports maps to its usual destination:
```
sn-cli sw app0-port-redirect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw app1-port-redirect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
```

#### Using the sn-p4-cli tool


The user's p4 application embedded within the smartnic design may have configurable lookup tables which are used during the wire-speed execution of the packet processing pipeline.  The sn-p4-cli tool provides subcommands to help you to manage the rules in all of the lookup tables defined in your p4 program.

All commands described below are expected to be executed within the `smartnic-fw` container environment.  Use this command to enter the appropriate environment.
```
docker compose exec smartnic-fw bash
```

The `sn-p4-cli` tool will automatically look for an environment variable called `SN_P4_CLI_SERVER` which can be set to the hostname of the `sn-p4-agent` that will perform all of the requested actions on the real hardware.  In the `smartnic-fw` container, this value will already be set for you.

##### Inspecting the pipeline structure with the "info" subcommand

The `info` subcommand is used to display the pipeline structure, including table names, match fields (and their types), action names and the list of parameters for each action.  This information can be used to formulate new rule definitions for the other subcommands.

```
sn-p4-cli info
```

##### Inserting a new rule into a table

The `table-insert` subcommand allows you to insert a new rule into a specified table.

```
sn-p4-cli table-insert <table-name> <action-name> --match <match-expr> [--param <param-expr>] [--priority <prio-val>]
```
Where:
* `<table-name>` is the name of the table to be operated on
* `<action-name>` is the action that you would like to activate when this rule matches
* `<match-expr>` is one or more match expressions which collectively define when this rule should match a given packet
  * The number and type of the match fields depends on the p4 definition of the table
  * The `--match` option may be specified multiple times and all `match-expr`s will be concatenated
* `<param-expr>` is one or more parameter values which will be returned as a result when this rule matches a given packet
  * The number and type of the action parameters depends on the p4 definition of the action within the table
  * Some actions require zero parameters.  In this case, omit the optional `--param` option entirely.
* `<prio-val>` is the priority to be used to resolve scenarios where multiple matches could occur
  * The `--priority` option is *required* for tables with CAM/TCAM type matches (prefix/range/ternary)
  * The `--priority` option is *prohibited* for tables without CAM/TCAM type mathes

**NOTE**: You can find details about your pipeline structure and valid names by running the `info` subcommand.

##### Updating an existing rule within a table

The `table-update` subcommand allows you to update the action and parameters for an existing rule within a table

```
sn-p4-cli table-update <table-name> <new-action-name> --match <match-expr> [--param <new-param-expr>]
```
Where:
* `<table-name>` is the table containing the rule to be updated
* `<new-action-name>` is the new action that should be applied when this rule matches
* `<match-expr>` is the exact original `<match-expr>` used when the original rule was inserted
* `<new-param-expr>` is the set of new parameters to be returned when this rule matches
  * **NOTE**: the new parameters must be consistent with the new action

##### Removing previously inserted rules

The `clear-all` and `table-clear` and `table-delete` subcommands allow you to remove rules from tables with varying precision.

Clear all rules from *all tables* in the pipeline.
```
sn-p4-cli clear-all`
```

Clear all rules from a *single* specified table.
```
sn-p4-cli table-clear <table-name>
```

Remove a specific rule from a specific table.
```
table-delete <table-name> --match <match-expr>
```

##### Bulk changes of rules using a p4bm simulator rules file

Using the the `p4bm-apply` subcommand, a list of pipeline modifications can be applied from a file.  A subset of the full p4bm simulator file format is supported by the `sn-p4-cli` command.

```
sn-p4-cli p4bm-apply <filename>
```

Supported actions within the p4bm file are:
* `table_insert <table-name> <action-name> <match-expr> => <param-expr> [priority]`
  * Insert a rule
* `clear_all`
  * Clear all rules from all tables
* `table_clear <table-name>`
  * Clear all rules from a specified table

All comment characters `#` and text following them up to the end of the line are ignored.

#### Stopping the runtime environment


When we're finished using the smartnic runtime environment, we can stop and remove our docker containers.

```
docker compose down -v
```

### Using the smartnic-dpdk container


The `sn-stack` environment can be started in a mode where the FPGA can be controlled by a DPDK application.  Running in this mode requires a few carefully ordered steps.

Broadly speaking, the steps required to bring up a DPDK application are as follows:
* Bind the `vfio-pci` kernel driver to each FPGA PCIe physical function (PF)
  * This is handled automatically by the sn-stack.
* Run a DPDK application with appropriate DPDK Environment Abstraction Layer (EAL) settings
  * Use `-a $SN_PCIE_DEV.0` to allow control of one or more specific FPGA PCIe PFs
  * Use `-d librte_net_qdma.so` to dynamically link the correct Userspace Polled-Mode Driver (PMD) for the smartnic QDMA engine
  * The EAL will
    * Open the PCIe PFs using the kernel's `vfio-pci` driver
	* Take the FPGA device out of reset
	* Open and map large memory regions for DMA using the kernel's `hugepages` driver
  * The application is responsible for assigning buffers to one or more of the FPGA's DMA queues
* Use the `sn-cli` tool to configure some of the low-level hardware components in the FPGA
  * Configure the set of valid DMA queues in the FPGA (must match what is set in the DPDK application)
  * Bring up the physical ethernet ports

In the examples below, we will be running the `pktgen-dpdk` application to control packet tx/rx via the FPGA's PCIe physical functions.  This can be very useful for injecting packets into a design for testing behaviour on real hardware.

For more information about DPDK in general, see:
* http://core.dpdk.org/doc/

For more information about the `pktgen-dpdk` application, see:
* https://pktgen-dpdk.readthedocs.io/en/latest/index.html

Before you bring up the `sn-stack`, please ensure that you have uncommented this line in your `.env` file
```
COMPOSE_PROFILES=smartnic-dpdk
```

If you changed this while the stack was already running, you'll need to restart the stack with down/up.

First, you'll need to start up the `pktgen` application to open the vfio-pci device for PF0 and PF1 and take the FPGA out of reset.
```
$ docker compose exec smartnic-dpdk bash
root@smartnic-dpdk:/# pktgen -a $SN_PCIE_DEV.0 -a $SN_PCIE_DEV.1 -l 4-8 -n 4 -d librte_net_qdma.so --file-prefix $SN_PCIE_DEV- -- -v -m [5:6].0 -m [7:8].1
Pktgen:/> help
```
NOTE: Leave this application running while doing the remaining setup steps.  The setup steps below must be re-run after each time you restart the pktgen application since the FPGA gets reset between runs.

Open a **separate** shell window which you will use for doing the low-level smartnic platform configuration.

Configure the Queue mappings for host PF0 and PF1 interfaces and bring up the physical ethernet ports using the `smartnic-fw` container.

```
$ docker compose exec smartnic-fw bash
root@smartnic-fw:/# sn-cli qdma setqs 1 1
root@smartnic-fw:/# sn-cli qdma status
root@smartnic-fw:/# sn-cli cmac enable
root@smartnic-fw:/# sn-cli cmac status
```
Setting up the queue mappings tells the smartnic platform which QDMA queues to use for h2c and c2h packets.  Enabling the CMACs allows Rx and Tx packets to flow (look for `MAC ENABLED/PHY UP`).


### Advanced usage of the pktgen-dpdk application


Example of streaming packets out of an interface from a pcap file rather than generating the packets within the UI.
Note the `-s <P>:file.pcap` option where `P` refers to the port number to bind the pcap file to.

```
root@smartnic-dpdk:/# pktgen -a $SN_PCIE_DEV.0 -a $SN_PCIE_DEV.1 -l 4-8 -n 4 -d librte_net_qdma.so --file-prefix $SN_PCIE_DEV- -- -v -m [5:6].0 -m [7:8].1 -s 1:your_custom.pcap
Pktgen:/> port 1
Pktgen:/> page pcap
Pktgen:/> page main
Pktgen:/> start 1
Pktgen:/> stop 1
Pktgen:/> clr
```

Example of running a particular test case via a script rather than typing at the UI

```
cat <<_EOF > /tmp/test.pkt
clr
set 1 size 1400
set 1 count 1000000
enable 0 capture
start 1
disable 0 capture
_EOF
```

```
root@smartnic-dpdk:/# pktgen -a $SN_PCIE_DEV.0 -a SN_PCIE_DEV.1 -l 4-8 -n 4 -d librte_net_qdma.so --file-prefix $SN_PCIE_DEV- -- -v -m [5:6].0 -m [7:8].1 -f /tmp/test.pkt
```
### Troubleshooting the pktgen-dpdk Application

If pktgen isn't starting, please consider the following troubleshooting steps:

Ensure you are using the correct profile in your `sn-stack/.env` file and that you are starting pktgen with the right command. For a more detailed understanding of the command, please refer to the pktgen documentation provided earlier.

If pktgen is starting, but packets aren't flowing as expected, you can check the packet path using the following command inside the `smartnic-fw` container:

```
sn-cli probe stats
```

If packets sent to/from the host aren't achieving line rate (100Gbps per port), it could be due to QDMA queue allocation. You can attempt to allocate more QDMA queues per port by setting `sn-cli qdma setqs` to values higher than `1 1`.

If packets are egressing to the wrong port (whether CMAC or PF), it might be due to the `sn-cli` configuration. For example, here's a script that routes all egress packets to CMAC1:

```
#!/bin/bash
sn-cli dev version
sn-cli sw in-port-rename cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw app0-port-redirect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw app1-port-redirect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw bypass-connect cmac0:cmac0 cmac1:cmac1 host0:host0 host1:host1
sn-cli sw in-port-connect cmac0:app0 cmac1:app0 host0:app0 host1:app0
sn-cli sw status
sn-cli qdma setqs 1 1
sn-cli cmac enable
sn-cli cmac status
```

These steps should help you troubleshoot issues related to the pktgen-dpdk application effectively.



---
---
---
Now we reach the end of our tutorial.

For more documentation, please refer to some other documentations that we have authored:

<h2 style="font-size: 24px; color: #4CAF50;">1. This tutorial our admins have authored on <a href="https://groundsada.github.io/esnet-smartnic-tutorial/" style="color: #007bff;">GitHub</a></h2>

<h2 style="font-size: 24px; color: #4CAF50;">2. The FABRIC Testbed ESnet SmartNIC docs: <a href="https://learn.fabric-testbed.net/knowledge-base/using-esnet-p4-workflow-on-fabric/" style="color: #007bff;">FABRIC ESnet SmartNIC docs</a></h2>

<h2 style="font-size: 24px; color: #4CAF50;">3. This video tutorial our admins have recorded on <a href="https://www.youtube.com/watch?v=fiZMPPW_oRk&list=PL5Ght4QkHL8QK75R3ThqU7vzob5f65_Zi&ab_channel=MohammadFirasSada" style="color: #007bff;">YouTube</a></h2>



---
This notebook is part 3 out of 3 in the **ESnet SmartNIC Tutorial on NRP** series.

This was last modified on March 4th, 2025.

For any inquiries, questions, feedback, please contact: mfsada@ucsd.edu
