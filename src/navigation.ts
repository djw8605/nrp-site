import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Participating',
      links: [
        {
          text: 'New User Guide',
          href: getPermalink('/documentation/userdocs/tutorial/introduction'),
        },
        {
          text: 'Educational/Classroom Use',
          href: getPermalink('/education'),
        },
        {
          text: 'New Contributor Guide',
          href: getPermalink('/documentation/admindocs/participating/new-contributor-guide'),
        },
        {
          text: 'Network requirements',
          href: getPermalink('/documentation/admindocs/participating/network'),
        },
      ],
    },
    {
      text: 'Community',
      links: [
        {
          text: 'Contact',
          href: getPermalink('/contact'),
        },
        {
          text: 'Partners',
          href: getPermalink('/partners'),
        },
        {
          text: 'People',
          href: getPermalink('/people'),
        },
      ],
    },
    {
      text: 'InfoGraphics',
      links: [
        {
          text: 'Cluster InfoGraphics',
          href: "/viz",
        },
        {
          text: 'Cluster Usage',
          href: getPermalink('/viz/clusterusage'),
        },
        {
          text: 'Observable notebooks (external)',
          href: "https://observablehq.com/@nrp-nautilus?type=collections",
        },
        {
          text: 'Cluster Dashboard (external)',
          href: "https://dash.nrp-nautilus.io",
        },
        {
          text: 'Grafana Dashboards (external)',
          href: "https://grafana.nrp-nautilus.io/dashboards",
        },
        {
          text: 'PerfSonar network (external)',
          href: "https://perfsonar.nrp-nautilus.io/maddash-webui/index.cgi",
        },
      ],
    },
    {
      text: 'News',
      links: [
        {
          text: 'All',
          href: getBlogPermalink(),
        },
        {
          text: 'Events',
          href: getPermalink('events', 'category'),
        },
        {
          text: 'Presentations',
          href: getPermalink('presentations', 'category'),
        },
      ],
    },
    {
      text: 'User',
      links: [
        {
          text: 'User info',
          href: getPermalink('/userinfo'),
        },
        {
          text: 'LLM Tokens',
          href: getPermalink('/llmtoken'),
        },
        {
          text: 'S3 Tokens',
          href: getPermalink('/s3token'),
        },
        {
          text: 'Milvus password',
          href: getPermalink('/milvus'),
        },
        {
          text: 'Reservations',
          href: getPermalink('/reservations'),
        },
        {
          text: 'Namespaces',
          href: getPermalink('/namespaces'),
        },
        {
          text: 'Resources',
          href: getPermalink('/viz/resources'),
        },
      ]
  },
    {
      text: 'Docs',
      href: getPermalink('/documentation'),
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Information',
      links: [
        { text: 'Getting Started', href: '/documentation/userdocs/start/getting-started/' },
        { text: 'Contact', href: '/contact' },
        { text: 'Network Requirements', href: '/documentation/admindocs/participating/network/' },
        { text: 'New Contributor Guide', href: '/documentation/admindocs/participating/new-contributor-guide/' },
      ],
    },
    {
      title: 'Cluster',
      links: [
        { text: 'Namespaces management', href: '/namespaces' },
        { text: 'Reservations', href: '/reservations' },
        { text: 'Available resources', href: '/viz/resources/' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'NRP Acceptable Use Policy', href: getPermalink('/NRP-AUP.pdf') },
  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'GitLab', icon: 'tabler:brand-gitlab', href: 'https://gitlab.nrp-nautilus.io/prp' },
  ],
  footNote: `
  <div class="flex items-center justify-between gap-5">
  <!-- NSF Logo -->
  <div class="flex items-center">
    <img
      src="/nsf-logo.png" 
      alt="NSF Logo"
      class="h-20 w-20 object-contain"
    />
  </div>

  <!-- Footer Text -->
  <div class="text-sm text-gray-600 dark:text-gray-400">
    This work was supported in part by National Science Foundation (NSF) awards CNS-1730158, ACI-1540112, ACI-1541349, OAC-1826967, OAC-2112167, CNS-2100237, CNS-2120019.
  </div>
</div>

    
  `,
};
