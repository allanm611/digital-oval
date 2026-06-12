#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filesToRefactor = [
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/CampaignCategoriesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/CampaignDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/CampaignFlowDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/CampaignsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/CommunicationPolicyDetailPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/CommunicationPolicyPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/DNDBulkManagementPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/DNDChannelPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/ProgramDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/ProgramsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/SeedListManagementPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/campaigns/pages/VIPListManagementPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/communications/components/TemplateSelector.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/configurations/components/ConfigurationManager/ConfigurationManagerAPI.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/configurations/components/ConfigurationManager/ConfigurationManager.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/configurations/pages/CommunicationChannelDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/configurations/pages/GatewayConfigurationsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/configurations/pages/NotificationTypesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/configurations/pages/TeamRolesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/connection-profiles/pages/ConnectionProfilesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/control-groups/pages/ControlGroupDetailPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/control-groups/pages/ControlGroupsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/customers360/pages/CustomerDetailPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/customers360/pages/CustomersPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/data-connectors/pages/DataConnectorDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/data-connectors/pages/DataConnectors.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/docs/pages/EditDocsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/docs/pages/ManageSidebarPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/JobDependenciesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/JobWorkflowStepDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/JobWorkflowStepsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/ScheduledJobDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/ScheduledJobsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/WorkflowDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/jobs/pages/WorkflowsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/kpis/components/KpiCategoriesListPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/kpis/pages/AllKPIsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/kpis/pages/SubscriberProfileListPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/manual-broadcast/pages/ManualBroadcastListsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/manual-rewards/pages/ManualRewardsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/notifications/pages/NotificationsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/CategoryDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/CharacterSetDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/CreativeTemplateDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/CreativeTemplatesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/EmailRoutesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/LanguagesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/OfferCategoriesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/OfferCreativesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/offers/pages/OfferDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/products/pages/ComboTypeDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/products/pages/ComboTypesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/products/pages/ProductCategoriesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/products/pages/ProductDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/products/pages/ProductsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/quicklists/pages/QuickListDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/quicklists/pages/QuickListsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/routes/pages/PushNotificationRouteDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/routes/pages/RouteDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/routes/pages/WhatsAppRouteDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/segments/pages/SegmentCategoriesPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/segments/pages/SegmentDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/segments/pages/SegmentManagementPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/servers/pages/ServerDetailsPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/servers/pages/ServersPage.tsx',
  '/home/mirembe/Desktop/Projects/CVM/Sentra_cvm_front/src/features/users/pages/UserManagementPage.tsx',
];

let processedCount = 0;
let skippedCount = 0;
let errorCount = 0;

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already refactored
    if (content.includes('useDeleteConfirm')) {
      return { status: 'skipped', reason: 'already refactored' };
    }

    // Check if it uses DeleteConfirmModal
    if (!content.includes('DeleteConfirmModal')) {
      return { status: 'skipped', reason: 'no DeleteConfirmModal usage' };
    }

    // Extract component name
    const componentMatch = content.match(/export\s+(?:default\s+)?function\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'Component';

    // Find delete-related state patterns
    const deleteStatePatterns = [
      /const\s+\[show(?:Delete)?Modal,\s*set(?:Show)?(?:Delete)?Modal\]\s*=\s*useState\s*\(/g,
      /const\s+\[(?:is)?Deleting,\s*set(?:Is)?Deleting\]\s*=\s*useState\s*\(/g,
      /const\s+\[(?:\w*[Tt]o)?[Dd]elete\w*,\s*set(?:\w*[Tt]o)?[Dd]elete\w*\]\s*=\s*useState\s*\(/g,
    ];

    const hasDeleteState = deleteStatePatterns.some(pattern => pattern.test(content));

    return {
      status: 'needs_refactor',
      component: componentName,
      hasDeleteState,
    };
  } catch (error) {
    return { status: 'error', reason: error.message };
  }
}

console.log('Analyzing files for refactoring...\n');

const analysis = {};
filesToRefactor.forEach(file => {
  const result = analyzeFile(file);
  const filename = path.basename(file);

  if (result.status === 'skipped') {
    skippedCount++;
  } else if (result.status === 'needs_refactor') {
    processedCount++;
    analysis[filename] = result;
  } else if (result.status === 'error') {
    errorCount++;
  }
});

console.log(`Summary:`);
console.log(`  ✅ Needs refactor: ${processedCount}`);
console.log(`  ⏭️  Already done: ${skippedCount}`);
console.log(`  ❌ Errors: ${errorCount}`);
console.log(`\nFiles needing refactoring (${processedCount}):`);

Object.entries(analysis).slice(0, 20).forEach(([file, info]) => {
  console.log(`  - ${file}`);
});

if (processedCount > 20) {
  console.log(`  ... and ${processedCount - 20} more`);
}
