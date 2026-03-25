import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Campaign Management',
      items: ['campaigns/overview'],
    },
    {
      type: 'category',
      label: 'Offer Management',
      items: ['offers/overview'],
    },
    {
      type: 'category',
      label: 'Product Management',
      items: ['products/overview'],
    },
    {
      type: 'category',
      label: 'Segment Management',
      items: ['segments/overview', 'segments/quicklists'],
    },
    {
      type: 'category',
      label: 'Customer 360 Profile',
      items: ['customer-360/customers', 'customer-360/customer-identity'],
    },
    {
      type: 'category',
      label: 'User Management',
      items: ['users/overview', 'users/access-control'],
    },
    {
      type: 'category',
      label: 'Communications',
      items: ['communications/manual-broadcast', 'communications/manual-rewards', 'communications/notifications'],
    },
    {
      type: 'category',
      label: 'Reports & Analytics',
      items: ['analytics/reports', 'analytics/kpis', 'analytics/etl'],
    },
    {
      type: 'category',
      label: 'System & Configuration',
      items: ['system-config/settings', 'system-config/configurations', 'system-config/connection-profiles', 'system-config/servers', 'system-config/jobs'],
    },
  ],
};

export default sidebars;
