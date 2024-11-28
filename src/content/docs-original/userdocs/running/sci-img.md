This page is mostly related to our [Official JupyterHub](https://jupyterhub-west.nrp-nautilus.io), but all images can be also used in other pods deployed directly on the cluster.

There are two main projects providing the stack of images:

[Docker Stack](https://jupyter-docker-stacks.readthedocs.io/en/latest/using/selecting.html)

[B-Data](https://gitlab.b-data.ch/jupyterlab)

Both projects now support CUDA and ARM. Docker stack only has CUDA in TensorFlow and PyTorch variants.

**The list of NRP-provided images and registry links are available in our [GitLab registry](https://gitlab.nrp-nautilus.io/nrp/scientific-images)**:

The **NRP image with additional libraries** (gitlab-registry.nrp-nautilus.io/nrp/scientific-images/python) is based on Docker Stack TensorFlow with the addition of:

```
    torch
    torchvision
    torchaudio
    'jax[cuda12]'
    flax
    keras
    keras-tuner
    'tensorflow-probability[tf]'
    fastai
    'jupyter-ai[all]'
    astropy
    bowtie
    imutils
    nbgitpuller
    opencv-python
    psycopg2-binary
    pydot
    requests
    visualdl
    git+https://github.com/veeresht/CommPy.git
    bash_kernel
    'code-server==4.10.0'
    'jupyter-vscode-proxy'
    'ghostscript'
    'graphviz'
    'rasterio'
    'gdal'
    'libgdal-arrow-parquet'
```

We can add more libraries to this image by requesting in [Matrix](/userdocs/start/contact/).

The Desktop image has X Window system installed and you can launch the GUI interface in Jupyter with this image. It's based on Minimal stack.
