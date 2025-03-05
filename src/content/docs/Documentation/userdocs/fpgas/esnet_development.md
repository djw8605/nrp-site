---
title: ESnet SmartNIC FPGA - Development
description: ESnet SmartNIC FPAG Tutorial - Notebook 1/3
---

**For the ipynb notebooks and slides, please see: [the tutorial respository.](https://github.com/nrp-nautilus/esnet-smartnic)**

## Development (Notebook 1/3): Writing and Testing a P4 Program


This notebook is **Part 1** of the **ESnet SmartNIC Tutorial on NRP** series. It provides an example of cloning the `esnet-smartnic-hw` repository, and writing and testing a simple P4 program.

---

### Test Environment

This notebook was tested on the **National Research Platform (NRP)** using the **AMD/Xilinx Alveo U55C FPGA** and **Vivado 2023.1**. The Kubernetes pods were provisioned by [Coder](https://coder.nrp-nautilus.io).

This tutorial is built on the following software/respositories along with versions/commits:

```
Ubuntu 22.04 with Linux 5.15.0-153.
Vivado 2023.1 with the VitisNetowrkingP4 license.
The esnet-smartnic-hw repository.
The esnet-smartnic-fw repository.
The smartnic-dpdk-docker repository.
The xilinx-labtools-docker repository.
```

If you run into any issues, please refer to the official [NRP Documentation](https://docs.nrp.ai), or reach out to us via [Matrix](https://element.nrp-nautilus.io) or [email](mailto:support@nationalresearchplatform.org).

Before using the ESnet SmartNIC tools, kindly review the official [ESnet SmartNIC Copyright Notice](https://github.com/esnet/esnet-smartnic-hw).

---

For more documentation, please refer to some other documentations that we have authored:

<h2 style="font-size: 24px; color: #4CAF50;">1. This tutorial our admins have authored on <a href="https://groundsada.github.io/esnet-smartnic-tutorial/" style="color: #007bff;">GitHub</a></h2>

<h2 style="font-size: 24px; color: #4CAF50;">2. The FABRIC Testbed ESnet SmartNIC docs: <a href="https://learn.fabric-testbed.net/knowledge-base/using-esnet-p4-workflow-on-fabric/" style="color: #007bff;">FABRIC ESnet SmartNIC docs</a></h2>

<h2 style="font-size: 24px; color: #4CAF50;">3. This video tutorial our admins have recorded on <a href="https://www.youtube.com/watch?v=fiZMPPW_oRk&list=PL5Ght4QkHL8QK75R3ThqU7vzob5f65_Zi&ab_channel=MohammadFirasSada" style="color: #007bff;">YouTube</a></h2>

---
### Technical Information for Reproducing This Experiment in a Different Environment

1. **ESnet SmartNIC Tool Stack**

After building the ESnet SmartNIC tool stack, it runs as a **Docker Compose** stack. Therefore, you need a system capable of running `docker-compose`. We’ve tested this on multiple baremetal and KVM environments. For Kubernetes, we use **sysbox** to run **rootless Docker-in-Docker**, allowing `docker-compose` to run within the `crio` runtime without exposing a Docker daemon socket from the host.

The [FABRIC Testbed Guide](https://learn.fabric-testbed.net/knowledge-base/passing-xilinx-u280-fpga-into-a-kvm-vm/) explains how to pass Alveo FPGAs into a KVM VM.

2. **Vivado Software Requirements**

The ESnet SmartNIC tool stack requires **Vivado** software (with the correct version) for **development purposes only**. This version depends on the commits from the `esnet` repositories. The **National Research Platform** offers centralized Xilinx tools (Vitis, Vivado, Vitis_HLS, etc.) served from a Ceph storage pool, along with a floating license server.

If you prefer not to use Coder, you can request access to the Persistent Volume Claim (PVC) for your namespace by contacting the Operations team (contact via Matrix).

3. **Licensing Information**

Proper **licensing** is required. When provisioning from Coder, the licensing server is already configured. Other namespaces or environments can access and point to the license server at:

`XILINXD_LICENSE_FILE=2100@xilinxd.xilinx-dev`.

You can use NRP’s setup for **software-only** use cases, such as building FPGA artifacts for other environments (e.g., FABRIC, CC).

4. **Flashing FPGAs**

Reprogramming FPGAs (e.g., for P4 OpenNIC Shell, XRT, etc.) requires a **JTAG-over-USB connection** to the devices. For Alveo devices, this necessitates an external USB connection to the host server (in this case, the Kubernetes node). The pods provisioned for FPGA tasks will have the USB connection passed through using the **Smarter Device Manager**.

Flashing requires a **power cycle** of the host server (node), which must be coordinated with the Operations team. Please contact us if flashing is required for your work.

5. **FPGA Availability on NRP**

At the time of writing, there are **32 Alveo U55C FPGAs** on NRP, all available on the **Nautilus cluster** at the **San Diego Supercomputer Center**. These FPGAs are located on **PNRP nodes** following the naming convention:

`node-X-Y.sdsc.optiputer.net`.

6. **SmartNIC Configuration**

The FPGAs can be programmed as **SmartNICs**, and in some cases, users may expose them as network interfaces. Pods that handle network operations require special capabilities, such as `CAP_NET_RAW`. These capabilities are pre-configured in Coder, but if you are running outside of Coder, you will need to define these capabilities explicitly.

7. **DPDK Requirements**

Running **DPDK** requires both **hugepages** and **IOMMU passthrough**. These are provided on nodes hosting FPGAs.

8. **Privileges for ESnet SmartNIC Stack**

The ESnet SmartNIC stack performs privileged tasks (e.g., binding and unbinding from devices), which require extra privileges on the host node. These privileges are available in Coder. If you are setting up in your own namespace, please reach out for assistance.

**Important:** Misuse of these privileges will violate our Acceptable Use Policy and may result in immediate account suspension and accountability measures.

---


The ESnet SmartNIC framework provides an entire workflow to program AMD/Xilinx Alveo FPGA cards using P4. The ESnet framework is open-source and available on GitHub. ESnet is a high-performance network that supports scientific research. The ESnet team created the framework that seamlessly integrates AMD/Xilinx tools along with various tools like DPDK to provide an easy way of programming Alveo cards as SmartNICs. The framework runs in docker containers as demonstrated in this Jupyter Notebook.

### Step 1: Set up environment

Remove any pre-existing clones of the tutorial repo.


```bash
rm -rf ~/esnet-smartnic/esnet-smartnic-hw
```


```bash
echo "$BASH_VERSION"
```

    bash: !echo: event not found


If the above command doesn't show a bash version, **you may be running with a Python kernel. Please switch to a Bash kernel.**


```bash
mkdir -p ~/esnet-smartnic
cd ~/esnet-smartnic
```

Clone the `esnet-smartnic-hw` repository from ESnet.
Checkout at the latest tested commit.

### Step 2: Clone the reposirtory


```bash
git clone https://github.com/esnet/esnet-smartnic-hw.git 
cd esnet-smartnic-hw
git checkout d3782445ce5f090ca955693a98ce68f96b68943c
git submodule update --init --recursive
sudo apt install python3-yaml python3-jinja2 python3-click -y
pip3 install -r esnet-fpga-library/tools/regio/requirements.txt
ls
```

    Cloning into 'esnet-smartnic-hw'...
    remote: Enumerating objects: 9576, done.[K
    remote: Counting objects: 100% (4388/4388), done.[K
    remote: Compressing objects: 100% (2112/2112), done.[K
    remote: Total 9576 (delta 2373), reused 3994 (delta 2038), pack-reused 5188 (from 1)[K
    Receiving objects: 100% (9576/9576), 2.27 MiB | 5.92 MiB/s, done.
    Resolving deltas: 100% (5656/5656), done.
    Note: switching to 'd3782445ce5f090ca955693a98ce68f96b68943c'.
    
    You are in 'detached HEAD' state. You can look around, make experimental
    changes and commit them, and you can discard any commits you make in this
    state without impacting any branches by switching back to a branch.
    
    If you want to create a new branch to retain commits you create, you may
    do so (now or later) by using -c with the switch command. Example:
    
      git switch -c <new-branch-name>
    
    Or undo this operation with:
    
      git switch -
    
    Turn off this advice by setting config variable advice.detachedHead to false
    
    HEAD is now at d378244 Merge branch 'dev/jsewter/vitisnetp4-pkg-compile' into 'main'
    Submodule 'esnet-fpga-library' (https://github.com/esnet/esnet-fpga-library) registered for path 'esnet-fpga-library'
    Submodule 'open-nic-shell' (https://github.com/esnet/open-nic-shell) registered for path 'open-nic-shell'
    Cloning into '/home/coder/esnet-smartnic/esnet-smartnic-hw/esnet-fpga-library'...
    Cloning into '/home/coder/esnet-smartnic/esnet-smartnic-hw/open-nic-shell'...
    Submodule path 'esnet-fpga-library': checked out 'f27e5c986fa7140e6142f21fb31bd85b14a9042d'
    Submodule 'regio' (https://github.com/esnet/regio) registered for path 'esnet-fpga-library/tools/regio'
    Submodule 'svunit' (https://github.com/svunit/svunit.git) registered for path 'esnet-fpga-library/tools/svunit'
    Cloning into '/home/coder/esnet-smartnic/esnet-smartnic-hw/esnet-fpga-library/tools/regio'...
    Cloning into '/home/coder/esnet-smartnic/esnet-smartnic-hw/esnet-fpga-library/tools/svunit'...
    Submodule path 'esnet-fpga-library/tools/regio': checked out 'fbd8bdf1a7a628287e95c5cf667b14afc94203c5'
    Submodule path 'esnet-fpga-library/tools/svunit': checked out '84b88033590a1469a238be84d8526b25a9f29d10'
    Submodule path 'open-nic-shell': checked out '4f3b446d57ab9d4121ca586807326040bb3a581c'
    Reading package lists... 0%Reading package lists... 0%Reading package lists... 0%Reading package lists... 4%Reading package lists... 4%Reading package lists... 4%Reading package lists... 4%Reading package lists... 39%Reading package lists... 39%Reading package lists... 40%Reading package lists... 40%Reading package lists... 53%Reading package lists... 53%Reading package lists... 65%Reading package lists... 65%Reading package lists... 70%Reading package lists... 70%Reading package lists... 70%Reading package lists... 70%Reading package lists... 70%Reading package lists... 70%Reading package lists... 70%Reading package lists... 71%Reading package lists... 71%Reading package lists... 82%Reading package lists... 82%Reading package lists... 94%Reading package lists... 94%Reading package lists... 98%Reading package lists... 98%Reading package lists... 98%Reading package lists... 98%Reading package lists... 99%Reading package lists... 99%Reading package lists... 99%Reading package lists... 99%Reading package lists... Done
    Building dependency tree... 0%Building dependency tree... 0%Building dependency tree... 50%Building dependency tree... 50%Building dependency tree       
    Reading state information... 0%Reading state information... 0%Reading state information... Done
    python3-click is already the newest version (7.0-3).
    python3-jinja2 is already the newest version (2.10.1-2ubuntu0.3).
    python3-yaml is already the newest version (5.3.1-1ubuntu0.1).
    The following packages were automatically installed and are no longer required:
      accountsservice-ubuntu-schemas bc bluez-obexd cups cups-browsed cups-client
      cups-common cups-core-drivers cups-daemon cups-filters
      cups-filters-core-drivers cups-ipp-utils cups-ppdc cups-server-common
      desktop-base dosfstools eject fonts-droid-fallback fonts-noto-mono
      fonts-quicksand fonts-ubuntu fonts-urw-base35 fuse gdisk ghostscript
      gir1.2-dbusmenu-glib-0.4 gnome-bluetooth gnome-power-manager
      gnome-screensaver gvfs gvfs-backends gvfs-common gvfs-daemons gvfs-libs
      hddtemp indicator-applet indicator-application indicator-appmenu
      indicator-bluetooth indicator-common indicator-datetime indicator-keyboard
      indicator-messages indicator-power indicator-printers indicator-session
      indicator-sound jayatana libaccounts-glib0 libatasmart4 libatkmm-1.6-1v5
      libauthen-sasl-perl libbamf3-2 libblockdev-crypto2 libblockdev-fs2
      libblockdev-loop2 libblockdev-part-err2 libblockdev-part2 libblockdev-swap2
      libblockdev-utils2 libblockdev2 libburn4 libcairomm-1.0-1v5 libcdio-cdda2
      libcdio-paranoia2 libcdio18 libcupsfilters1 libdata-dump-perl
      libdbus-glib-1-2 libencode-locale-perl libexo-1-0 libfile-basedir-perl
      libfile-desktopentry-perl libfile-listing-perl libfile-mimeinfo-perl
      libfont-afm-perl libfontembed1 libfuse2 libglibmm-2.4-1v5 libgnome-panel0
      libgs9 libgs9-common libgtkmm-3.0-1v5 libgtksourceview-3.0-1
      libgtksourceview-3.0-common libhtml-form-perl libhtml-format-perl
      libhtml-parser-perl libhtml-tagset-perl libhtml-tree-perl
      libhttp-cookies-perl libhttp-daemon-perl libhttp-date-perl
      libhttp-message-perl libhttp-negotiate-perl libido3-0.1-0 libijs-0.35
      libindicator3-7 libio-html-perl libio-socket-ssl-perl libio-stringy-perl
      libipc-system-simple-perl libisofs6 libjbig2dec0 libjte2 libkeybinder-3.0-0
      liblightdm-gobject-1-0 liblouis-data liblouis20 liblouisutdml-bin
      liblouisutdml-data liblouisutdml9 liblwp-mediatypes-perl
      liblwp-protocol-https-perl libmailtools-perl libmessaging-menu0
      libmtp-common libmtp-runtime libmtp9 libnet-dbus-perl libnet-http-perl
      libnet-smtp-ssl-perl libnet-ssleay-perl libnfs13 libntfs-3g883
      libpangomm-1.4-1v5 libpaper-utils libpaper1 libparted-fs-resize0 libparted2
      libplymouth5 libpoppler-cpp0v5 libqpdf26 libqrencode4 libsigc++-2.0-0v5
      libtagc0 libtie-ixhash-perl libtimedate-perl libtry-tiny-perl
      libunity-gtk2-parser0 libunity-gtk3-parser0 liburl-dispatcher1
      libvolume-key1 libwww-perl libwww-robotrules-perl libx11-protocol-perl
      libxfce4ui-utils libxml-parser-perl libxml-twig-perl libxml-xpathengine-perl
      libxnvctrl0 lightdm lm-sensors lsof mousepad ntfs-3g p7zip p7zip-full parted
      pavucontrol perl-openssl-defaults plymouth plymouth-label
      plymouth-theme-ubuntu-text poppler-utils python3-psutil python3-xdg
      ristretto ssl-cert tango-icon-theme thunar thunar-archive-plugin
      thunar-media-tags-plugin thunar-volman ubuntu-touch-sounds udisks2
      unity-greeter unity-gtk-module-common unity-gtk2-module unity-gtk3-module
      xarchiver xdg-utils xfburn xfce4-appfinder xfce4-clipman
      xfce4-clipman-plugin xfce4-cpufreq-plugin xfce4-cpugraph-plugin
      xfce4-datetime-plugin xfce4-dict xfce4-diskperf-plugin xfce4-fsguard-plugin
      xfce4-genmon-plugin xfce4-mailwatch-plugin xfce4-netload-plugin xfce4-panel
      xfce4-places-plugin xfce4-power-manager xfce4-power-manager-data
      xfce4-screenshooter xfce4-sensors-plugin xfce4-smartbookmark-plugin
      xfce4-systemload-plugin xfce4-taskmanager xfce4-timer-plugin
      xfce4-verve-plugin xfce4-wavelan-plugin xfce4-weather-plugin
      xfce4-whiskermenu-plugin xfce4-xkb-plugin
    Use 'sudo apt autoremove' to remove them.
    0 upgraded, 0 newly installed, 0 to remove and 106 not upgraded.
    Requirement already satisfied: pyyaml-include in /usr/local/lib/python3.8/dist-packages (from -r esnet-fpga-library/tools/regio/requirements.txt (line 1)) (2.1)
    Requirement already satisfied: PyYAML~=6.0 in /usr/local/lib/python3.8/dist-packages (from pyyaml-include->-r esnet-fpga-library/tools/regio/requirements.txt (line 1)) (6.0.1)
    Requirement already satisfied: fsspec>=2021.04.0 in /usr/local/lib/python3.8/dist-packages (from pyyaml-include->-r esnet-fpga-library/tools/regio/requirements.txt (line 1)) (2024.6.0)
    Requirement already satisfied: typing-extensions; python_version < "3.11" in /usr/local/lib/python3.8/dist-packages (from pyyaml-include->-r esnet-fpga-library/tools/regio/requirements.txt (line 1)) (4.12.2)
    cfg	   esnet-fpga-library  Makefile        paths.mk   src
    config.mk  examples	       makefile.esnet  README.md
    docs	   LICENSE.md	       open-nic-shell  scripts


You can see the contents of the repository. The examples directory has multiple examples to show.


```bash
cd examples/p4_only
ls
```

    Makefile  p4  README.md


Running `make` in the p4_only directory will build the *artifacts*, which is a **zip package** containing the compiled bitstream and all other necessary files to run on the FPGA.

The `sim` directory has the simulation-related files.


```bash
cd p4
ls
```

    Makefile  p4_only.p4  sim


### Step 3: P4 Experiments


```bash
cat p4_only.p4
```

    #include <core.p4>
    #include <xsa.p4>
    
    // ****************************************************************************** //
    // *************************** H E A D E R S  *********************************** //
    // ****************************************************************************** //
    
    header ethernet_t {
        bit<48> dstAddr;
        bit<48> srcAddr;
        bit<16> etherType;
    }
    
    // ****************************************************************************** //
    // ************************* S T R U C T U R E S  ******************************* //
    // ****************************************************************************** //
    
    // header structure
    struct headers {
        ethernet_t ethernet;
    }
    
    struct smartnic_metadata {
        bit<64> timestamp_ns;    // 64b timestamp (in nanoseconds). Set at packet arrival time.
        bit<16> pid;             // 16b packet id used by platform (READ ONLY - DO NOT EDIT).
        bit<3>  ingress_port;    // 3b ingress port (0:CMAC0, 1:CMAC1, 2:HOST0, 3:HOST1).
        bit<3>  egress_port;     // 3b egress port  (0:CMAC0, 1:CMAC1, 2:HOST0, 3:HOST1).
        bit<1>  truncate_enable; // reserved (tied to 0).
        bit<16> truncate_length; // reserved (tied to 0).
        bit<1>  rss_enable;      // reserved (tied to 0).
        bit<12> rss_entropy;     // reserved (tied to 0).
        bit<4>  drop_reason;     // reserved (tied to 0).
        bit<32> scratch;         // reserved (tied to 0).
    }
    
    // ****************************************************************************** //
    // *************************** P A R S E R  ************************************* //
    // ****************************************************************************** //
    
    parser ParserImpl( packet_in packet,
                       out headers hdr,
                       inout smartnic_metadata sn_meta,
                       inout standard_metadata_t smeta) {
        state start {
            transition parse_ethernet;
        }
    
        state parse_ethernet {
            packet.extract(hdr.ethernet);
            transition accept;
        }
    }
    
    // ****************************************************************************** //
    // **************************  P R O C E S S I N G   **************************** //
    // ****************************************************************************** //
    
    control MatchActionImpl( inout headers hdr,
                             inout smartnic_metadata sn_meta,
                             inout standard_metadata_t smeta) {
    
        action forwardPacket(bit<3> dest_port) {
            sn_meta.egress_port = dest_port;
        }
        
        action dropPacket() {
            smeta.drop = 1;
        }
    
        table forward {
            key     = { hdr.ethernet.dstAddr : lpm; }
            actions = { forwardPacket; 
                        dropPacket;
                        NoAction; }
            size    = 128;
            num_masks = 8;
            default_action = NoAction;
        }
    
        apply {
            if (smeta.parser_error != error.NoError) {
                dropPacket();
                return;
            }
            
            if (hdr.ethernet.isValid()) {
                sn_meta.rss_entropy = 9w0 ++ sn_meta.ingress_port;
                sn_meta.rss_enable = 1w1;
                forward.apply();
            }
            else
                dropPacket();
        }
    }
    
    // ****************************************************************************** //
    // ***************************  D E P A R S E R  ******************************** //
    // ****************************************************************************** //
    
    control DeparserImpl( packet_out packet,
                          in headers hdr,
                          inout smartnic_metadata sn_meta,
                          inout standard_metadata_t smeta) {
        apply {
            packet.emit(hdr.ethernet);
        }
    }
    
    // ****************************************************************************** //
    // *******************************  M A I N  ************************************ //
    // ****************************************************************************** //
    
    XilinxPipeline(
        ParserImpl(), 
        MatchActionImpl(), 
        DeparserImpl()
    ) main;



```bash
cp ../../../../assets/p4_only.p4 .
cat p4_only.p4
```

    #include <core.p4>
    #include <xsa.p4>
    
    // ****************************************************************************** //
    // *************************** H E A D E R S  *********************************** //
    // ****************************************************************************** //
    
    header ethernet_t {
        bit<48> dstAddr;
        bit<48> srcAddr;
        bit<16> etherType;
    }
    
    //MODIFIED
    header ipv4_t {
        bit<4> version;
        bit<4> ihl;
        bit<8> diffserv;
        bit<16> totalLen;
        bit<16> identification;
        bit<3> flags;
        bit<13> fragOffset;
        bit<8> ttl;
        bit<8> protocol;
        bit<16> hdrChecksum;
        bit<32> srcAddr;
        bit<32> dstAddr;
    }
    
    
    
    // ****************************************************************************** //
    // ************************* S T R U C T U R E S  ******************************* //
    // ****************************************************************************** //
    
    // header structure
    struct headers {
        ethernet_t ethernet;
        //MODIFIED
        ipv4_t ipv4;
    }
    
    struct smartnic_metadata {
        bit<64> timestamp_ns;    // 64b timestamp (in nanoseconds). Set at packet arrival time.
        bit<16> pid;             // 16b packet id used by platform (READ ONLY - DO NOT EDIT).
        bit<4>  ingress_port;    // 4b ingress port
                                 // (0:CMAC0, 1:CMAC1, 2:PF0_VF2, 3:PF1_VF2, 4:PF0_VF1, 5:PF1_VF1, 6:PF0_VF0, 7:PF1_VF0, 8:PF0, 9:PF1)
        bit<2>  egress_port;     // 2b egress port (0:PORT0, 1:PORT1, 2:HOST, 3:LOOPBACK).
        bit<1>  truncate_enable; // 1b set to 1 to enable truncation of egress packet to 'truncate_length'.
        bit<16> truncate_length; // 16b set to desired length of egress packet (used when 'truncate_enable' == 1).
        bit<1>  rss_enable;      // 1b set to 1 to override open-nic-shell rss hash result with 'rss_entropy' value.
        bit<12> rss_entropy;     // 12b set to rss_entropy hash value (used for open-nic-shell qdma qid selection).
        bit<4>  drop_reason;     // reserved (tied to 0).
        bit<32> scratch;         // reserved (tied to 0).
    }
    
    // ****************************************************************************** //
    // *************************** P A R S E R  ************************************* //
    // ****************************************************************************** //
    
    parser ParserImpl( packet_in packet,
                       out headers hdr,
                       inout smartnic_metadata sn_meta,
                       inout standard_metadata_t smeta) {
        state start {
            transition parse_ethernet;
        }
    
        //MODIFIED
        state parse_ethernet {
            packet.extract(hdr.ethernet);
            transition select(hdr.ethernet.etherType) {
                0x0800: parse_ipv4;
                default: accept;
            }
        }
    
        state parse_ipv4 {
            packet.extract(hdr.ipv4);
            transition accept;
        }
    }
    
    // ****************************************************************************** //
    // **************************  P R O C E S S I N G   **************************** //
    // ****************************************************************************** //
    
    control MatchActionImpl( inout headers hdr,
                             inout smartnic_metadata sn_meta,
                             inout standard_metadata_t smeta) {
    
        action forwardPacket(bit<2> dest_port) {
            sn_meta.egress_port = dest_port;
        }
        
        action dropPacket() {
            smeta.drop = 1;
        }
    
        table forward {
            key     = { hdr.ethernet.dstAddr : lpm; }
            actions = { forwardPacket; 
                        dropPacket;
                        NoAction; }
            size    = 128;
            num_masks = 8;
            default_action = NoAction;
        }
    
        apply {
            if (smeta.parser_error != error.NoError) {
                dropPacket();
                return;
            }
            //MODIFIED
            if (hdr.ipv4.isValid()) {
                if (hdr.ipv4.ttl == 1) {
                    dropPacket();
                    return;
                } else {
                    hdr.ipv4.ttl = hdr.ipv4.ttl - 1;
                }
            }
            if (hdr.ethernet.isValid()) {
                sn_meta.rss_entropy = 12w0;
                sn_meta.rss_enable = 1w0;
                forward.apply();
            }
            else
                dropPacket();
        }
    }
    
    // ****************************************************************************** //
    // ***************************  D E P A R S E R  ******************************** //
    // ****************************************************************************** //
    
    control DeparserImpl( packet_out packet,
                          in headers hdr,
                          inout smartnic_metadata sn_meta,
                          inout standard_metadata_t smeta) {
        apply {
            packet.emit(hdr.ethernet);
            //MODIFIED
            packet.emit(hdr.ipv4);
        }
    }
    
    // ****************************************************************************** //
    // *******************************  M A I N  ************************************ //
    // ****************************************************************************** //
    
    XilinxPipeline(
        ParserImpl(), 
        MatchActionImpl(), 
        DeparserImpl()
    ) main;



```bash
source /tools/Xilinx/Vivado/2023.1/settings64.sh
export XILINXD_LICENSE_FILE=2100@xilinxd.xilinx-dev
```


```bash
cd sim
head test-fwd-p0/packets_in.user
```

    % Packet 1 (188 bytes)
    % Ethernet header:[ DstMAC=111111111111 SrcMAC=aaaaaaaaaaaa EtherType=0800 ]
    00 80 c2 00 00 00 aa aa aa aa aa aa 08 00
    % IPv4 header:[ Version=4 HdrLen=f DSCP=32 ECN=1 Length=00ae ID=50fa Flags=0 Fragment=0000 TTL=b3 Protocol=11 Checksum=d386 SrcAddr=fd5f0bc8 DstAddr=9aaa2010 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionEND=00 ]
    4f c9 00 ae 50 fa 00 00 b3 11 d3 86 fd 5f 0b c8 9a aa 20 10 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 00 
    % UDP header:[ SrcPort=2411 DstPort=6cc1 Length=0072 Checksum=99c3 ]
    24 11 6c c1 00 72 99 c3 
    % Payload
    79 72 5b cf c6 6e 5f fa b9 2f 38 cb 50 39 30 91 91 98 27 88 ed fa be 03 08 b9 bf f3 d0 e9 c0 01 5b 13 ac 7e 62 9a 26 36 06 ae 5d 96 ec 71 2d a8 66 be 46 02 65 89 87 66 c1 9b ca c2 4b 89 19 ba 0e ed f4 af 84 d3 e4 3c 34 d6 da 25 1d 8f ad ff af e1 bb b9 37 4f 64 4b 06 a2 0e e9 36 5d c1 87 11 26 20 a6 0f c9 5b e5 4f fd 
    ;



```bash
cp -r test-fwd-p0 test-fwd-p1
sed -i 's/^P4BM_DIRS = test-fwd-p0$/P4BM_DIRS = test-fwd-p0 test-fwd-p1/' Makefile
sed -i 's/^\(P4BM_DIR = test-fwd-p0\)/# \1/' Makefile
```


```bash
env | grep XILINXD_LICENSE_FILE
```

    XILINXD_LICENSE_FILE=2100@xilinxd.xilinx-dev



```bash
make
ls test-fwd-p1
```

    for d in test-fwd-p0 test-fwd-p1; do make P4BM_DIR=$d sim || exit 1; done
    make[1]: Entering directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    p4c-vitisnet ../p4_only.p4 -o ../p4_only.json
    rlwrap: warning: your $TERM is 'xterm' but rlwrap couldn't find it in the terminfo database. Expect some problems.
                                                                                    
    (cd test-fwd-p0 && wc cli_commands.txt > /dev/null)
    (cd test-fwd-p0 && run-p4bm-vitisnet -l cli_commands.txt \
                                                 -j ../../p4_only.json -s cli_commands.txt )
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    make[1]: Leaving directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    make[1]: Entering directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    (cd test-fwd-p1 && wc cli_commands.txt > /dev/null)
    (cd test-fwd-p1 && run-p4bm-vitisnet -l cli_commands.txt \
                                                 -j ../../p4_only.json -s cli_commands.txt )
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    make[1]: Leaving directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    cli_commands.txt	    expected	     packets_out.meta
    cli_commands.txt_cli.txt    packets_in.meta  packets_out.user
    cli_commands.txt_model.txt  packets_in.user  vitisnetp4_thrift.log



```bash
head test-fwd-p1/packets_in.user
head test-fwd-p1/packets_out.user
```

    % Packet 1 (188 bytes)
    % Ethernet header:[ DstMAC=111111111111 SrcMAC=aaaaaaaaaaaa EtherType=0800 ]
    00 80 c2 00 00 00 aa aa aa aa aa aa 08 00
    % IPv4 header:[ Version=4 HdrLen=f DSCP=32 ECN=1 Length=00ae ID=50fa Flags=0 Fragment=0000 TTL=b3 Protocol=11 Checksum=d386 SrcAddr=fd5f0bc8 DstAddr=9aaa2010 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionNOP=01 OptionEND=00 ]
    4f c9 00 ae 50 fa 00 00 b3 11 d3 86 fd 5f 0b c8 9a aa 20 10 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 00 
    % UDP header:[ SrcPort=2411 DstPort=6cc1 Length=0072 Checksum=99c3 ]
    24 11 6c c1 00 72 99 c3 
    % Payload
    79 72 5b cf c6 6e 5f fa b9 2f 38 cb 50 39 30 91 91 98 27 88 ed fa be 03 08 b9 bf f3 d0 e9 c0 01 5b 13 ac 7e 62 9a 26 36 06 ae 5d 96 ec 71 2d a8 66 be 46 02 65 89 87 66 c1 9b ca c2 4b 89 19 ba 0e ed f4 af 84 d3 e4 3c 34 d6 da 25 1d 8f ad ff af e1 bb b9 37 4f 64 4b 06 a2 0e e9 36 5d c1 87 11 26 20 a6 0f c9 5b e5 4f fd 
    ;
    % Packet 1 (188 bytes)
    00 80 c2 00 00 00 aa aa aa aa aa aa 08 00 4f c9
    00 ae 50 fa 00 00 b2 11 d3 86 fd 5f 0b c8 9a aa
    20 10 01 01 01 01 01 01 01 01 01 01 01 01 01 01
    01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01
    01 01 01 01 01 01 01 01 01 00 24 11 6c c1 00 72
    99 c3 79 72 5b cf c6 6e 5f fa b9 2f 38 cb 50 39
    30 91 91 98 27 88 ed fa be 03 08 b9 bf f3 d0 e9
    c0 01 5b 13 ac 7e 62 9a 26 36 06 ae 5d 96 ec 71
    2d a8 66 be 46 02 65 89 87 66 c1 9b ca c2 4b 89



```bash
python3 - <<EOF
from scapy.all import Ether, IP, wrpcap

# Generate 10 IPv4 packets with TTL values 1 to 10
packets = [Ether() / IP(dst="192.168.1.1", ttl=ttl) for ttl in range(1, 11)]

# Save the packets to the specified pcap file
wrpcap("test-fwd-p1/packets_in.pcap", packets)

print("PCAP file 'test-fwd-p1/packets_in.pcap' created with 10 Ethernet+IPv4 packets, TTLs 1-10")
EOF
```

    WARNING: MAC address to reach destination not found. Using broadcast.
    WARNING: MAC address to reach destination not found. Using broadcast.
    WARNING: more MAC address to reach destination not found. Using broadcast.
    WARNING: MAC address to reach destination not found. Using broadcast.
    WARNING: MAC address to reach destination not found. Using broadcast.
    WARNING: more MAC address to reach destination not found. Using broadcast.
    WARNING: MAC address to reach destination not found. Using broadcast.
    WARNING: MAC address to reach destination not found. Using broadcast.
    WARNING: more MAC address to reach destination not found. Using broadcast.
    WARNING: MAC address to reach destination not found. Using broadcast.
    PCAP file 'test-fwd-p1/packets_in.pcap' created with 10 Ethernet+IPv4 packets, TTLs 1-10



```bash
make clean
rm -rf test-fwd-p1/packets_in.user
ls test-fwd-p1
```

    for d in test-fwd-p0 test-fwd-p1; do make P4BM_DIR=$d cleansim; done
    make[1]: Entering directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    cd test-fwd-p0 && rm -f cli_commands.txt_cli.txt cli_commands.txt_model.txt packets_out.meta packets_out.pcap packets_out.user
    make[1]: Leaving directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    make[1]: Entering directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    cd test-fwd-p1 && rm -f cli_commands.txt_cli.txt cli_commands.txt_model.txt packets_out.meta packets_out.pcap packets_out.user
    make[1]: Leaving directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    rm -f ../p4_only.json
    cli_commands.txt  packets_in.meta  vitisnetp4_thrift.log
    expected	  packets_in.pcap



```bash
tshark -r test-fwd-p1/packets_in.pcap -T tabs
```

        1	  0.000000	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        2	  0.000188	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        3	  0.000289	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        4	  0.000387	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        5	  0.000485	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        6	  0.000581	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        7	  0.000678	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        8	  0.000776	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        9	  0.000874	     0.0.0.0	→	192.168.1.1 	IPv4	34	
       10	  0.000977	     0.0.0.0	→	192.168.1.1 	IPv4	34	



```bash
make
tshark -r test-fwd-p1/packets_in.pcap -T tabs
tshark -r test-fwd-p1/packets_in.pcap -T fields -e ip.ttl
```

    for d in test-fwd-p0 test-fwd-p1; do make P4BM_DIR=$d sim || exit 1; done
    make[1]: Entering directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    p4c-vitisnet ../p4_only.p4 -o ../p4_only.json
    rlwrap: warning: your $TERM is 'xterm' but rlwrap couldn't find it in the terminfo database. Expect some problems.
                                                                                    
    (cd test-fwd-p0 && wc cli_commands.txt > /dev/null)
    (cd test-fwd-p0 && run-p4bm-vitisnet -l cli_commands.txt \
                                                 -j ../../p4_only.json -s cli_commands.txt )
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    make[1]: Leaving directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    make[1]: Entering directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
    (cd test-fwd-p1 && wc cli_commands.txt > /dev/null)
    (cd test-fwd-p1 && run-p4bm-vitisnet -l cli_commands.txt \
                                                 -j ../../p4_only.json -s cli_commands.txt )
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    WARNING: /tools/Xilinx/Vivado/2023.1/tps/lnx64/jre does not exist.
    make[1]: Leaving directory '/home/coder/esnet-smartnic/esnet-smartnic-hw/examples/p4_only/p4/sim'
        1	  0.000000	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        2	  0.000188	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        3	  0.000289	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        4	  0.000387	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        5	  0.000485	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        6	  0.000581	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        7	  0.000678	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        8	  0.000776	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        9	  0.000874	     0.0.0.0	→	192.168.1.1 	IPv4	34	
       10	  0.000977	     0.0.0.0	→	192.168.1.1 	IPv4	34	
    1
    2
    3
    4
    5
    6
    7
    8
    9
    10



```bash
tshark -r test-fwd-p1/packets_out.pcap -T tabs
tshark -r test-fwd-p1/packets_out.pcap -T fields -e ip.ttl
```

        1	  0.000000	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        2	  0.000471	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        3	  0.000922	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        4	  0.001360	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        5	  0.001793	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        6	  0.002227	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        7	  0.002661	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        8	  0.003085	     0.0.0.0	→	192.168.1.1 	IPv4	34	
        9	  0.003499	     0.0.0.0	→	192.168.1.1 	IPv4	34	
    1
    2
    3
    4
    5
    6
    7
    8
    9


### Step 4: Control Plane Table Entries


```bash
cat test-fwd-p1/packets_in.meta
```

    smartnic_metadata.timestamp_ns=1 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=2 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=3 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=4 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=5 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=6 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=7 smartnic_metadata.egress_port=3;
    smartnic_metadata.timestamp_ns=8 smartnic_metadata.egress_port=3;



```bash
cat test-fwd-p1/packets_out.meta
```

    smartnic_metadata.timestamp_ns=0000000000000002 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000003 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000004 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000005 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000006 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000007 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000008 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=03 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000000 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=00 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;
    smartnic_metadata.timestamp_ns=0000000000000000 smartnic_metadata.pid=0000 smartnic_metadata.ingress_port=00 smartnic_metadata.egress_port=00 smartnic_metadata.truncate_enable=00 smartnic_metadata.truncate_length=0000 smartnic_metadata.rss_enable=00 smartnic_metadata.rss_entropy=0000 smartnic_metadata.drop_reason=00 smartnic_metadata.scratch=00000000 ;


---
---
---
Now we reach the end of writing a P4 program and testing it against custom PCAP files.
In the next notebook, we will be building the artifacts from the P4 logic.

---
This notebook is part 1 out of 3 in the **ESnet SmartNIC Tutorial on NRP** series.

This was last modified on March 4th, 2025.

For any inquiries, questions, feedback, please contact: mfsada@ucsd.edu
