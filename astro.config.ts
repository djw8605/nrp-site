import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';

import starlight from '@astrojs/starlight';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',
  outDir: 'public',
  publicDir: 'static',
  
  integrations: [
    starlight({
      favicon: '/static/favicon.ico',
      title: 'NRP Nautilus',
      editLink: {
        baseUrl: 'https://gitlab.nrp-nautilus.io/prp/nrp-site/-/tree/main',
      },
      sidebar: [
        {
          label: "Need help?",
          items: [{ label: "Index", link: "documentation" }],
        },
        {
          label: "User Guide",
          items: [
            {
              label: "Cluster Usage",
              link: "documentation/userdocs/usage/usage_stats",
            },
            {
              label: "Start",
              items: [
                { label: "Get Access", link: "documentation/userdocs/start/get-access" },
                { label: "Quick Start", link: "documentation/userdocs/start/quickstart" },
                { label: "How Should I Use Nautilus?", link: "documentation/userdocs/start/how-to-use-nautilus" },
                { label: "Policies", link: "documentation/userdocs/start/policies" },
                { label: "Deployed Services", link: "documentation/userdocs/start/resources" },
                { label: "Glossary", link: "documentation/userdocs/start/glossary" },
                { label: "FAQ", link: "documentation/userdocs/start/faq" },
                { label: "Contact in Matrix", link: "documentation/userdocs/start/contact" },
                { label: "Asking for Support", link: "documentation/userdocs/start/support" },
              ],
            },
            {
              label: "Tutorials",
              items: [
                { label: "Introduction", link: "documentation/userdocs/tutorial/introduction" },
                { label: "Docker and Containers", link: "documentation/userdocs/tutorial/docker" },
                { label: "Basic Kubernetes", link: "documentation/userdocs/tutorial/basic" },
                { label: "Scaling and Exposing", link: "documentation/userdocs/tutorial/basic2" },
                { label: "Scheduling", link: "documentation/userdocs/tutorial/scheduling" },
                { label: "Batch Jobs", link: "documentation/userdocs/tutorial/jobs" },
                { label: "Images", link: "documentation/userdocs/tutorial/images" },
                { label: "Storage", link: "documentation/userdocs/tutorial/storage" },
                { label: "Debugging", link: "documentation/userdocs/tutorial/debugging" },
                {
                  label: "MNIST Training (Presentation)",
                  link: "https://docs.google.com/presentation/d/1GMvaZr9Nm6LhYUU_E0E0LdoebPpk0dgb2Z6oS9v2Ww8/edit?usp=sharing",
                },
              ],
            },
            {
              label: "Jupyter",
              items: [
                { label: "JupyterHub Service", link: "documentation/userdocs/jupyter/jupyterhub-service" },
                { label: "ML/Jupyter Pod", link: "documentation/userdocs/jupyter/jupyter-pod" },
                { label: "Deploy JupyterHub", link: "documentation/userdocs/jupyter/jupyterhub" },
              ],
            },
            {
              label: "Coder",
              items: [
                { label: "Using Coder", link: "documentation/userdocs/coder/coder" },
                { label: "Deploying Coder", link: "documentation/userdocs/coder/deploy" },
              ],
            },
            {
              label: "AI",
              items: [
                { label: "NRP Managed LLM", link: "documentation/userdocs/ai/llm-managed" },
                { label: "LLM as a Service", link: "documentation/userdocs/ai/llm-service" },
                { label: "LLM in JupyterHub", link: "documentation/userdocs/ai/llm-jupyterhub" },
              ],
            },
          ],
        },
        {
          label: "Admin Guide",
          items: [
            {
              label: "Participating",
              items: [
                { label: "Networking", link: "documentation/admindocs/participating/network" },
                { label: "Joining a Server", link: "documentation/admindocs/participating/new-contributor-guide" },
              ],
            },
            {
              label: "Perfsonar",
              items: [
                { label: "Install", link: "documentation/admindocs/perfsonar/install" },
                { label: "Workshop Links", link: "documentation/admindocs/perfsonar/maddash" },
                { label: "A2A Maddash", link: "documentation/admindocs/perfsonar/a2a" },
              ],
            },
            {
              label: "Cluster Admin",
              items: [
                { label: "Cluster User Management", link: "documentation/admindocs/cluster/cluster-user-mgmt" },
                { label: "Cluster Node Management", link: "documentation/admindocs/cluster/node-mgmt" },
                { label: "JupyterLab", link: "documentation/admindocs/cluster/jupyterlab-admin" },
                { label: "KubeVirt", link: "documentation/admindocs/cluster/kubevirt-gpu" },
                { label: "Services Topology", link: "documentation/admindocs/cluster/cdn-svc" },
                { label: "KubeRay Operator", link: "documentation/admindocs/cluster/ray-operator" },
                { label: "SENSE/Multus", link: "documentation/admindocs/cluster/sense-multus" },
                { label: "Partitioning MIG GPUs", link: "documentation/admindocs/cluster/mig-gpus" },
              ],
            },
            {
              label: "Upgrades",
              items: [
                { label: "Intro", link: "documentation/admindocs/upgrades/intro" },
                { label: "Calico", link: "documentation/admindocs/upgrades/calico" },
                { label: "Cert-Manager", link: "documentation/admindocs/upgrades/cert-manager" },
                { label: "Coder", link: "documentation/admindocs/upgrades/coder" },
                { label: "ElasticSearch", link: "documentation/admindocs/upgrades/elasticsearch" },
                { label: "GitLab", link: "documentation/admindocs/upgrades/gitlab" },
                { label: "JupyterHub", link: "documentation/admindocs/upgrades/jupyterhub" },
                { label: "K8s", link: "documentation/admindocs/upgrades/k8s" },
                { label: "KubeVirt", link: "documentation/admindocs/upgrades/kubevirt" },
                { label: "Nextcloud", link: "documentation/admindocs/upgrades/nextcloud" },
                { label: "Nodes", link: "documentation/admindocs/upgrades/nodes" },
                { label: "Prometheus", link: "documentation/admindocs/upgrades/prometheus" },
                {
                  label: "Storage",
                  items: [
                    { label: "Rook/Ceph", link: "documentation/admindocs/upgrades/rook" },
                    { label: "Linstor", link: "documentation/admindocs/upgrades/piraeus-operator" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    tailwind({
    applyBaseStyles: true,
    }), sitemap(), mdx(), icon({
    include: {
      tabler: ['*'],
      mdi: ["*"],
      'flat-color-icons': [
        'template',
        'gallery',
        'approval',
        'document',
        'advertising',
        'currency-exchange',
        'voice-presentation',
        'business-contact',
        'database',
      ],
    },
  }), ...whenExternalScripts(() =>
    partytown({
      config: { forward: ['dataLayer.push'] },
    })
  ), compress({
    CSS: true,
    HTML: {
      'html-minifier-terser': {
        removeAttributeQuotes: false,
      },
    },
    Image: false,
    JavaScript: true,
    SVG: false,
    Logger: 1,
  }), astrowind({
    config: './src/config.yaml',
  })],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});