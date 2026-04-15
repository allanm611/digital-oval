type SidebarsConfig = {
  [key: string]: (string | Record<string, any>)[];
};

const sidebarsV1_1: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "category",
      label: "Authentication",
      items: [
        "authentication/overview",
        "authentication/login",
        "authentication/registration",
        "authentication/password-reset",
        "authentication/landing",
      ],
    },
    {
      type: "category",
      label: "Getting Started",
      items: [
        "getting-started/overview",
        "getting-started/dashboard",
        "getting-started/global-search",
      ],
    },
    {
      type: "category",
      label: "Campaign Management",
      items: [
        "campaigns/overview",
        {
          type: "category",
          label: "Campaigns",
          items: [
            {
              type: "doc",
              id: "campaigns/campaigns-list",
              label: "Campaign List",
            },
            "campaigns/create-campaign",
            "campaigns/edit-campaign",
            "campaigns/view-campaign-details",
            {
              type: "doc",
              id: "campaigns/campaign-reports",
              label: "Campaign Analytics",
            },
          ],
        },
        "campaigns/campaign-broadcasts",
        "campaigns/campaign-objectives",
        "campaigns/campaign-catalog",
        "campaigns/campaign-types",
      ],
    },
    {
      type: "category",
      label: "Offer Management",
      items: [
        "offers/overview",
        {
          type: "category",
          label: "Offers",
          items: [
            {
              type: "doc",
              id: "offers/offer-list",
              label: "Offer List",
            },
            "offers/create-offer",
            "offers/view-offer-details",
          ],
        },
        "offers/offer-catalog",
        "offers/offer-types",
      ],
    },
    {
      type: "category",
      label: "Product Management",
      items: [
        "products/overview",
        {
          type: "category",
          label: "Products",
          items: [
            {
              type: "doc",
              id: "products/products-list",
              label: "Product List",
            },
            "products/create-product",
            "products/view-product-details",
          ],
        },
        "products/product-catalog",
        "products/product-types",
      ],
    },
    {
      type: "category",
      label: "Segment Management",
      items: [
        "segments/overview",
        {
          type: "category",
          label: "Segments",
          items: [
            {
              type: "doc",
              id: "segments/segments-list",
              label: "Segment List",
            },
            "segments/create-segment",
            "segments/view-segment-details",
            "segments/segment-analytics",
          ],
        },
        "segments/segment-catalog",
        "segments/segment-types",
        {
          type: "category",
          label: "Quicklists",
          items: [
            {
              type: "doc",
              id: "segments/quicklists-list",
              label: "Quicklist List",
            },
            "segments/create-quicklist",
            "segments/view-quicklist",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Customer 360 Profile",
      items: [
        "customer-360/overview",
        {
          type: "category",
          label: "Customers",
          items: [
            {
              type: "doc",
              id: "customer-360/customers-list",
              label: "Customer List",
            },
            "customer-360/create-customer",
            "customer-360/view-customer-details",
          ],
        },
        {
          type: "category",
          label: "Customer Identity",
          items: [
            "customer-360/customer-identity",
            "customer-360/view-customer-identity-details",
          ],
        },
        {
          type: "category",
          label: "KPIs",
          items: [
            {
              type: "doc",
              id: "infrastructure/kpisoverview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "infrastructure/kpis-list",
              label: "All KPIs",
            },
            {
              type: "category",
              label: "Revenue Metrics",
              items: [
                "infrastructure/revenue-metrics-list",
                "infrastructure/create-revenue-metric",
                "infrastructure/view-revenue-metric",
              ],
            },
            {
              type: "category",
              label: "Usage Metrics",
              items: [
                "infrastructure/usage-metrics-list",
                "infrastructure/create-usage-metric",
                "infrastructure/view-usage-metric",
              ],
            },
            {
              type: "category",
              label: "System Events",
              items: [
                "infrastructure/system-events-list",
                "infrastructure/view-system-event",
              ],
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "User Management",
      items: [
        {
          type: "category",
          label: "Users",
          items: [
            {
              type: "doc",
              id: "users/users-list",
              label: "User List",
            },
            "users/create-user",
            "users/view-user-details",
            {
              type: "doc",
              id: "users/user-analytics",
              label: "User Analytics",
            },
          ],
        },
        {
          type: "category",
          label: "Access Control",
          items: [
            {
              type: "doc",
              id: "users/access-control",
              label: "Overview",
            },
            "users/unauthorized",
            "users/role-management",
            "users/permissions",
            "users/assign-permissions",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Manual Actions",
      items: [
        "manual-actions/overview",
        {
          type: "category",
          label: "Manual Rewards",
          items: [
            {
              type: "doc",
              id: "manual-actions/manual-rewards-list",
              label: "Manual Reward List",
            },
            "manual-actions/create-manual-reward",
            "manual-actions/view-manual-reward",
          ],
        },
        {
          type: "category",
          label: "Manual Communications",
          items: [
            {
              type: "doc",
              id: "manual-actions/manual-communications-list",
              label: "Manual Communication List",
            },
            "manual-actions/create-manual-communication",
            "manual-actions/view-manual-communication",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Reports & Analytics",
      items: [
        "reports/overview",
        "reports/overall-dashboard",
        "reports/customer-profile-reports",
        "reports/campaign-reports",
        "reports/offer-reports",
        "reports/segment-reports",
        "reports/sms-delivery-reports",
        "reports/delivery-email-reports",
      ],
    },
    {
      type: "category",
      label: "Infrastructure",
      items: [
        {
          type: "category",
          label: "Servers",
          items: [
            {
              type: "doc",
              id: "infrastructure/servers",
              label: "Overview",
            },
            {
              type: "doc",
              id: "infrastructure/servers-list",
              label: "Server List",
            },
            "infrastructure/create-server",
            "infrastructure/view-server",
          ],
        },
        {
          type: "category",
          label: "Connection Profiles",
          items: [
            {
              type: "doc",
              id: "infrastructure/connectionprofilesoverview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "infrastructure/connection-profiles-list",
              label: "Connection Profile List",
            },
            "infrastructure/create-connection-profile",
            "infrastructure/view-connection-profile",
          ],
        },
        {
          type: "category",
          label: "Data Connectors",
          items: [
            {
              type: "doc",
              id: "infrastructure/data-connectors-overview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "infrastructure/data-connectors-list",
              label: "Data Connector List",
            },
            "infrastructure/create-data-connector",
            "infrastructure/view-data-connector",
          ],
        },
        {
          type: "category",
          label: "ETL",
          items: [
            {
              type: "doc",
              id: "infrastructure/etloverview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "infrastructure/etl-file-registry",
              label: "File Registry",
            },
            {
              type: "doc",
              id: "infrastructure/etl-analytics",
              label: "Analytics",
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Job Management",
      items: [
        "jobs/overview",
        {
          type: "category",
          label: "Scheduled Jobs",
          items: [
            {
              type: "doc",
              id: "jobs/scheduled-jobs-list",
              label: "Scheduled Job List",
            },
            "jobs/create-scheduled-job",
            "jobs/view-scheduled-job",
            "jobs/scheduled-jobs-analytics",
          ],
        },
        {
          type: "category",
          label: "Job Executions",
          items: [
            {
              type: "doc",
              id: "jobs/job-executions-list",
              label: "Job Execution List",
            },
            "jobs/view-job-execution",
            "jobs/job-executions-analytics",
          ],
        },
        {
          type: "category",
          label: "Job Types",
          items: [
            {
              type: "doc",
              id: "jobs/job-types-list",
              label: "Job Type List",
            },
            "jobs/create-job-type",
            "jobs/view-job-type",
          ],
        },
        {
          type: "category",
          label: "Job Dependencies",
          items: [
            {
              type: "doc",
              id: "jobs/job-dependencies-list",
              label: "Job Dependency List",
            },
            "jobs/create-job-dependency",
            "jobs/view-job-dependency",
            "jobs/job-dependencies-analytics",
          ],
        },
        {
          type: "category",
          label: "Job Workflow Steps",
          items: [
            {
              type: "doc",
              id: "jobs/job-workflow-steps-list",
              label: "Job Workflow Step List",
            },
            "jobs/create-job-workflow-step",
            "jobs/view-job-workflow-step",
            "jobs/job-workflow-steps-analytics",
          ],
        },
        {
          type: "category",
          label: "Job Workflows",
          items: [
            {
              type: "doc",
              id: "jobs/job-workflows-list",
              label: "Job Workflow List",
            },
            "jobs/create-job-workflow",
            "jobs/edit-job-workflow",
            "jobs/view-job-workflow",
            "jobs/workflows-analytics",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Configuration",
      items: [
        "configuration/overview",
        "configuration/communication-channels",
        "configuration/campaign-communication-policy-list",
        "configuration/routes",
        "configuration/campaign-objectives",
        "configuration/departments",
        "configuration/line-of-business",
        "configuration/programs",
        "configuration/campaign-catalog",
        "configuration/campaign-types",
        {
          type: "category",
          label: "Universal Control Groups",
          items: [
            {
              type: "doc",
              id: "configuration/control-groups-overview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "configuration/control-groups-list",
              label: "Control Group List",
            },
            "configuration/create-control-group",
            "configuration/view-control-group",
          ],
        },
        "configuration/job-types",
        "configuration/dnd-management",
        "configuration/resource-types",
        "configuration/utility-configuration",
        {
          type: "category",
          label: "VIP List Management",
          items: [
            {
              type: "doc",
              id: "configuration/vip-list-management-overview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "configuration/vip-list-management-customers",
              label: "VIP Customers",
            },
            {
              type: "doc",
              id: "configuration/vip-list-management-lists",
              label: "Manage VIP Lists",
            },

          ],
        },
        "configuration/seed-list-management",
        "configuration/offer-types",
        "configuration/offer-catalog",
        "configuration/offer-tracking-sources",
        {
          type: "category",
          label: "Creative Templates",
          items: [
            {
              type: "doc",
              id: "configuration/creative-templates-overview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "configuration/creative-templates-list",
              label: "Creative Template List",
            },
            "configuration/create-creative-template",
            "configuration/view-creative-template",
          ],
        },
        "configuration/reward-types",
        "configuration/sender-ids",
        "configuration/sms-routes",
        {
          type: "doc",
          id: "configuration/languages",
          label: "Languages",
        },
        {
          type: "category",
          label: "Character Sets",
          items: [
            {
              type: "doc",
              id: "configuration/character-sets-overview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "configuration/character-sets-list",
              label: "Character Set List",
            },
            "configuration/create-character-set",
            "configuration/view-character-set",
          ],
        },
        "configuration/product-types",
        {
          type: "category",
          label: "Combo Types",
          items: [
            {
              type: "doc",
              id: "configuration/combo-types-overview",
              label: "Overview",
            },
            {
              type: "doc",
              id: "configuration/combo-types-list",
              label: "Combo Type List",
            },
            "configuration/create-combo-type",
            "configuration/view-combo-type",
          ],
        },
        "configuration/product-catalog",
        "configuration/segment-types",
        "configuration/segment-catalog",
        {
          type: "doc",
          id: "configuration/notification-types-list",
          label: "Notification Types",
        },
        "configuration/dynamic-message-variables",
      ],
    },
    {
      type: "category",
      label: "User Settings",
      items: [
        "user-settings/my-profile",
        "user-settings/settings",
        "user-settings/notifications",
      ],
    },
  ],
};

export default sidebarsV1_1;
