/**
 * Cluster scale figures, used in the homepage hero and on /about.
 *
 * These are the site's strongest credibility signal and they now appear in two
 * places, so they live here rather than being typed twice. Verify against
 * Grafana (https://grafana.nrp-nautilus.io) before changing.
 */
export interface ClusterStat {
  title: string;
  amount: string;
}

export const clusterStats: ClusterStat[] = [
  { title: 'Nodes', amount: '400+' },
  { title: 'Locations', amount: '70+' },
  { title: 'Continents', amount: '3' },
  { title: 'Users', amount: '5K+' },
];
