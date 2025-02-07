import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Information',
      links: [
        {
          text: 'Get Access',
          href: getPermalink('/get-access'),
        },
        {
          text: 'Contact',
          href: getPermalink('/contact'),
        },
      ],
    },
    {
      text: 'Participating',
      links: [
        {
          text: 'New contributor guide',
          href: getPermalink('/new-contributor-guide'),
        },
        {
          text: 'Network requirements',
          href: getPermalink('/network-requirements'),
        },
      ],
    },
    {
      text: 'Community',
      links: [
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
          text: 'Cluster Dashboard',
          href: "https://dash.nrp-nautilus.io",
        },
        {
          text: 'All Storage distribution',
          href: getPermalink('/storageall'),
        },
        {
          text: 'Ceph Storage distribution',
          href: getPermalink('/storageceph'),
        },
        {
          text: 'CPU/GPU Usage Log10',
          href: getPermalink('/usagelog'),
        },
      ],
    },
    {
      text: 'Docs',
      href: getPermalink('/documentation'),
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
        {
          text: 'All news from the old web site',
          href: getPermalink('/wpblog'),
        },
      ],
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Information',
      links: [
        { text: 'Get Access', href: 'get-access' },
        { text: 'Contact', href: 'contact' },
        { text: 'Network Requirements', href: 'network-requirements' },
        { text: 'New Contributor Guide', href: 'new-contributor-guide' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'AUP', href: getPermalink('/NRP-AUP.pdf') },
  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'GitLab', icon: 'tabler:brand-gitlab', href: 'https://gitlab.nrp-nautilus.io/prp' },
  ],
  footNote: `
    This work was supported in part by National Science Foundation (NSF) awards CNS-1730158, ACI-1540112, ACI-1541349, OAC-1826967, OAC-2112167, CNS-2100237, CNS-2120019, and the University of California San Diego's California Institute for Telecommunications and Information Technology/Qualcomm Institute and San Diego Supercomputer Center. Thanks to CENIC for the 100Gbps networks.
  `,
};
