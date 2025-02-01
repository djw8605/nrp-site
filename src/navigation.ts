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
          text: 'All List',
          href: getBlogPermalink(),
        },
        {
          text: 'Events',
          href: getPermalink('events', 'tag'),
        },
        {
          text: 'Media',
          href: getPermalink('media', 'tag'),
        },
        {
          text: 'Presentations',
          href: getPermalink('presentations', 'tag'),
        },
        {
          text: 'Reports',
          href: getPermalink('reports', 'tag'),
        },
        {
          text: 'Updates',
          href: getPermalink('updates', 'tag'),
        },
      ],
    },
    {
      text: 'News WP',
      links: [
        {
          text: 'All List from WP directly',
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
    All rights reserved.
  `,
};
