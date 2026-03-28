---
title: Building in Gitlab
description: Building in Gitlab
---

To learn how to use containers and :fontawesome-brands-docker:Docker on your local machine, refer to our [tutorial section](/documentation/userdocs/tutorial/docker/).

We use our own installation of [:fontawesome-brands-gitlab:GitLab][1] for Source Code Management, [Continuous Integration automation][3], 
containers registry and other development lifecycle tasks. It fully uses Nautilus Cluster resources, which provides our users plenty of storage and fast builds.
All data from our GitLab except container images are backed up nightly to Google storage, which means there's almost zero chance that you might lose your code in our repository. 

#### Step 1: Create a Git repo
1. To use our GitLab installation, register at [https://gitlab.nrp-nautilus.io][4]
1. Use GitLab for storing your code like any git repository. Here's [GitLab basics guide][5].
1. [Create a new project][project] in your GitLab account 

#### Step 2: Use Containers Registry
What makes GitLab especially useful for kubernetes cluster in integration with
Containers Registry. You can store your containers directly in our cluster and
avoid slow downloads from [DockerHub][dockerhub] (although you're still free to do that as well).

If you wish to use our registry, in your <https://gitlab.nrp-nautilus.io> project go to `Deploy -> Container Registry` menu and read instructions on how to use one.

#### Step 3: Continuous Integration automation
To fully unleash the GitLab powers, introduce yourself to [Continuous Integration automation][3] and more advanced [DevOps article][6].

1. Create the `.gitlab-ci.yml` file in your project, see [Quick start guide][quickstart]. The runners are already configured.  
   There's a list of CI templates available for most common languages.
1. If you need to build your Dockerfile and create a container from it, adjust this `.gitlab-ci.yml` template (remove `--cache=true` if you don't need layer caching):

```yaml
image: ghcr.io/osscontainertools/kaniko:debug

stages:
- build-and-push

build-and-push-job:
  stage: build-and-push
  variables:
    GODEBUG: "http2client=0"
  script:
  - echo "{\"auths\":{\"$CI_REGISTRY\":{\"username\":\"$CI_REGISTRY_USER\",\"password\":\"$CI_REGISTRY_PASSWORD\"}}}" > /kaniko/.docker/config.json
  - /kaniko/executor --cache=true --push-retry=10 --context $CI_PROJECT_DIR --dockerfile $CI_PROJECT_DIR/Dockerfile --destination $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA --destination $CI_REGISTRY_IMAGE:latest
```

The above Kaniko builder [has severe speed problems pushing to GitLab](https://gitlab.com/gitlab-org/gitlab/-/issues/241996#note_1524123148), which is resolved by setting the environment variable `GODEBUG="http2client=0"`.

The below example is the variant for using Docker (as there is only one dedicated build server available, only use when image compatibility with the Docker builder is an important priority):

```yaml
image: docker:dind

default:
  tags:
  - docker
  before_script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  - docker buildx create --driver docker-container --bootstrap --use

stages:
- build-and-push

build-and-push-job:
  stage: build-and-push
  script:
  - cd $CI_PROJECT_DIR && docker buildx build -f Dockerfile --push --provenance=false --platform linux/amd64 -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA -t $CI_REGISTRY_IMAGE:latest .
```

   [More advanced example][portal_example]

1. Go to `CI / CD -> Jobs` tab to see in amazement your job running and image being uploaded to your registry. 
1. From the `Packages -> Containers Registry` tab get the URL of your image to be included in your pod definition:

```yaml
spec:
  containers:
  - name: my-container
    image: gitlab-registry.nrp-nautilus.io/<your_group>/<your_project>:<optional_tag>
```

#### Multiarch builds

Nautilus has several ARM64 nodes, which require a specifically build images to run on.

Refer to [Creating Multi-arch Container Manifests Using Kaniko and Manifest-tool](https://github.com/osscontainertools/kaniko/blob/main/README.md#creating-multi-arch-container-manifests-using-kaniko-and-manifest-tool) to create multiarch builds in Kaniko.

Docker can build images for multiple architectures and automatically create a manifest which will allow using the same image path on different architectures, provided by the buildx tool.

Here's the example of such CI definition:

```yaml
image: docker:dind

default:
  tags:
  - docker
  before_script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  - docker buildx create --driver docker-container --bootstrap --use

stages:
- build-and-push

build-and-push-job:
  stage: build-and-push
  script:
  - cd $CI_PROJECT_DIR && docker buildx build -f Dockerfile --push --provenance=false --platform linux/amd64,linux/arm64 -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA -t $CI_REGISTRY_IMAGE:latest .
```

## Build better containers

Make yourself familiar with [Docker containers best practices](https://www.docker.com/blog/intro-guide-to-dockerfile-best-practices).

Use [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build) when necessary.

## Use S3 to store large files collections and access those during builds

Refer to [S3 documentation](/documentation/userdocs/storage/ceph-s3/#using-s3-in-gitlab-ci).

## Other development information

Read [the Guide](https://guide.esciencecenter.nl) from the Netherlands eScience Center for best practices in developing academic code.

Also a [thesis on measuring container registry performance](https://atlarge-research.com/pdfs/Petar_Galic_Master_Thesis_14_12_2020.pdf).

[1]: https://about.gitlab.com/what-is-gitlab/
[3]: https://docs.gitlab.com/ee/ci/
[4]: https://gitlab.nrp-nautilus.io
[5]: https://docs.gitlab.com/ee/gitlab-basics/
[6]: https://about.gitlab.com/blog/2023/06/27/efficient-devsecops-workflows-with-rules-for-conditional-pipelines/
[dockerhub]: https://docs.docker.com/docker-hub/
[project]: https://docs.gitlab.com/ee/user/project/working_with_projects.html#create-a-project
[registry]: https://docs.gitlab.com/ee/user/project/container_registry.html
[quickstart]: https://docs.gitlab.com/ce/ci/quick_start/
[portal_example]: https://gitlab.nrp-nautilus.io/prp/k8s_portal/blob/master/.gitlab-ci.yml