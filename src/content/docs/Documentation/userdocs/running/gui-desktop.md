---
title: GUI Desktop
description: 'Deploy a browser-based GUI desktop pod in your own namespace; Coder and JupyterHub are the preferred routes.'
---

**Note that Coder (<https://coder.nrp-nautilus.io>) and JupyterHub West (<https://jupyterhub-west.nrp-nautilus.io/>) are currently the preferred methods to deploy the GUI Desktop containers. Use the below instructions if you want to deploy in your own namespace.**

The default login for Selkies in the browser is the username `ubuntu` with the password `mypasswd`, or whatever `PASSWD` is set to.

With [docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop) or [docker-selkies-egl-desktop](https://github.com/selkies-project/docker-selkies-egl-desktop), users may start a KDE Plasma desktop accelerated with NVIDIA GPUs, streamed from the NRP to your web browser by [Selkies](https://github.com/selkies-project/selkies). Both containers support OpenGL and Vulkan, and both come with Firefox, Google Chrome, LibreOffice, VLC, Steam, Wine, and an apps panel in the Selkies dashboard that installs portable applications into the home directory.

[docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop) runs an X.Org server of its own on the GPU with the NVIDIA driver, so OpenGL and Vulkan reach applications through the vendor's own driver with nothing translating in between. It provides the best performance and is generally recommended when the pod has a GPU to itself, which a `nvidia.com/gpu` request gives it. The first start takes a minute longer while the container fetches the X server modules from the NVIDIA driver installer matching the node's driver. A GPU without a display device, such as the Tesla P100, is served on the Selkies base container's framebuffer server instead, which the container log says.

[docker-selkies-egl-desktop](https://github.com/selkies-project/docker-selkies-egl-desktop) reaches the GPU through EGL without an X.Org server, on the display servers of the Selkies base container. It is versatile in various environments: it also runs without a GPU (in software, with the x264 encoder), sharing a GPU with multiple containers is possible, the desktop runs on a Wayland session with `SELKIES_WAYLAND=true`, and it is also possible to be used in HPC clusters with [Apptainer](https://apptainer.org) as described in the [Selkies documentation](https://docs.selkies.io/latest/start/#apptainer).

Both images are built on Ubuntu 26.04 and published with the tags `26.04` and `latest` for the current build, and persistent tags in the format `26.04-20260101010101` for a specific build.

**Support is available in [#ue4research:matrix.nrp-nautilus.io](https://matrix-to.nrp-nautilus.io/#/#ue4research:matrix.nrp-nautilus.io) (use [this link](https://matrix.to/#/#ue4research:matrix.nrp-nautilus.io) if you use a matrix.org account), just ask your questions there.** Upstream support for the containers is on the Selkies [Discord](https://discord.gg/wDNGDeSW5F) and the GitHub Discussions of each repository.

Please give the repositories a star!

## Streaming

Selkies streams over WebSockets by default, which needs nothing but the web port that the Ingress below exposes. The WebRTC transport is selected with `SELKIES_MODE` or switched to from the web interface, and uses the NRP TURN server configured in the reference configurations below.

The video encoder, video bitrate, frame rate, audio bitrate, and UI scaling are chosen from the web interface, so the reference configurations leave them alone. The default encoder `h264enc` encodes on the GPU with NVENC when the pod has a GPU and with x264 on the CPU otherwise, so nothing has to be set for hardware encoding; `h265enc`, `vp8enc`, `vp9enc`, and `av1enc` run on the GPU where it carries the codec in the same way, `h264enc-striped` and `jpeg` are CPU encoders, and a browser that cannot decode the chosen codec steps through the ones it can. Do not set `SELKIES_ENCODER`: a single value locks the encoder to that codec and takes the choice away from the web interface.

### TURN Server

The WebRTC transport relays through the NRP TURN server, `turn.nrp-nautilus.io`. Since the right TURN server closest to you leads to the lowest latency, use the command `ping turn.nrp-nautilus.io` on your client (install `iputils-ping` when using Linux if the `ping` command does not work) to check that your DNS is correctly configured.

If the latency is considerably high (over 60-70 milliseconds) or the TURN server host node location is suspiciously far from both you and the Kubernetes node, consider changing your client DNS server to `8.8.8.8` and `8.8.4.4` or the DNS over HTTPS / DNS over TLS options [provided by Google](https://developers.google.com/speed/public-dns/docs/using). [CloudFlare's DNS](https://1.1.1.1/dns/) server (addresses `1.1.1.1` and `1.0.0.1`) may show issues locating the nearest relay server, which is crucial for performance.

The reference configurations below take their TURN credentials from the TURN REST API credential endpoint `http://turn-rest.nrp-nautilus.io` (accessible only to Nautilus pods, username and password are valid for 24 hours, renewed every time `http://turn-rest.nrp-nautilus.io` is probed). If you are using the Nautilus coTURN server for other WebRTC workloads, use the same endpoint, and also add the below configuration (change DNS server as adequate) in your Kubernetes `.yml` configuration to minimize TURN server latency:

```yaml
dnsPolicy: None
dnsConfig:
  nameservers:
    - 8.8.8.8
    - 8.8.4.4
```

## Usage

The below is a reference configuration `xgl.yml` for [docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xgl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: xgl
  template:
    metadata:
      labels:
        app: xgl
    spec:
      hostname: xgl
      containers:
        - name: xgl
          # Tags: `latest` or `26.04` for the current Ubuntu 26.04 build, and a persistent build such as `26.04-20260101010101`
          image: ghcr.io/selkies-project/selkies-glx-desktop:latest
          env:
            - name: TZ
              value: 'UTC'
            # Password of the container Linux user, and of the web login when `SELKIES_BASIC_AUTH_PASSWORD` is not set; choose either `value:` or `secretKeyRef:` but not both at the same time
            - name: PASSWD
              # value: 'mypasswd'
              valueFrom:
                secretKeyRef:
                  name: my-pass
                  key: my-pass
            # The X server's initial mode, replaced by the client's size once it connects (dynamic resizing is on by default); the size a manual resolution locks the stream to and the frame rate the stream starts at take its place where set
            - name: DISPLAY_SIZEW
              value: '1920'
            - name: DISPLAY_SIZEH
              value: '1080'
            - name: DISPLAY_REFRESH
              value: '60'
            # - name: SELKIES_MANUAL_WIDTH
            #   value: '1920'
            # - name: SELKIES_MANUAL_HEIGHT
            #   value: '1080'
            # - name: SELKIES_FRAMERATE
            #   value: '60'
            # The video port the NVIDIA driver reports a monitor on: keep `DFP` on datacenter GPUs, use an empty `DP-*` port on consumer and professional GPUs for resolutions above 2560 x 1600
            - name: VIDEO_PORT
              value: 'DFP'
            ###
            # Selkies settings, see `selkies --help` and https://github.com/selkies-project/selkies/blob/main/docs/settings.md for the rest
            ###
            # Transport: WebSockets by default, `webrtc` uses the NRP TURN server configured below; both can be switched from the web interface
            # - name: SELKIES_MODE
            #   value: 'webrtc'
            # The web login, on by default: `ubuntu` and `PASSWD` unless set here
            - name: SELKIES_ENABLE_BASIC_AUTH
              value: 'true'
            # - name: SELKIES_BASIC_AUTH_USER
            #   value: 'ubuntu'
            # - name: SELKIES_BASIC_AUTH_PASSWORD
            #   valueFrom:
            #     secretKeyRef:
            #       name: my-pass
            #       key: my-pass
            # The Ingress terminates TLS, so the container serves plain HTTP; `true` serves HTTPS on a certificate the container mints per install, or on one named with `SELKIES_HTTPS_CERT` and `SELKIES_HTTPS_KEY`
            - name: SELKIES_ENABLE_HTTPS
              value: 'false'
            # NRP TURN REST API for the WebRTC transport, which replaces every other TURN setting
            - name: SELKIES_TURN_REST_URI
              value: 'http://turn-rest.nrp-nautilus.io'
            # Change to `tcp` if the UDP protocol is throttled or blocked in your client network
            - name: SELKIES_TURN_PROTOCOL
              value: 'udp'
            # TURN over TLS, which the NRP TURN server supports, if your network inspects the WebRTC or STUN/TURN protocols
            - name: SELKIES_TURN_TLS
              value: 'false'
          stdin: true
          tty: true
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          resources:
            limits:
              memory: 64Gi
              cpu: '16'
              nvidia.com/gpu: 1
            requests:
              memory: 100Mi
              cpu: 100m
              nvidia.com/gpu: 1
          volumeMounts:
            # The browsers inside the desktop crash on the default shared memory
            - mountPath: /dev/shm
              name: dshm
            - mountPath: /cache
              name: xgl-cache-vol
            - mountPath: /home/ubuntu
              name: xgl-root-vol
      # Steers the TURN server's location-aware DNS for the WebRTC transport; remove to keep the cluster's DNS
      dnsPolicy: None
      dnsConfig:
        nameservers:
          - 8.8.8.8
          - 8.8.4.4
      volumes:
        - name: dshm
          emptyDir:
            medium: Memory
        - name: xgl-cache-vol
          emptyDir: {}
          # persistentVolumeClaim:
          #   claimName: xgl-cache-vol
        - name: xgl-root-vol
          emptyDir: {}
          # persistentVolumeClaim:
          #   claimName: xgl-root-vol
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: topology.kubernetes.io/zone
                    operator: NotIn
                    values:
                      - ucsd-suncave
                  # - key: topology.kubernetes.io/region
                  #   operator: In
                  #   values:
                  #     - us-west
```

The below is a reference configuration `egl.yml` for [docker-selkies-egl-desktop](https://github.com/selkies-project/docker-selkies-egl-desktop):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: egl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: egl
  template:
    metadata:
      labels:
        app: egl
    spec:
      hostname: egl
      containers:
        - name: egl
          # Tags: `latest` or `26.04` for the current Ubuntu 26.04 build, and a persistent build such as `26.04-20260101010101`
          image: ghcr.io/selkies-project/selkies-egl-desktop:latest
          env:
            - name: TZ
              value: 'UTC'
            # Password of the container Linux user, and of the web login when `SELKIES_BASIC_AUTH_PASSWORD` is not set; choose either `value:` or `secretKeyRef:` but not both at the same time
            - name: PASSWD
              # value: 'mypasswd'
              valueFrom:
                secretKeyRef:
                  name: my-pass
                  key: my-pass
            ###
            # Selkies settings, see `selkies --help` and https://github.com/selkies-project/selkies/blob/main/docs/settings.md for the rest
            ###
            # Transport: WebSockets by default, `webrtc` uses the NRP TURN server configured below; both can be switched from the web interface
            # - name: SELKIES_MODE
            #   value: 'webrtc'
            # `true` runs the desktop on the headless Wayland backend (nested kwin) instead of the X11 framebuffer server
            - name: SELKIES_WAYLAND
              value: 'false'
            # The size the X11 desktop has until a client connects and replaces it with its own (dynamic resizing is on by default); the size a manual resolution locks the stream to takes its place where set
            # - name: DISPLAY_SIZEW
            #   value: '1920'
            # - name: DISPLAY_SIZEH
            #   value: '1080'
            # - name: SELKIES_MANUAL_WIDTH
            #   value: '1920'
            # - name: SELKIES_MANUAL_HEIGHT
            #   value: '1080'
            # The web login, on by default: `ubuntu` and `PASSWD` unless set here
            - name: SELKIES_ENABLE_BASIC_AUTH
              value: 'true'
            # - name: SELKIES_BASIC_AUTH_USER
            #   value: 'ubuntu'
            # - name: SELKIES_BASIC_AUTH_PASSWORD
            #   valueFrom:
            #     secretKeyRef:
            #       name: my-pass
            #       key: my-pass
            # The Ingress terminates TLS, so the container serves plain HTTP; `true` serves HTTPS on a certificate the container mints per install, or on one named with `SELKIES_HTTPS_CERT` and `SELKIES_HTTPS_KEY`
            - name: SELKIES_ENABLE_HTTPS
              value: 'false'
            # NRP TURN REST API for the WebRTC transport, which replaces every other TURN setting
            - name: SELKIES_TURN_REST_URI
              value: 'http://turn-rest.nrp-nautilus.io'
            # Change to `tcp` if the UDP protocol is throttled or blocked in your client network
            - name: SELKIES_TURN_PROTOCOL
              value: 'udp'
            # TURN over TLS, which the NRP TURN server supports, if your network inspects the WebRTC or STUN/TURN protocols
            - name: SELKIES_TURN_TLS
              value: 'false'
          stdin: true
          tty: true
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          resources:
            limits:
              memory: 64Gi
              cpu: '16'
              # Remove the two `nvidia.com/gpu` lines to run the desktop without a GPU
              nvidia.com/gpu: 1
            requests:
              memory: 100Mi
              cpu: 100m
              nvidia.com/gpu: 1
          volumeMounts:
            # The browsers inside the desktop crash on the default shared memory
            - mountPath: /dev/shm
              name: dshm
            - mountPath: /cache
              name: egl-cache-vol
            - mountPath: /home/ubuntu
              name: egl-root-vol
      # Steers the TURN server's location-aware DNS for the WebRTC transport; remove to keep the cluster's DNS
      dnsPolicy: None
      dnsConfig:
        nameservers:
          - 8.8.8.8
          - 8.8.4.4
      volumes:
        - name: dshm
          emptyDir:
            medium: Memory
        - name: egl-cache-vol
          emptyDir: {}
          # persistentVolumeClaim:
          #   claimName: egl-cache-vol
        - name: egl-root-vol
          emptyDir: {}
          # persistentVolumeClaim:
          #   claimName: egl-root-vol
      # affinity:
      #   nodeAffinity:
      #     requiredDuringSchedulingIgnoredDuringExecution:
      #       nodeSelectorTerms:
      #         - matchExpressions:
      #             - key: topology.kubernetes.io/region
      #               operator: In
      #               values:
      #                 - us-west
```

### Customization

In one entry, `value:` and `valueFrom:` must not exist at the same time.

**Comment out `emptyDir: {}` and uncomment `persistentVolumeClaim:`, then change `claimName:` to the name of your PersistentVolumeClaim after uncommenting.**

`rook-ceph-block-[region]` or `linstor-[region]` are the recommended StorageClasses to be mounted to `/home/ubuntu`. However, if their performances are slow for sequential read/writes, you may use `rook-cephfs-[region]` but **NEVER MOUNT TO `/home/ubuntu`**. Instead mount to a different directory such as `/home/ubuntu/persistent` or `/mnt/persistent`. Refer to the [Storage](/documentation/userdocs/storage/intro/) section for more information.

To run on a specific type of GPU, add the node affinity described in [GPU pods](/documentation/userdocs/running/gpu-pods/) to the reference configuration.

`DISPLAY_SIZEW` and `DISPLAY_SIZEH` set the size the desktop has until your browser connects, and dynamic resizing then gives it the size of your browser window; `DISPLAY_REFRESH` sets the refresh rate the X server of [docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop) starts at. Where a Selkies setting names the same thing, the Selkies setting takes their place, read exactly as Selkies reads it: `SELKIES_MANUAL_WIDTH` and `SELKIES_MANUAL_HEIGHT` lock the desktop to a fixed size instead of following your browser window, and `SELKIES_FRAMERATE` sets the frame rate the stream starts at, which that X server then starts at too. There is no color depth setting: the desktop is always 24-bit, the depth Selkies captures.

The two settings below apply to the WebRTC transport:

**If your client network blocks (likely your campus network) or throttles (likely your home network restricted by your Internet Service Provider) the UDP protocol, change the environment variable `SELKIES_TURN_PROTOCOL` to `tcp`.**

**If your network or country enforces [Deep Packet Inspection](https://en.wikipedia.org/wiki/Deep_packet_inspection) to the WebRTC or STUN/TURN protocols, set `SELKIES_TURN_TLS` to `true`.**

Check the `README.md` of both GitHub repositories [docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop) or [docker-selkies-egl-desktop](https://github.com/selkies-project/docker-selkies-egl-desktop), as well as [Selkies](https://github.com/selkies-project/selkies) and its [settings reference](https://github.com/selkies-project/selkies/blob/main/docs/settings.md), for more details on configuration customization. Please give the repositories a star too!

### Secret Generation

Replace `YOUR_PASSWORD` with the password for the container that you intend to use. Replace `my-name` and `my-key` with the name of the secret you want to use for your password. If you want to use a different name and key, make sure to update the above `xgl.yml` or `egl.yml` files as well as the below command.

After customizing, run the below command in edited form:

```bash
kubectl create secret generic my-name --from-literal=my-key=YOUR_PASSWORD
```

The above command should be used in conjunction to the below `xgl.yml`/`egl.yml` configuration (edit as adequate):

```yaml
env:
  - name: PASSWD
    valueFrom:
      secretKeyRef:
        name: my-name
        key: my-key
```

### Container Start

After saving and editing the reference configurations, run either of these commands to start the container depending on the type of your container:

```bash
kubectl create -f xgl.yml
```

```bash
kubectl create -f egl.yml
```

## Exposing the Container

The below reference configuration `xgl-ingress.yml` is to expose your [docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop) container to the `*.nrp-nautilus.io` endpoint. Replace `YOUR_ENDPOINT` to the subdomain you want to use. The Ingress terminates TLS, which is why the reference configurations above set `SELKIES_ENABLE_HTTPS` to `false`.

Modify the configuration as in [Scaling and exposing](/documentation/userdocs/tutorial/basic2) to customize when there are multiple desktop deployments in a namespace. You can just use `kubectl port-forward deployment/xgl 8080:8080` and access `http://localhost:8080`, but this will likely have higher latency and subpar performance.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: xgl
spec:
  ingressClassName: haproxy
  rules:
    - host: YOUR_ENDPOINT.nrp-nautilus.io
      http:
        paths:
          - backend:
              service:
                name: xgl
                port:
                  name: http
            path: /
            pathType: ImplementationSpecific
  tls:
    - hosts:
        - YOUR_ENDPOINT.nrp-nautilus.io
---
apiVersion: v1
kind: Service
metadata:
  name: xgl
  labels:
    app: xgl
spec:
  selector:
    app: xgl
  ports:
    - name: http
      protocol: TCP
      port: 8080
```

If you are deploying multiple instances in one namespace, you must change `backend:`, `selector:`, and `labels:` to the name of your `Deployment` and `Service`.

Run the below command after saving the changed reference configuration file:

```bash
kubectl create -f xgl-ingress.yml
```

Access `YOUR_ENDPOINT.nrp-nautilus.io` with your web browser.

**The username is `ubuntu` and the password is the `my-name`/`my-key` secret that you have set.**

The below reference configuration `egl-ingress.yml` is to expose your [docker-selkies-egl-desktop](https://github.com/selkies-project/docker-selkies-egl-desktop) container to the `*.nrp-nautilus.io` endpoint. Replace `YOUR_ENDPOINT` to the subdomain you want to use.

Modify the configuration as in [Scaling and exposing](/documentation/userdocs/tutorial/basic2) to customize when there are multiple desktop deployments in a namespace. You can just use `kubectl port-forward deployment/egl 8080:8080` and access `http://localhost:8080`, but this will likely have higher latency and subpar performance.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: egl
spec:
  ingressClassName: haproxy
  rules:
    - host: YOUR_ENDPOINT.nrp-nautilus.io
      http:
        paths:
          - backend:
              service:
                name: egl
                port:
                  name: http
            path: /
            pathType: ImplementationSpecific
  tls:
    - hosts:
        - YOUR_ENDPOINT.nrp-nautilus.io
---
apiVersion: v1
kind: Service
metadata:
  name: egl
  labels:
    app: egl
spec:
  selector:
    app: egl
  ports:
    - name: http
      protocol: TCP
      port: 8080
```

If you are deploying multiple instances in one namespace, you must change `backend:`, `selector:`, and `labels:` to the name of your `Deployment` and `Service`.

Run the below command after saving the changed reference configuration file:

```bash
kubectl create -f egl-ingress.yml
```

Access `YOUR_ENDPOINT.nrp-nautilus.io` with your web browser.

**The username is `ubuntu` and the password is the `my-name`/`my-key` secret that you have set.**

## Reproducibility in Containers

Reproducibility is important, but the `latest` and `26.04` containers are consistently updated to fix various issues that arise and add improvements.

Because some changes are radical and change the fundamental structure of the container (normally when there is a dead-end with breaking issues or breakable upstream changes), they might break for your specific workflow.

Since you would not want to see your container break one day because there was a change, you could use persistent container tags (in the format `26.04-20260101010101`) with the time which a commit was made, if you want to base this container to build a customized container.

Because the containers have rolling releases, container versions are tagged by the time of which a commit has been made.

You may access such available persistent container tags in <https://github.com/selkies-project/docker-selkies-glx-desktop/pkgs/container/selkies-glx-desktop> and <https://github.com/selkies-project/docker-selkies-egl-desktop/pkgs/container/selkies-egl-desktop>.

It is **STRONGLY** recommended that you update the container tags frequently or use `apt-get upgrade` in every new build where this container has been based (but this may also break the container in a few edge cases), as many serious security vulnerabilities are frequently present in old containers. Conversely, completely fresh builds from the `Dockerfile` with older commits may and will break at any time and thus the latest `Dockerfile` should be used.

## Container Customization

You can import either `https://github.com/selkies-project/docker-selkies-glx-desktop.git` or `https://github.com/selkies-project/docker-selkies-egl-desktop.git` by importing with **Repo by URL** from <https://gitlab.nrp-nautilus.io/projects/new#import_project>.

Refer to [Building in GitLab](/documentation/userdocs/development/gitlab) on how you can change and build your own customized container. The containers are built on Ubuntu 26.04 only; `--build-arg="BASE_IMAGE=<image>"` after `/kaniko/executor` in the example `.gitlab-ci.yml` file names the Ubuntu 26.04 Selkies base container they build on.

**If you want to change the `Dockerfile`, you are recommended to use the original container as a base container and only replace the entrypoint scripts and the [s6](https://skarnet.org/software/s6/) service files under `/etc/service/`. This will keep you up to date with the latest updates. Use persistent container tags (such as `26.04-20260101010101`) to preserve a specific container build.**

Start with the below sample `Dockerfile` example and place your modified `container-entrypoint.sh` and s6 service files within the same empty directory or Git repository (switch the `FROM` line to `ghcr.io/selkies-project/selkies-glx-desktop:${DISTRIB_RELEASE}` or `ghcr.io/selkies-project/selkies-egl-desktop:${DISTRIB_RELEASE}`). The containers are rootless, so a layer that installs packages releases the setuid files that `dpkg` replaces, installs under `fakeroot`, and restores them, as in the commented lines:

```dockerfile
ARG DISTRIB_RELEASE=26.04
FROM ghcr.io/selkies-project/selkies-glx-desktop:${DISTRIB_RELEASE}
ARG DISTRIB_RELEASE

USER 0
SHELL ["/bin/sh", "-c"]

# Replace changed files
# Copy scripts and service definitions used to start the container with `--chown=1000:1000`
#COPY --chown=1000:1000 container-entrypoint.sh /etc/container-entrypoint.sh
#RUN chmod -f 755 /etc/container-entrypoint.sh
#COPY --chown=1000:1000 selkies-entrypoint.sh /etc/selkies-entrypoint.sh
#RUN chmod -f 755 /etc/selkies-entrypoint.sh
# Replace or add s6 services (one directory per service under /etc/service)
#COPY --chown=1000:1000 services/ /etc/service/
#RUN find /etc/service -name run -exec chmod -f 755 {} +

# Install packages
#RUN selkies-privileged-files release
#USER 1000
#SHELL ["/usr/bin/fakeroot", "--", "/bin/sh", "-c"]
#RUN apt-get update && apt-get install --no-install-recommends -y <packages>
#USER 0
#SHELL ["/bin/sh", "-c"]
#RUN selkies-privileged-files restore

USER 1000
ENV SHELL=/bin/bash
ENV USER=ubuntu
ENV HOME=/home/ubuntu
WORKDIR /home/ubuntu

EXPOSE 8080

ENTRYPOINT ["/etc/container-entrypoint.sh"]
```

## Conclusion

Again, please give [docker-selkies-glx-desktop](https://github.com/selkies-project/docker-selkies-glx-desktop), [docker-selkies-egl-desktop](https://github.com/selkies-project/docker-selkies-egl-desktop), and [Selkies](https://github.com/selkies-project/selkies) a star if the containers were useful to you.
