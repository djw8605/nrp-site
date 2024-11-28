---
title: Managed LLM
---

## Public managed LLM API

We use the [LiteLLM](https://www.litellm.ai) LLM proxy to provide access to the LLMs we're running on nautilus.

You can start from logging to the [litellm UI](https://llm.nrp-nautilus.io/ui/) and requesting in [Matrix](/userdocs/start/contact/) to be assigned to a Team. Once you're a member of a team, you can create the tokens and access the models.

To create a token, open the Virtual Keys tab and create a new token to access the API. There are also examples on using the API.

## Chat UI

Also we run a number of chat UIs:

[https://nrp-llm-gradio.nrp-nautilus.io](https://nrp-llm-gradio.nrp-nautilus.io) - [H2O Gradio](https://github.com/h2oai/h2ogpt) chat,

[https://nrp-openwebui.nrp-nautilus.io](https://nrp-openwebui.nrp-nautilus.io) - OpenWebUI chat,

[https://librechat.nrp-nautilus.io](https://librechat.nrp-nautilus.io) - LibreChat.

Currently all 3 provide access to models with no additional tokens.