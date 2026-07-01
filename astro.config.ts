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

import mermaid from 'astro-mermaid';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';

import vue from '@astrojs/vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',
  outDir: 'public',
  publicDir: 'static',

  integrations: [
    mermaid({
      theme: 'forest',
      autoTheme: true,
    }),
    starlight({
      disable404Route: true,
      favicon: '/favicon.ico',
      title: 'NRP Nautilus',
      head: [
        {
          tag: 'script',
          attrs: {
            defer: true,
            'data-domain': 'nrp.ai',
            src: 'https://nrp-site-analytics.nrp-nautilus.io/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js',
          },
        },
        {
          tag: 'script',
          content: 'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }',
        },
      ],
      customCss: ['/src/content/docs/Documentation/styles/extra.css'],
      components: {
        Footer: './src/components/DocsFooter.astro',
        Search: './src/components/DocsSearch.astro',
      },
      social: {
        gitlab: 'https://gitlab.nrp-nautilus.io/prp/nrp-site',
        matrix: 'https://element.nrp-nautilus.io/',
        slack: 'https://join.slack.com/t/nrp-chat/shared_invite/zt-3xv6t5l9d-kXX5j79CHQrrXMpfSyM5QQ',
      },
      editLink: {
        baseUrl: 'https://gitlab.nrp-nautilus.io/prp/nrp-site/-/tree/main',
      },
      sidebar: [
        {
          label: 'Start Here',
          link: 'documentation/',
        },
        {
          label: 'User Guide',
          items: [
            {
              label: 'Start',
              collapsed: true,
              items: [
                { label: 'Getting Started', link: 'documentation/userdocs/start/getting-started' },
                { label: 'Using Nautilus', link: 'documentation/userdocs/start/using-nautilus' },
                { label: 'Hierarchical resources', link: 'documentation/userdocs/start/hierarchy' },
                { label: 'Cluster Policies', link: 'documentation/userdocs/start/policies' },
                { label: 'Deployed Services', link: 'documentation/userdocs/start/resources' },
                { label: 'Glossary', link: 'documentation/userdocs/start/glossary' },
                { label: 'FAQ', link: 'documentation/userdocs/start/faq' },
                { label: 'Asking for Support', link: 'documentation/userdocs/start/support' },
              ],
            },
            {
              label: 'Tutorials',
              collapsed: true,
              items: [
                { label: 'Introduction', link: 'documentation/userdocs/tutorial/introduction' },
                { label: 'Docker and Containers', link: 'documentation/userdocs/tutorial/docker' },
                { label: 'Basic Kubernetes', link: 'documentation/userdocs/tutorial/basic' },
                { label: 'Scaling and Exposing', link: 'documentation/userdocs/tutorial/basic2' },
                { label: 'Scheduling', link: 'documentation/userdocs/tutorial/scheduling' },
                { label: 'Batch Jobs', link: 'documentation/userdocs/tutorial/jobs' },
                { label: 'Images', link: 'documentation/userdocs/tutorial/images' },
                { label: 'Storage', link: 'documentation/userdocs/tutorial/storage' },
                { label: 'Debugging', link: 'documentation/userdocs/tutorial/debugging' },
                { label: 'Distributing Images Using CVMFS', link: 'documentation/userdocs/tutorial/nrp-software' },
                {
                  label: 'MNIST Training (Presentation)',
                  link: 'https://docs.google.com/presentation/d/1GMvaZr9Nm6LhYUU_E0E0LdoebPpk0dgb2Z6oS9v2Ww8/edit?usp=sharing',
                },
              ],
            },
            {
              label: 'Running',
              collapsed: true,
              items: [
                {
                  label: 'Beginner start',
                  collapsed: true,
                  items: [
                    { label: 'GPU pods', link: 'documentation/userdocs/running/gpu-pods' },
                    { label: 'Long idle pods', link: 'documentation/userdocs/running/long-idle' },
                    { label: 'Monitoring', link: 'documentation/userdocs/running/monitoring' },
                    { label: 'Running batch jobs', link: 'documentation/userdocs/running/jobs' },
                    { label: 'Running CPU only jobs', link: 'documentation/userdocs/running/cpu-only' },
                  ],
                },
                {
                  label: 'Intermediate',
                  collapsed: true,
                  items: [
                    { label: 'Scheduling', link: 'documentation/userdocs/running/scheduling' },
                    { label: 'Opportunistic Use', link: 'documentation/userdocs/running/priority-classes' },
                    { label: 'Client scripts', link: 'documentation/userdocs/running/scripts' },
                    { label: 'Exposing HTTP', link: 'documentation/userdocs/running/ingress' },
                    { label: 'GatewayAPI', link: 'documentation/userdocs/running/gateway' },
                    { label: 'Special use', link: 'documentation/userdocs/running/special' },
                    { label: 'Faster images download', link: 'documentation/userdocs/running/fast-img-download' },
                    { label: 'Globus-connect', link: 'documentation/userdocs/running/globus-connect' },
                    { label: 'Python k8s API', link: 'documentation/userdocs/running/kubernetes' },
                    { label: 'Federation', link: 'documentation/userdocs/running/federation' },
                    { label: 'GUI Desktop', link: 'documentation/userdocs/running/gui-desktop' },
                    { label: 'Scientific images', link: 'documentation/userdocs/running/sci-img' },
                    { label: 'Postgres cluster', link: 'documentation/userdocs/running/postgres' },
                    { label: 'ClickHouse cluster', link: 'documentation/userdocs/running/clickhouse' },
                  ],
                },
                {
                  label: 'Virtualization',
                  collapsed: true,
                  items: [
                    { label: 'General', link: 'documentation/userdocs/running/virtualization-general' },
                    { label: 'Live ubuntu', link: 'documentation/userdocs/running/virtualization-ubuntu' },
                    { label: 'Windows', link: 'documentation/userdocs/running/virtualization-windows' },
                    { label: 'Talos', link: 'documentation/userdocs/running/virtualization-talos' },
                  ],
                },
                {
                  label: 'Distributed computing',
                  collapsed: true,
                  items: [
                    { label: 'Ray Cluster', link: 'documentation/userdocs/running/ray-cluster' },
                    { label: 'Dask Cluster', link: 'documentation/userdocs/running/dask-cluster' },
                    { label: 'Kubeflow', link: 'documentation/userdocs/running/kubeflow' },
                  ],
                },
                {
                  label: 'Performance',
                  collapsed: true,
                  items: [
                    { label: 'High I/O jobs', link: 'documentation/userdocs/running/io-jobs' },
                    { label: 'CPU throttling', link: 'documentation/userdocs/running/cpu-throttling' },
                  ],
                },
              ],
            },
            {
              label: 'Jupyter',
              collapsed: true,
              items: [
                { label: 'JupyterHub Service', link: 'documentation/userdocs/jupyter/jupyterhub-service' },
                { label: 'ML/Jupyter Pod', link: 'documentation/userdocs/jupyter/jupyter-pod' },
                { label: 'Deploy JupyterHub', link: 'documentation/userdocs/jupyter/jupyterhub' },
              ],
            },
            {
              label: 'Coder',
              collapsed: true,
              items: [
                { label: 'Using Coder', link: 'documentation/userdocs/coder/coder' },
                { label: 'Deploying Coder', link: 'documentation/userdocs/coder/deploy' },
              ],
            },
            {
              label: 'AI/LLMs',
              collapsed: true,
              items: [
                {
                  label: 'NRP Managed LLM',
                  collapsed: true,
                  items: [
                    { label: 'Overview', link: 'documentation/userdocs/ai/llm-managed' },
                    { label: 'Available models', link: 'documentation/userdocs/ai/llm-managed/models' },
                    { label: 'Chat interfaces', link: 'documentation/userdocs/ai/llm-managed/chat-interfaces' },
                    { label: 'API access', link: 'documentation/userdocs/ai/llm-managed/api-access' },
                    { label: 'Client configurations', link: 'documentation/userdocs/ai/llm-managed/client-configs' },
                    { label: 'Fair use policy', link: 'documentation/userdocs/ai/llm-managed/fair-use' },
                    { label: 'Lifecycle & changelog', link: 'documentation/userdocs/ai/llm-managed/lifecycle' },
                  ],
                },
                { label: 'Accounting MCP Server', link: 'documentation/userdocs/ai/accounting-mcp' },
                { label: 'LLM in JupyterHub', link: 'documentation/userdocs/ai/llm-jupyterhub' },
                { label: 'Cloud AI 100 Cards', link: 'documentation/userdocs/ai/qaic' },
                { label: 'Vector database', link: 'documentation/userdocs/ai/vector-database' },
              ],
            },
            {
              label: 'Networks',
              collapsed: true,
              items: [
                { label: 'LoadBalancer VIPs', link: 'documentation/userdocs/networks/loadbalancer-vips' },
                { label: 'FABRIC Integration', link: 'documentation/userdocs/networks/fabric' },
              ],
            },
            {
              label: 'FPGA',
              collapsed: true,
              items: [
                { label: 'Requesting FPGAs from a Pod', link: 'documentation/userdocs/fpgas/using-fpgas-from-pods' },
                { label: 'Vivado and Vitis', link: 'documentation/userdocs/fpgas/vivado-vitis' },
                { label: 'ESnet SmartNIC', link: 'documentation/userdocs/fpgas/esnet' },
                { label: 'SmartNIC: Development', link: 'documentation/userdocs/fpgas/esnet_development' },
                { label: 'SmartNIC: Building ', link: 'documentation/userdocs/fpgas/esnet_building' },
                { label: 'SmartNIC: Running', link: 'documentation/userdocs/fpgas/esnet_running' },
              ],
            },
            {
              label: 'Storage',
              collapsed: true,
              items: [
                {
                  label: 'Storage options',
                  collapsed: true,
                  items: [
                    { label: 'Intro', link: 'documentation/userdocs/storage/intro' },
                    { label: 'Ceph FS / RBD', link: 'documentation/userdocs/storage/ceph' },
                    { label: 'Ceph S3', link: 'documentation/userdocs/storage/ceph-s3' },
                    { label: 'CVMFS', link: 'documentation/userdocs/storage/cvmfs' },
                    { label: 'Local scratch', link: 'documentation/userdocs/storage/local' },
                    { label: 'Linstor', link: 'documentation/userdocs/storage/linstor' },
                    { label: 'Nextcloud', link: 'documentation/userdocs/storage/nextcloud' },
                    { label: 'Syncthing', link: 'documentation/userdocs/storage/syncthing' },
                    { label: 'Mounting FUSE', link: 'documentation/userdocs/storage/fuse' }
                  ],
                },
                {
                  label: 'Managing',
                  collapsed: true,
                  items: [
                    { label: 'Moving data', link: 'documentation/userdocs/storage/move-data' },
                    { label: 'Purging', link: 'documentation/userdocs/storage/purging' },
                    { label: 'Managing Tokens', link: 'documentation/userdocs/storage/jwt-credential' },
                  ],
                },
              ],
            },
            {
              label: 'Development',
              collapsed: true,
              items: [
                { label: 'Building in GitLab', link: 'documentation/userdocs/development/gitlab' },
                { label: 'Private Repos', link: 'documentation/userdocs/development/private-repos' },
                { label: 'Integrating GitLab and k8s', link: 'documentation/userdocs/development/k8s-integration' },
              ],
            },
          ],
        },
        {
          label: 'Admin guide',
          collapsed: true,
          items: [
            {
              label: 'Participating',
              collapsed: true,
              items: [
                { label: 'Networking', link: 'documentation/admindocs/participating/network' },
                { label: 'Joining a server', link: 'documentation/admindocs/participating/new-contributor-guide' },
              ],
            },
            {
              label: 'Perfsonar',
              collapsed: true,
              items: [
                { label: 'Install', link: 'documentation/admindocs/perfsonar/install' },
                { label: 'Workshop links', link: 'documentation/admindocs/perfsonar/maddash' },
                { label: 'A2A Maddash', link: 'documentation/admindocs/perfsonar/a2a' },
              ],
            },
            {
              label: 'FIONA',
              collapsed: true,
              items: [
                { label: 'Builds', link: 'documentation/admindocs/fiona/builds' },
                { label: 'Install', link: 'documentation/admindocs/fiona/install' },
                { label: 'Fix', link: 'documentation/admindocs/fiona/fix' },
                { label: 'Remove', link: 'documentation/admindocs/fiona/remove' },
              ],
            },
            {
              label: 'NRP',
              collapsed: true,
              items: [{ label: 'Topology', link: 'documentation/admindocs/nrp/topology' }],
            },
            {
              label: 'AI',
              collapsed: true,
              items: [{ label: 'Managing AI Models', link: 'documentation/admindocs/ai/managing_models' }],
            },
            {
              label: 'Storage',
              collapsed: true,
              items: [
                { label: 'Broken drives', link: 'documentation/admindocs/storage/broken-drives' },
                { label: 'Ceph S3', link: 'documentation/admindocs/storage/ceph-s3' },
                { label: 'Ceph Recover', link: 'documentation/admindocs/storage/ceph' },
                { label: 'Ceph Performance', link: 'documentation/admindocs/storage/ceph-performance' },
                { label: 'Linstor', link: 'documentation/admindocs/storage/linstor' },
                { label: 'Volume Mounting Troubleshooting', link: 'documentation/admindocs/storage/volume-mounting' },
                { label: 'Origin SyncThing', link: 'documentation/admindocs/storage/origin-sync' },
                { label: 'User PVC Issues', link: 'documentation/admindocs/storage/user-pvc-issues' },
              ],
            },
            {
              label: 'Vault',
              collapsed: true,
              items: [
                { label: 'Getting certs', link: 'documentation/admindocs/vault/cert' },
                { label: 'Updating IPMI', link: 'documentation/admindocs/vault/ipmi' },
              ],
            },
            {
              label: 'Links',
              collapsed: true,
              items: [
                { label: 'Hardware', link: 'documentation/admindocs/links/hardware' },
                { label: 'Knowledge base', link: 'documentation/admindocs/links/knowledge-base' },
                { label: 'Software', link: 'documentation/admindocs/links/software' },
                { label: 'Vis', link: 'documentation/admindocs/links/vis' },
              ],
            },
            {
              label: 'Cluster admin',
              collapsed: true,
              items: [
                { label: 'Cluster user management', link: 'documentation/admindocs/cluster/cluster-user-mgmt' },
                { label: 'Cluster node management', link: 'documentation/admindocs/cluster/node-mgmt' },
                { label: 'Namespace management', link: 'documentation/admindocs/cluster/ns-mgmt' },
                { label: 'Authentik', link: 'documentation/admindocs/cluster/authentik' },
                { label: 'Etcd', link: 'documentation/admindocs/cluster/etcd' },
                { label: 'JupyterLab', link: 'documentation/admindocs/cluster/jupyterlab-admin' },
                { label: 'KubeVirt', link: 'documentation/admindocs/cluster/kubevirt-gpu' },
                { label: 'GitLab Runners', link: 'documentation/admindocs/cluster/gitlab' },
                { label: 'FPGA Flashing', link: 'documentation/admindocs/cluster/fpga' },
                { label: 'Services topology', link: 'documentation/admindocs/cluster/cdn-svc' },
                { label: 'KubeRay operator', link: 'documentation/admindocs/cluster/ray-operator' },
                { label: 'SENSE/Multus', link: 'documentation/admindocs/cluster/sense-multus' },
                { label: 'Partitioning MIG GPUs', link: 'documentation/admindocs/cluster/mig-gpus' },
                { label: 'Security Tools', link: 'documentation/admindocs/cluster/security-tools' },
                {
                  label: 'Upgrades',
                  collapsed: true,
                  items: [
                    { label: 'intro', link: 'documentation/admindocs/upgrades/intro' },
                    { label: 'calico', link: 'documentation/admindocs/upgrades/calico' },
                    { label: 'cert-manager', link: 'documentation/admindocs/upgrades/cert-manager' },
                    { label: 'coder', link: 'documentation/admindocs/upgrades/coder' },
                    { label: 'elasticsearch', link: 'documentation/admindocs/upgrades/elasticsearch' },
                    { label: 'gitlab', link: 'documentation/admindocs/upgrades/gitlab' },
                    { label: 'jupyterhub', link: 'documentation/admindocs/upgrades/jupyterhub' },
                    { label: 'k8s', link: 'documentation/admindocs/upgrades/k8s' },
                    { label: 'kubevirt', link: 'documentation/admindocs/upgrades/kubevirt' },
                    { label: 'nextcloud', link: 'documentation/admindocs/upgrades/nextcloud' },
                    { label: 'overleaf', link: 'documentation/admindocs/upgrades/overleaf' },
                    { label: 'nodes', link: 'documentation/admindocs/upgrades/nodes' },
                    { label: 'prometheus', link: 'documentation/admindocs/upgrades/prometheus' },
                    { label: 'postgres', link: 'documentation/admindocs/upgrades/postgres-operator' },
                    { label: 'clickhouse', link: 'documentation/admindocs/upgrades/clickhouse-operator' },
                    {
                      label: 'Storage',
                      collapsed: true,
                      items: [
                        { label: 'rook/ceph', link: 'documentation/admindocs/upgrades/rook' },
                        { label: 'linstor', link: 'documentation/admindocs/upgrades/piraeus-operator' },
                      ],
                    },
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
    }),
    sitemap(),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        mdi: ['*'],
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
    }),
    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),
    compress({
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
    }),
    astrowind({
      config: './src/config.yaml',
    }),
    vue({ appEntrypoint: '/src/pages/_app' }),
  ],

  image: {
    domains: ['cdn.pixabay.com', 'media.nrp.ai', 'nrp.ai'],
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
