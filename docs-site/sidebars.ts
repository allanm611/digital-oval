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
        'authentication/unauthorized',
        'authentication/landing',
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
            {
              type: 'doc',
              id: 'campaigns/campaigns-list',
              label: 'Campaign List',
            },
            'campaigns/create-campaign',
            'campaigns/edit-campaign',
            'campaigns/view-campaign-details',
            {
              type: 'doc',
              id: 'campaigns/campaign-reports',
              label: 'Campaign Analytics',
            },
          ],
        },
        'campaigns/campaign-broadcasts',
        'campaigns/campaign-objectives',
        {
          type: 'category',
          label: 'Campaign Catalogs',
          items: [
            'campaigns/campaign-catalog',
            'campaigns/campaign-assign-items-modal',
            'campaigns/campaign-view-catalog-modal',
          ],
        },
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
            {
              type: 'doc',
              id: 'offers/offers-list',
              label: 'Offer List',
            },
            'offers/create-offer',
            'offers/view-offer-details',
            'offers/offer-reports',
          ],
        },
        {
          type: 'category',
          label: 'Offer Catalogs',
          items: [
            'offers/offer-catalog',
            'offers/offer-assign-items-modal',
            'offers/offer-view-catalog-modal',
          ],
        },
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
            {
              type: 'doc',
              id: 'products/products-list',
              label: 'Product List',
            },
            'products/create-product',
            'products/view-product-details',
            'products/product-reports',
          ],
        },
        {
          type: 'category',
          label: 'Product Catalogs',
          items: [
            'products/product-catalog',
            'products/product-assign-items-modal',
            'products/product-view-catalog-modal',
          ],
        },
        {
          type: 'category',
          label: 'Edit Products',
          items: [
            'products/product-edit',
          ],
        },
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
            {
              type: 'doc',
              id: 'segments/segments-list',
              label: 'Segment List',
            },
            'segments/create-segment',
            'segments/view-segment-details',
            'segments/segment-reports',
            'segments/segment-edit',
          ],
        },
        {
          type: 'category',
          label: 'Segment Catalogs',
          items: [
            'segments/segment-catalog',
            'segments/segment-assign-items-modal',
            'segments/segment-view-catalog-modal',
          ],
        },
        {
          type: 'category',
          label: 'Quicklists',
          items: [
            {
              type: 'doc',
              id: 'segments/quicklists-list',
              label: 'Quicklist List',
            },
            'segments/create-quicklist',
            'segments/view-quicklist',
            'segments/quicklist-edit',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Customer 360 Profile',
      items: [
        {
          type: 'category',
          label: 'Customers',
          items: [
            {
              type: 'doc',
              id: 'customer-360/customers-list',
              label: 'Customer List',
            },
            'customer-360/create-customer',
            'customer-360/view-customer-details',
            'customer-360/customer-reports',
          ],
        },
        {
          type: 'category',
          label: 'Customer Identity',
          items: [
            'customer-360/customer-identity',
            'customer-360/view-customer-identity-details',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'User Management',
      items: [
        {
          type: 'category',
          label: 'Users',
          items: [
            {
              type: 'doc',
              id: 'users/users-list',
              label: 'User List',
            },
            'users/create-user',
            'users/view-user-details',
            'users/user-reports',
            'users/user-analytics',
          ],
        },
        {
          type: 'category',
          label: 'Access Control',
          items: [
            'users/role-management',
            'users/permissions',
            'users/assign-permissions',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Manual Actions',
      items: [
        {
          type: 'category',
          label: 'Manual Rewards',
          items: [
            {
              type: 'doc',
              id: 'manual-actions/manual-rewards-list',
              label: 'Manual Reward List',
            },
            'manual-actions/view-manual-reward',
            'manual-actions/edit-manual-reward',
          ],
        },
        {
          type: 'category',
          label: 'Manual Communications',
          items: [
            {
              type: 'doc',
              id: 'manual-actions/manual-communications-list',
              label: 'Manual Communication List',
            },
            'manual-actions/view-manual-communication',
            'manual-actions/edit-manual-communication',
          ],
        },
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
        {
          type: 'category',
          label: 'Servers',
          items: [
            {
              type: 'doc',
              id: 'infrastructure/servers-list',
              label: 'Server List',
            },
            'infrastructure/create-server',
            'infrastructure/view-server',
            'infrastructure/edit-server',
          ],
        },
        {
          type: 'category',
          label: 'Connection Profiles',
          items: [
            {
              type: 'doc',
              id: 'infrastructure/connection-profiles-list',
              label: 'Connection Profile List',
            },
            'infrastructure/create-connection-profile',
            'infrastructure/view-connection-profile',
            'infrastructure/edit-connection-profile',
          ],
        },
        {
          type: 'category',
          label: 'Data Connectors',
          items: [
            {
              type: 'doc',
              id: 'infrastructure/data-connectors-list',
              label: 'Data Connector List',
            },
            'infrastructure/create-data-connector',
            'infrastructure/view-data-connector',
            'infrastructure/edit-data-connector',
          ],
        },
        {
          type: 'category',
          label: 'KPIs',
          items: [
            {
              type: 'doc',
              id: 'infrastructure/kpis-list',
              label: 'KPI List',
            },
            'infrastructure/create-kpi',
            'infrastructure/view-kpi',
            'infrastructure/edit-kpi',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Job Management',
      items: [
        {
          type: 'category',
          label: 'Scheduled Jobs',
          items: [
            {
              type: 'doc',
              id: 'jobs/scheduled-jobs-list',
              label: 'Scheduled Job List',
            },
            'jobs/create-scheduled-job',
            'jobs/view-scheduled-job',
            'jobs/edit-scheduled-job',
          ],
        },
        {
          type: 'category',
          label: 'Job Executions',
          items: [
            {
              type: 'doc',
              id: 'jobs/job-executions-list',
              label: 'Job Execution List',
            },
            'jobs/view-job-execution',
          ],
        },
        {
          type: 'category',
          label: 'Job Types',
          items: [
            {
              type: 'doc',
              id: 'jobs/job-types-list',
              label: 'Job Type List',
            },
            'jobs/create-job-type',
            'jobs/view-job-type',
          ],
        },
        {
          type: 'category',
          label: 'Job Dependencies',
          items: [
            {
              type: 'doc',
              id: 'jobs/job-dependencies-list',
              label: 'Job Dependency List',
            },
            'jobs/create-job-dependency',
            'jobs/view-job-dependency',
          ],
        },
        {
          type: 'category',
          label: 'Job Workflow Steps',
          items: [
            {
              type: 'doc',
              id: 'jobs/job-workflow-steps-list',
              label: 'Job Workflow Step List',
            },
            'jobs/view-job-workflow-step',
          ],
        },
        {
          type: 'category',
          label: 'Job Workflows',
          items: [
            {
              type: 'doc',
              id: 'jobs/job-workflows-list',
              label: 'Job Workflow List',
            },
            'jobs/create-job-workflow',
            'jobs/view-job-workflow',
            'jobs/edit-job-workflow',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      items: [
        {
          type: 'category',
          label: 'Line of Business',
          items: [
            {
              type: 'doc',
              id: 'configuration/line-of-business-list',
              label: 'Line of Business List',
            },
            'configuration/create-line-of-business',
            'configuration/view-line-of-business',
            'configuration/edit-line-of-business',
          ],
        },
        {
          type: 'category',
          label: 'Campaign Communication Policy',
          items: [
            {
              type: 'doc',
              id: 'configuration/campaign-communication-policy-list',
              label: 'Campaign Communication Policy List',
            },
            'configuration/create-campaign-communication-policy',
            'configuration/view-campaign-communication-policy',
            'configuration/edit-campaign-communication-policy',
          ],
        },
        {
          type: 'category',
          label: 'Communication Channels',
          items: [
            {
              type: 'doc',
              id: 'configuration/communication-channels-list',
              label: 'Communication Channel List',
            },
            'configuration/create-communication-channel',
            'configuration/view-communication-channel',
            'configuration/edit-communication-channel',
          ],
        },
        {
          type: 'category',
          label: 'Routes',
          items: [
            {
              type: 'doc',
              id: 'configuration/routes-list',
              label: 'Route List',
            },
            'configuration/create-route',
            'configuration/view-route',
            'configuration/edit-route',
          ],
        },
        {
          type: 'category',
          label: 'Campaign Objectives',
          items: [
            {
              type: 'doc',
              id: 'configuration/campaign-objectives-list',
              label: 'Campaign Objective List',
            },
            'configuration/create-campaign-objective',
            'configuration/view-campaign-objective',
            'configuration/edit-campaign-objective',
          ],
        },
        {
          type: 'category',
          label: 'Departments',
          items: [
            {
              type: 'doc',
              id: 'configuration/departments-list',
              label: 'Department List',
            },
            'configuration/create-department',
            'configuration/view-department',
            'configuration/edit-department',
          ],
        },
        {
          type: 'category',
          label: 'Programs',
          items: [
            {
              type: 'doc',
              id: 'configuration/programs-list',
              label: 'Program List',
            },
            'configuration/create-program',
            'configuration/view-program',
            'configuration/edit-program',
          ],
        },
        {
          type: 'category',
          label: 'Campaign Catalogs',
          items: [
            'configuration/campaign-catalog',
            'configuration/create-campaign-catalog',
            'configuration/view-campaign-catalog',
            'configuration/edit-campaign-catalog',
          ],
        },
        {
          type: 'category',
          label: 'Campaign Types',
          items: [
            {
              type: 'doc',
              id: 'configuration/campaign-types-list',
              label: 'Campaign Type List',
            },
            'configuration/create-campaign-type',
            'configuration/view-campaign-type',
            'configuration/edit-campaign-type',
          ],
        },
        {
          type: 'category',
          label: 'Control Groups',
          items: [
            {
              type: 'doc',
              id: 'configuration/control-groups-list',
              label: 'Control Group List',
            },
            'configuration/create-control-group',
            'configuration/view-control-group',
            'configuration/edit-control-group',
          ],
        },
        {
          type: 'category',
          label: 'Job Types',
          items: [
            'configuration/job-types-list',
            'configuration/create-job-type',
            'configuration/view-job-type',
            'configuration/edit-job-type',
          ],
        },
        {
          type: 'category',
          label: 'DND Management',
          items: [
            {
              type: 'doc',
              id: 'configuration/dnd-management-list',
              label: 'DND Management List',
            },
            'configuration/create-dnd-management',
            'configuration/view-dnd-management',
            'configuration/edit-dnd-management',
          ],
        },
        {
          type: 'category',
          label: 'VIP List Management',
          items: [
            {
              type: 'doc',
              id: 'configuration/vip-list-management-list',
              label: 'VIP List Management List',
            },
            'configuration/create-vip-list-management',
            'configuration/view-vip-list-management',
            'configuration/edit-vip-list-management',
          ],
        },
        {
          type: 'category',
          label: 'Seed List Management',
          items: [
            {
              type: 'doc',
              id: 'configuration/seed-list-management-list',
              label: 'Seed List Management List',
            },
            'configuration/create-seed-list-management',
            'configuration/view-seed-list-management',
            'configuration/edit-seed-list-management',
          ],
        },
        {
          type: 'category',
          label: 'Offer Types',
          items: [
            {
              type: 'doc',
              id: 'configuration/offer-types-list',
              label: 'Offer Type List',
            },
            'configuration/create-offer-type',
            'configuration/view-offer-type',
            'configuration/edit-offer-type',
          ],
        },
        {
          type: 'category',
          label: 'Offer Catalogs',
          items: [
            'configuration/offer-catalog',
            'configuration/create-offer-catalog',
            'configuration/view-offer-catalog',
            'configuration/edit-offer-catalog',
          ],
        },
        {
          type: 'category',
          label: 'Offer Tracking Sources',
          items: [
            {
              type: 'doc',
              id: 'configuration/offer-tracking-sources-list',
              label: 'Offer Tracking Source List',
            },
            'configuration/create-offer-tracking-source',
            'configuration/view-offer-tracking-source',
            'configuration/edit-offer-tracking-source',
          ],
        },
        {
          type: 'category',
          label: 'Creative Templates',
          items: [
            {
              type: 'doc',
              id: 'configuration/creative-templates-list',
              label: 'Creative Template List',
            },
            'configuration/create-creative-template',
            'configuration/view-creative-template',
            'configuration/edit-creative-template',
          ],
        },
        {
          type: 'category',
          label: 'Reward Types',
          items: [
            {
              type: 'doc',
              id: 'configuration/reward-types-list',
              label: 'Reward Type List',
            },
            'configuration/create-reward-type',
            'configuration/view-reward-type',
            'configuration/edit-reward-type',
          ],
        },
        {
          type: 'category',
          label: 'Sender IDs',
          items: [
            {
              type: 'doc',
              id: 'configuration/sender-ids-list',
              label: 'Sender ID List',
            },
            'configuration/create-sender-id',
            'configuration/view-sender-id',
            'configuration/edit-sender-id',
          ],
        },
        {
          type: 'category',
          label: 'SMS Routes',
          items: [
            {
              type: 'doc',
              id: 'configuration/sms-routes-list',
              label: 'SMS Route List',
            },
            'configuration/create-sms-route',
            'configuration/view-sms-route',
            'configuration/edit-sms-route',
          ],
        },
        {
          type: 'category',
          label: 'Languages',
          items: [
            {
              type: 'doc',
              id: 'configuration/languages-list',
              label: 'Language List',
            },
            'configuration/create-language',
            'configuration/view-language',
            'configuration/edit-language',
          ],
        },
        {
          type: 'category',
          label: 'Character Sets',
          items: [
            {
              type: 'doc',
              id: 'configuration/character-sets-list',
              label: 'Character Set List',
            },
            'configuration/create-character-set',
            'configuration/view-character-set',
            'configuration/edit-character-set',
          ],
        },
        {
          type: 'category',
          label: 'Product Types',
          items: [
            {
              type: 'doc',
              id: 'configuration/product-types-list',
              label: 'Product Type List',
            },
            'configuration/create-product-type',
            'configuration/view-product-type',
            'configuration/edit-product-type',
          ],
        },
        {
          type: 'category',
          label: 'Combo Types',
          items: [
            {
              type: 'doc',
              id: 'configuration/combo-types-list',
              label: 'Combo Type List',
            },
            'configuration/create-combo-type',
            'configuration/view-combo-type',
            'configuration/edit-combo-type',
          ],
        },
        {
          type: 'category',
          label: 'Product Categories',
          items: [
            {
              type: 'doc',
              id: 'configuration/product-categories-list',
              label: 'Product Category List',
            },
            'configuration/create-product-category',
            'configuration/view-product-category',
            'configuration/edit-product-category',
          ],
        },
        {
          type: 'category',
          label: 'Product Catalogs',
          items: [
            'configuration/product-catalog',
            'configuration/create-product-catalog',
            'configuration/view-product-catalog',
            'configuration/edit-product-catalog',
          ],
        },
        {
          type: 'category',
          label: 'Segment Types',
          items: [
            {
              type: 'doc',
              id: 'configuration/segment-types-list',
              label: 'Segment Type List',
            },
            'configuration/create-segment-type',
            'configuration/view-segment-type',
            'configuration/edit-segment-type',
          ],
        },
        {
          type: 'category',
          label: 'Segment Catalogs',
          items: [
            'configuration/segment-catalog',
            'configuration/create-segment-catalog',
            'configuration/view-segment-catalog',
            'configuration/edit-segment-catalog',
          ],
        },
        {
          type: 'category',
          label: 'User Management',
          items: [
            {
              type: 'doc',
              id: 'configuration/user-management-list',
              label: 'User Management List',
            },
            'configuration/create-user-mgmt',
            'configuration/view-user-mgmt',
            'configuration/edit-user-mgmt',
          ],
        },
        {
          type: 'category',
          label: 'Settings',
          items: [
            {
              type: 'doc',
              id: 'configuration/settings-list',
              label: 'Settings List',
            },
            'configuration/create-setting',
            'configuration/view-setting',
            'configuration/edit-setting',
          ],
        },
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
