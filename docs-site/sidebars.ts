import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'authentication/login',
        'authentication/registration',
        'authentication/password-reset',
      ],
    },
    {
      type: 'category',
      label: 'Campaign Management',
      items: [
        {
          type: 'category',
          label: 'Campaigns',
          items: [
            'campaigns/campaign',
            'campaigns/create-campaign',
            'campaigns/view-campaign-details',
            'campaigns/campaign-reports',
          ],
        },
        'campaigns/campaign-broadcasts',
        'campaigns/campaign-objectives',
        'campaigns/campaign-catalogs',
      ],
    },
    {
      type: 'category',
      label: 'Offer Management',
      items: [
        {
          type: 'category',
          label: 'Offers',
          items: [
            'offers/offer',
            'offers/create-offer',
            'offers/view-offer-details',
            'offers/offer-reports',
          ],
        },
        'offers/offer-catalogs',
      ],
    },
    {
      type: 'category',
      label: 'Product Management',
      items: [
        {
          type: 'category',
          label: 'Products',
          items: [
            'products/product',
            'products/create-product',
            'products/view-product-details',
            'products/product-reports',
          ],
        },
        'products/product-catalogs',
      ],
    },
    {
      type: 'category',
      label: 'Segment Management',
      items: [
        {
          type: 'category',
          label: 'Segments',
          items: [
            'segments/segment',
            'segments/create-segment',
            'segments/view-segment-details',
            'segments/segment-reports',
          ],
        },
        'segments/segment-catalogs',
        'segments/quicklists',
      ],
    },
    {
      type: 'category',
      label: 'Customer 360 Profile',
      items: [
        'customer-360/customers',
        'customer-360/customer-identity',
      ],
    },
    {
      type: 'category',
      label: 'User Management',
      items: [
        'users/all-users',
        'users/access-control',
      ],
    },
    {
      type: 'category',
      label: 'Manual Actions',
      items: [
        'manual-actions/manual-communications',
        'manual-actions/manual-rewards',
      ],
    },
    {
      type: 'category',
      label: 'Reports & Analytics',
      items: [
        'analytics/overall-dashboard-performance',
        'analytics/customer-profile-reports',
        'analytics/campaign-reports',
        'analytics/offer-reports',
        'analytics/delivery-sms-reports',
        'analytics/delivery-email-reports',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'infrastructure/servers',
        'infrastructure/connection-profiles',
        'infrastructure/data-connectors',
        'infrastructure/kpis',
      ],
    },
    {
      type: 'category',
      label: 'Job Management',
      items: [
        'jobs/scheduled-jobs',
        'jobs/job-executions',
        'jobs/job-types',
        'jobs/job-dependencies',
        'jobs/job-workflow-steps',
        'jobs/job-workflows',
      ],
    },
    {
      type: 'category',
      label: 'Communications',
      items: [
        'communications/manual-broadcasts',
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'configuration/line-of-business',
        'configuration/campaign-communication-policy',
        'configuration/communication-channels',
        'configuration/routes',
        'configuration/campaign-objectives',
        'configuration/departments',
        'configuration/programs',
        'configuration/campaign-catalogs',
        'configuration/campaign-types',
        'configuration/control-groups',
        'configuration/job-types',
        'configuration/dnd-management',
        'configuration/vip-list-management',
        'configuration/seed-list-management',
        'configuration/offer-types',
        'configuration/offer-catalogs',
        'configuration/offer-tracking-sources',
        'configuration/creative-templates',
        'configuration/reward-types',
        'configuration/sender-ids',
        'configuration/sms-routes',
        'configuration/languages',
        'configuration/character-sets',
        'configuration/product-types',
        'configuration/combo-types',
        'configuration/product-categories',
        'configuration/segment-catalogs',
        'configuration/segment-types-config',
        'configuration/user-management',
        'configuration/settings',
      ],
    },
    {
      type: 'category',
      label: 'User Settings',
      items: [
        'user-settings/my-profile',
        'user-settings/settings',
      ],
    },
  ],
};

export default sidebars;
