---
title: LLM as a Service
description: LLM as a Service
---

## SHALB Helm chart

One of easy ways to deploy an LLM is to use a model provided by [HuggingFace](https://huggingface.co/models) with the help of [SHALB Helm chart](https://github.com/shalb/charts/tree/main/huggingface-model).

The Helm chart allows installing a [text genertation inference](https://github.com/huggingface/text-generation-inference) container, optionally accompanied by the [chat-ui interface](https://github.com/huggingface/chat-ui) to talk to the service.

To deploy the LLM, choose a [text generation model](https://huggingface.co/models?pipeline_tag=text-generation&sort=likes) without download restrictions and modest footprint (f.e. Mistral is a good one). You can get approval for protected (like LLama) and/or choose the larger ones and adjust the GPU type that will be able to handle it.

Create the Helm values file (`huggingface-values.yaml`) similar to this one (at least replace the values in first "model" block):

```yaml
model:
  organization: "mistralai"
  name: "Mistral-7B-Instruct-v0.2"
  hf_user: "your_user"
  hf_token: "your_token"

persistence:
  accessModes:
  - ReadWriteOnce
  storageClassName: rook-ceph-block
  storage: 500Gi

updateStrategy:
  type: Recreate

ingress:
  enabled: true
  ingressClassName: haproxy
  hosts:
  - host: <subdomain>.nrp-nautilus.io
    paths:
      - path: /
        pathType: Prefix
  tls:
  - hosts:
    - <subdomain>.nrp-nautilus.io

resources:
  requests:
    cpu: "3"
    memory: "10Gi"
    nvidia.com/gpu: 2
  limits:
    cpu: "8"
    memory: "25Gi"
    nvidia.com/gpu: 2

affinity:
 nodeAffinity:
   requiredDuringSchedulingIgnoredDuringExecution:
     nodeSelectorTerms:
     - matchExpressions:
       - key: nvidia.com/gpu.product
         operator: In
         values:
         - <desired_gpu_type>

chat:
  enabled: true
  resources:
    limits:
      cpu: "2"
      memory: "5G"
    requests:
      cpu: "500m"
      memory: "512M"
                        
  ingress:
    enabled: true
    ingressClassName: haproxy
    hosts:
    - host: <subdomain>-chat.nrp-nautilus.io
      paths:
      - path: /
        pathType: Prefix
    tls:
    - hosts:
      - <subdomain>-chat.nrp-nautilus.io

  modelConfig: {}
    # :::This doesn't seem to work now. You can manually add this later as described below.
    ## e.g.
    # parameters:
    #   temperature: 0.1
    #   top_p: 0.95
    #   repetition_penalty: 1.2
    #   top_k: 50
    #   truncate: 1000
    #   max_new_tokens: 1024
    # datasetName: OpenAssistant/oasst1
    # description: A good alternative to ChatGPT
    # websiteUrl: https://open-assistant.io
    # userMessageToken: ""
    # assistantMessageToken: ""
    # messageEndToken: "</s>"
    # preprompt: |
    #   Below are a series of dialogues between various people and an AI assistant. The AI tries to be helpful, polite, honest, sophisticated, emotionally aware, and humble-but-knowledgeable. The assistant is happy to help with almost anything, and will do its best to understand exactly what is needed. It also tries to avoid giving false or misleading information, and it caveats when it isn't entirely sure about the right answer. That said, the assistant is practical and really does its best, and doesn't let caution get too much in the way of being useful.
    #   -----
    # promptExamples:
    # - title: Write an email from bullet list
    #   prompt: "As a restaurant owner, write a professional email to the supplier to
    #     get these products every week: \n\n- Wine (x10)\n- Eggs (x24)\n- Bread (x12)"
    # - title: Code a snake game
    #   prompt: Code a basic snake game in python, give explanations for each step.
    # - title: Assist in a task
    #   prompt: How do I make a delicious lemon cheesecake?
    # parameters:
    #   temperature: 0.9
    #   top_p: 0.95
    #   repetition_penalty: 1.2
    #   top_k: 50

mongodb:
  updateStrategy:
    type: Recreate
  resources:
    limits:
      cpu: "10"
      memory: "10G"
    requests:
      cpu: "1"
      memory: "1G"
```

Replace `<subdomain>`. Optionally leave and [modify the section with `desired_gpu_type`](/documentation/userdocs/running/gpu-pods/#choosing-gpu-type) or remove the whole `affinity` block.

[Install Helm](https://github.com/helm/helm#install) and deploy the LLM into your namespace:

Many of the hugging face repositories and models to use a token to deploy or run the system.  To do this you must set these values.  Since the token is sensitive information you can pass this to Helm directly instead of including it in the yaml file by replacing (or using environment variables) the `$hf_user`, `$hf_token` in addition to setting the `$namespace` variable. The token can be generated at https://huggingface.co/settings/tokens. 

```bash
helm install hug -n $namespace oci://registry-1.docker.io/shalb/huggingface-model -f huggingface-values.yaml \
  --set "model.hf_user=$hf_user" --set "model.hf_token=$hf_token" \
  --set "extraEnvVars[0].name=HF_TOKEN" --set "extraEnvVars[0].value=$hf_token"
```

If you see 3 pods started in your namespace, you're almost done! The model will be downloaded and cached by the init container. Go stretch, make some tea, and give it some time to be downloaded into our persistent storage. Onse the init container is done and main one starts, give it some more time to start, and you can start chatting with the AI.

Some models require more memory when downloading the model via git-lfs, to do this you must update the Helm chart (https://github.com/shalb/charts).

```patch
diff --git a/huggingface-model/templates/application.yaml b/huggingface-model/templates/application.yaml
index 73b1c17..192c78a 100644
--- a/huggingface-model/templates/application.yaml
+++ b/huggingface-model/templates/application.yaml
@@ -71,7 +71,11 @@ spec:
               mountPath: "/usr/src/{{ .Values.model.name }}"
           resources:
             requests:
-              cpu: "0.5"
+              memory: 8Gi
+              cpu: "2"
+            limits:
+              memory: 8Gi
+              cpu: "2"
       containers:
         - name: model
           image: {{ .Values.image.repo }}:{{ .Values.image.tag }}
```


Your chat-ui will be available at `<subdomain>-chat.nrp-nautilus.io`, and API at `<subdomain>.nrp-nautilus.io`.

The chat parameters for calling the model can be tuned by adding the MODEL config into the chat-ui deployment (the corresponding section in the Helm chart doesn't seem to work currently):

```yaml
    spec:
      containers:
      - name: model
        env:
        - name: MODELS
          value: |
            [
              {"parameters":
                {
                  "temperature":0.1,
                  "top_p":0.9,
                  "repetition_penalty":1.2,
                  "top_k":50,
                  "truncate":3000,
                  "max_new_tokens":1024,
                  "stop":
                    [
                      "<|end_of_text|>,<|eod_id|>"
                    ]
                },
                "endpoints":
                  [
                    {
                      "type":"tgi",
                      "url":"http://hug-llama-3-8b:8080"
                    }
                  ],
                "name":"meta-llama/Llama-3-8B"
                }
            ]
```

**Please scale down or purge unused deployments to free up resources for other users of the cluster.** Your model will remain cached in our persistent storage and next time the start up will be much quicker.

`kubectl scale deployment -n <your_namespace> hug-mistral-7b-instruct-v0-2 hug-mistral-7b-instruct-v0-2-chat hug-mongodb --replicas=0`

## H2O charts

[H2O project](https://github.com/h2oai) provides a complete toolset for running LLMs.

To run their Helm chart, clone the repo and cd into the cloned folder:

```bash
git clone https://github.com/h2oai/h2ogpt.git
cd h2ogpt
```

Create the values file with your desired settings. To see the defaults, run `helm show values helm/h2ogpt-chart`.

Example of values file to use:

```yaml
h2ogpt:
  enabled: true
  stack:
    enabled: true
  storage:
    size: 128Gi
    class: rook-ceph-block
    useEphemeral: false

  # -- Example configs to use when not using Model Lock and External LLM
  overrideConfig:
    base_model: h2oai/h2ogpt-4096-llama2-7b-chat
    use_safetensors: True
    prompt_type: llama2
    save_dir: /workspace/save/
    use_gpu_id: False
    score_model: None
    max_max_new_tokens: 2048
    max_new_tokens: 1024

  extraAffinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: nvidia.com/gpu.product
            operator: In
            values:
            - NVIDIA-A10

  updateStrategy:
    type: Recreate

  service:
    type: ClusterIP

  resources:
    requests:
      cpu: 1
      memory: 100Mi
    limits:
      cpu: 2
      memory: 10Gi

vllm:
  enabled: true

  storage:
    size: 512Gi
    class: rook-ceph-block
    useEphemeral: false

  containerArgs:
    - "--model"
    - h2oai/h2ogpt-4096-llama2-7b-chat
    - "--tokenizer"
    - hf-internal-testing/llama-tokenizer
    - "--tensor-parallel-size"
    - 2
    - "--seed"
    - 1234
    - "--trust-remote-code"

  updateStrategy:
    type: Recreate
  resources:
    requests:
      cpu: 1
      memory: 20Gi
      nvidia.com/gpu: 2
    limits:
      cpu: 10
      memory: 20Gi
      nvidia.com/gpu: 2
```

Install the Helm chart:

`helm install h2ogpt helm/h2ogpt-chart -f h2o-values.yaml`

(substitute the name of the values file you created).

After the model starts (takes a long time for llama 2 in the example), in the chat window you'll have to "load" the model in the Model tab first.

The list of available models to download is available at [https://huggingface.co/h2oai](https://huggingface.co/h2oai).

Once the model is started, refer to the [Ingress docs](/documentation/userdocs/running/ingress/) to expose the service to the world.