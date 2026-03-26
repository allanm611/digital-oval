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
          label: 'Campaigns List',
          items: [
            'campaigns/campaigns-list',
            'campaigns/create-campaign',
            'campaigns/view-campaign-details',
            'campaigns/campaign-reports',
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
          label: 'Offers List',
          items: [
            'offers/offers-list',
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
          label: 'Products List',
          items: [
            'products/products-list',
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
          label: 'Segments List',
          items: [
            'segments/segments-list',
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
          label: 'Quicklists List',
          items: [
            'segments/quicklists-list',
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
          label: 'Customers List',
          items: [
            'customer-360/customers-list',
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
      label: 'User Management List',
      items: [
        {
          type: 'category',
          label: 'Users List',
          items: [
            'users/users-list',
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
          label: 'Manual Rewards List',
          items: [
            'manual-actions/manual-rewards-list',
            'manual-actions/view-manual-reward',
            'manual-actions/edit-manual-reward',
          ],
        },
        {
          type: 'category',
          label: 'Manual Communications List',
          items: [
            'manual-actions/manual-communications-list',
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
          label: 'Servers List',
          items: [
            'infrastructure/servers-list',
            'infrastructure/create-server',
            'infrastructure/view-server',
            'infrastructure/edit-server',
          ],
        },
        {
          type: 'category',
          label: 'Connection Profiles List',
          items: [
            'infrastructure/connection-profiles-list',
            'infrastructure/create-connection-profile',
            'infrastructure/view-connection-profile',
            'infrastructure/edit-connection-profile',
          ],
        },
        {
          type: 'category',
          label: 'Data Connectors List',
          items: [
            'infrastructure/data-connectors-list',
            'infrastructure/create-data-connector',
            'infrastructure/view-data-connector',
            'infrastructure/edit-data-connector',
          ],
        },
        {
          type: 'category',
          label: 'KPIs List',
          items: [
            'infrastructure/kpis-list',
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
          label: 'Scheduled Jobs List',
          items: [
            'jobs/scheduled-jobs-list',
            'jobs/create-scheduled-job',
            'jobs/view-scheduled-job',
            'jobs/edit-scheduled-job',
          ],
        },
        {
          type: 'category',
          label: 'Job Executions List',
          items: [
            'jobs/job-executions-list',
            'jobs/view-job-execution',
          ],
        },
        {
          type: 'category',
          label: 'Job Types List',
          items: [
            'jobs/job-types-list',
            'jobs/create-job-type',
            'jobs/view-job-type',
          ],
        },
        {
          type: 'category',
          label: 'Job Dependencies List',
          items: [
            'jobs/job-dependencies-list',
            'jobs/create-job-dependency',
            'jobs/view-job-dependency',
          ],
        },
        {
          type: 'category',
          label: 'Job Workflow Steps List',
          items: [
            'jobs/job-workflow-steps-list',
            'jobs/view-job-workflow-step',
          ],
        },
        {
          type: 'category',
          label: 'Job Workflows List',
          items: [
            'jobs/job-workflows-list',
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
          label: 'Line of Business List',
          items: [
            'configuration/line-of-business-list',
            'configuration/create-line-of-business',
            'configuration/view-line-of-business',
            'configuration/edit-line-of-business',
          ],
        },
        {
          type: 'category',
          label: 'Campaign Communication Policy List',
          items: [
            'configuration/campaign-communication-policy-list',
            'configuration/create-campaign-communication-policy',
            'configuration/view-campaign-communication-policy',
            'configuration/edit-campaign-communication-policy',
          ],
        },
        {
          type: 'category',
          label: 'Communication Channels List',
          items: [
            'configuration/communication-channels-list',
            'configuration/create-communication-channel',
            'configuration/view-communication-channel',
            'configuration/edit-communication-channel',
          ],
        },
        {
          type: 'category',
          label: 'Routes List',
          items: [
            'configuration/routes-list',
            'configuration/create-route',
            'configuration/view-route',
            'configuration/edit-route',
          ],
        },
        {
          type: 'category',
          label: 'Campaign Objectives List',
          items: [
            'configuration/campaign-objectives-list',
            'configuration/create-campaign-objective',
            'configuration/view-campaign-objective',
            'configuration/edit-campaign-objective',
          ],
        },
        {
          type: 'category',
          label: 'Departments List',
          items: [
            'configuration/departments-list',
            'configuration/create-department',
            'configuration/view-department',
            'configuration/edit-department',
          ],
        },
        {
          type: 'category',
          label: 'Programs List',
          items: [
            'configuration/programs-list',
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
          label: 'Campaign Types List',
          items: [
            'configuration/campaign-types-list',
            'configuration/create-campaign-type',
            'configuration/view-campaign-type',
            'configuration/edit-campaign-type',
          ],
        },
        {
          type: 'category',
          label: 'Control Groups List',
          items: [
            'configuration/control-groups-list',
            'configuration/create-control-group',
            'configuration/view-control-group',
            'configuration/edit-control-group',
          ],
        },
        {
          type: 'category',
          label: 'Job Types List',
          items: [
            'configuration/job-types-list',
            'configuration/create-job-type',
            'configuration/view-job-type',
            'configuration/edit-job-type',
          ],
        },
        {
          type: 'category',
          label: 'DND Management List',
          items: [
            'configuration/dnd-management-list',
            'configuration/create-dnd-management',
            'configuration/view-dnd-management',
            'configuration/edit-dnd-management',
          ],
        },
        {
          type: 'category',
          label: 'VIP List Management List',
          items: [
            'configuration/vip-list-management-list',
            'configuration/create-vip-list-management',
            'configuration/view-vip-list-management',
            'configuration/edit-vip-list-management',
          ],
        },
        {
          type: 'category',
          label: 'Seed List Management List',
          items: [
            'configuration/seed-list-management-list',
            'configuration/create-seed-list-management',
            'configuration/view-seed-list-management',
            'configuration/edit-seed-list-management',
          ],
        },
        {
          type: 'category',
          label: 'Offer Types List',
          items: [
            'configuration/offer-types-list',
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
          label: 'Offer Tracking Sources List',
          items: [
            'configuration/offer-tracking-sources-list',
            'configuration/create-offer-tracking-source',
            'configuration/view-offer-tracking-source',
            'configuration/edit-offer-tracking-source',
          ],
        },
        {
          type: 'category',
          label: 'Creative Templates List',
          items: [
            'configuration/creative-templates-list',
            'configuration/create-creative-template',
            'configuration/view-creative-template',
            'configuration/edit-creative-template',
          ],
        },
        {
          type: 'category',
          label: 'Reward Types List',
          items: [
            'configuration/reward-types-list',
            'configuration/create-reward-type',
            'configuration/view-reward-type',
            'configuration/edit-reward-type',
          ],
        },
        {
          type: 'category',
          label: 'Sender IDs List',
          items: [
            'configuration/sender-ids-list',
            'configuration/create-sender-id',
            'configuration/view-sender-id',
            'configuration/edit-sender-id',
          ],
        },
        {
          type: 'category',
          label: 'SMS Routes List',
          items: [
            'configuration/sms-routes-list',
            'configuration/create-sms-route',
            'configuration/view-sms-route',
            'configuration/edit-sms-route',
          ],
        },
        {
          type: 'category',
          label: 'Languages List',
          items: [
            'configuration/languages-list',
            'configuration/create-language',
            'configuration/view-language',
            'configuration/edit-language',
          ],
        },
        {
          type: 'category',
          label: 'Character Sets List',
          items: [
            'configuration/character-sets-list',
            'configuration/create-character-set',
            'configuration/view-character-set',
            'configuration/edit-character-set',
          ],
        },
        {
          type: 'category',
          label: 'Product Types List',
          items: [
            'configuration/product-types-list',
            'configuration/create-product-type',
            'configuration/view-product-type',
            'configuration/edit-product-type',
          ],
        },
        {
          type: 'category',
          label: 'Combo Types List',
          items: [
            'configuration/combo-types-list',
            'configuration/create-combo-type',
            'configuration/view-combo-type',
            'configuration/edit-combo-type',
          ],
        },
        {
          type: 'category',
          label: 'Product Categories List',
          items: [
            'configuration/product-categories-list',
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
          label: 'Segment Types List',
          items: [
            'configuration/segment-types-list',
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
          label: 'User Management List',
          items: [
            'configuration/user-management-list',
            'configuration/create-user-mgmt',
            'configuration/view-user-mgmt',
            'configuration/edit-user-mgmt',
          ],
        },
        {
          type: 'category',
          label: 'Settings List',
          items: [
            'configuration/settings-list',
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
