---
title: FPGA Flashing
description: A Cluster Admin Guide to flashing FPGAs
---


### PCIe availabiloity
This guide pertains to the AMD/Xilinx Alveo U55C FPGAs only.

As of the date of writing this guide, there are 32 U55Cs on PNRP Nodes at SDSC.

Current FPGA Spreadsheet: https://docs.google.com/spreadsheets/d/1EEr47qMKR0YmJZbTusKdmB1bbWZNE3dSQQEgNeJC4_w/edit?usp=sharing


The node will show each FPGA with lspci:
nautilus@node-1-4:~$ lspci | grep -i xil
df:00.0 Processing accelerators: Xilinx Corporation Device 505c
df:00.1 Processing accelerators: Xilinx Corporation Device 505d

It doesn't have to be a `Processing accelerator`, this is dependant on flashed shell.

lspci means valid hardware connection, but to be available on the device plugin, they need to be shown ready with the Xilinx Runtime Tools.


### USB JTAG availabiloity


In the spreadsheet, there is the USB JTAG composition. As of the date of writing this guide, SmartNIC nodes have JTAG for all of their cards, it is needed for the SmartNIC functionality, and XRT nodes have their JTAGs connected to node-2-10.

To query the JTAGs on any node:
sudo lsusb | grep -i "Ltd FT4232H Quad HS USB-UART/FIFO IC"

Each entry is one usb cable from one FPGA.

### Flashing


Note that the **ESnet SmartNIC** dedicated FPGAs, only need to show with lspci. They have a separate workflow and don't require occasional checking on flashing and health.



To examine FPGAs with XRT, use:
source /opt/xilinx/xrt/setup.sh
then:
xbmgmt examine

it should show:
Device(s) Present
|BDF             ||Shell                            ||Logic UUID                            ||Device ID         ||Device Ready*  |
|----------------||---------------------------------||--------------------------------------||------------------||---------------|
|[0000:e1:00.0]  ||xilinx_u55c_gen3x16_xdma_base_3  ||97088961-FEAE-DA91-52A2-1D9DFD63CCEF  ||mgmt(inst=57600)  ||Yes            |
|[0000:e2:00.0]  ||xilinx_u55c_gen3x16_xdma_base_3  ||97088961-FEAE-DA91-52A2-1D9DFD63CCEF  ||mgmt(inst=57856)  ||Yes            |


if it doesn't show devices, but they are visible with lspci, then you need to flash them with Vivado, which is available on the admin instance of Coder in an FPGA Flashing template: https://coder-dev.nrp-nautilus.io/login

Use this guide: https://adaptivesupport.amd.com/s/article/71757?language=en_US

