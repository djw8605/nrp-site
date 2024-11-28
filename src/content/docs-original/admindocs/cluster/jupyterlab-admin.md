# JupyterLab

## Adding a user to [JupyterLab](https://jupyterhub-west.nrp-nautilus.io)

When a user requests to access Nautilus's West [JupyterLab](https://jupyterhub-west.nrp-nautilus.io) service, first verify the user's email address used for CILogon. It should match the record of the user in [`https://portal.nrp-nautilus.io/users`](https://portal.nrp-nautilus.io/users). Add the email address to "allowed_users:" section in the [configuration template](https://gitlab.nrp-nautilus.io/prp/jupyterlab-west/-/blob/master/values.template.yaml) and commit the change.  
