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
          text: 'Teaching with the NRP',
          href: getPermalink('/education'),
        },
        {
          text: 'New Contributor Guide',
          href: getPermalink('/documentation/admindocs/participating/new-contributor-guide'),
        },
        {
          text: 'Connect Slurm with InterLink',
          href: getPermalink('/documentation/admindocs/participating/interlink'),
        },
        {
          text: 'Install an InterLink Virtual Node',
          href: getPermalink('/documentation/admindocs/participating/interlink-kubernetes'),
        },
        {
          text: 'Ceph S3 for InterLink Jobs',
          href: getPermalink('/documentation/admindocs/participating/interlink-storage'),
        },
        {
          text: 'Network requirements',
          href: getPermalink('/documentation/admindocs/participating/network'),
        },
        {
          text: 'LightScope Deployment',
          href: getPermalink('/lightscope'),
        },
      ],
    },
    {
      text: 'Community',
      links: [
        // "People" became "About": the page now carries what the NRP is, the
        // NRP/Nautilus distinction, leadership, the team, and NSF funding, not
        // just a roster. /people 301s to /about (static/_redirects).
        {
          text: 'About the NRP',
          href: getPermalink('/about'),
        },
        {
          text: 'Contact',
          href: getPermalink('/contact'),
        },
        {
          text: 'Partners',
          href: getPermalink('/partners'),
        },
      ],
    },
    {
      // Renamed from "InfoGraphics" — an invented word that was carrying eight
      // links. External destinations are flagged with `external: true` so the
      // Header can render an icon instead of a "(external)" text suffix.
      text: 'Dashboards',
      links: [
        {
          text: 'Cluster infographics',
          href: '/viz',
        },
        {
          text: 'Cluster usage',
          href: 'https://grafana.nrp-nautilus.io/d/nrp-user-explorer/nrp-accounting',
          external: true,
        },
        {
          text: 'Available resources',
          href: getPermalink('/viz/resources'),
        },
        {
          text: 'LLM status',
          href: getPermalink('/llm-status'),
        },
        {
          text: 'Services status',
          href: getPermalink('/services-status'),
        },
        {
          text: 'Cluster dashboard',
          href: 'https://dash.nrp-nautilus.io',
          external: true,
        },
        {
          text: 'Grafana dashboards',
          href: 'https://grafana.nrp-nautilus.io/dashboards',
          external: true,
        },
        {
          text: 'perfSONAR network',
          href: 'https://perfsonar.nrp-nautilus.io/maddash-webui/index.cgi',
          external: true,
        },
        {
          text: 'Observable notebooks',
          href: 'https://observablehq.com/@nrp-nautilus?type=collections',
          external: true,
        },
      ],
    },
    {
      text: 'News',
      links: [
        {
          text: 'Latest Cluster News',
          href: getPermalink('/live'),
        },
        {
          text: 'News Posts',
          href: getBlogPermalink(),
        },
        {
          text: 'Annual Meeting',
          href: getPermalink('/annual-meeting'),
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
      // Was a flat list of eight that mixed personal account settings with
      // cluster operations. Split into two labelled groups.
      text: 'My account',
      links: [
        { text: 'Account', heading: true },
        {
          text: 'User info',
          href: getPermalink('/userinfo'),
        },
        {
          text: 'LLM API keys',
          href: getPermalink('/llmtoken'),
        },
        {
          text: 'S3 tokens',
          href: getPermalink('/s3token'),
        },
        {
          text: 'Milvus password',
          href: getPermalink('/milvus'),
        },
        { text: 'Cluster operations', heading: true },
        {
          text: 'Namespaces',
          href: getPermalink('/namespaces'),
        },
        {
          text: 'Reservations',
          href: getPermalink('/reservations'),
        },
        {
          text: 'Pod diagnosis',
          href: getPermalink('/diagnose'),
        },
      ],
    },
    {
      text: 'LLMs',
      href: getPermalink('/llms'),
    },
    {
      text: 'Docs',
      href: getPermalink('/documentation'),
    },
  ],
  // No header CTA: the hero already carries "Get started" above the fold, and a
  // second one in the header only competed with Log In at a mismatched size.
  actions: [],
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
  secondaryLinks: [{ text: 'NRP Acceptable Use Policy', href: getPermalink('/NRP-AUP.pdf') }],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'GitLab', icon: 'tabler:brand-gitlab', href: 'https://gitlab.nrp-nautilus.io/prp' },
  ],
  // Rendered as real markup by Footer.astro so the logo can go through Astro's
  // <Image>. It used to be a raw <img src="/nsf-logo.png"> in this string,
  // which shipped 184 KB at 480x481 to be displayed at 80x80.
  funding: {
    logo: { src: '~/assets/images/nsf-logo.png', alt: 'U.S. National Science Foundation' },
    text: 'This work was supported in part by National Science Foundation (NSF) awards CNS-1730158, ACI-1540112, ACI-1541349, OAC-1826967, OAC-2112167, CNS-2100237, CNS-2120019.',
  },
};
