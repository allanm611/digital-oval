#!/usr/bin/env node

/**
 * Batch refactoring script for delete-related UI patterns across TSX files.
 *
 * This script:
 * 1. Identifies files with delete-related patterns
 * 2. Reports which files have these patterns
 * 3. Provides a summary for manual or automated refactoring
 */

const fs = require("fs");
const path = require("path");

const FILES_TO_REFACTOR = [
  "src/features/campaigns/pages/CampaignDetailsPage.tsx",
  "src/features/campaigns/pages/CampaignsPage.tsx",
  "src/features/campaigns/pages/CommunicationPolicyDetailPage.tsx",
  "src/features/campaigns/pages/CommunicationPolicyPage.tsx",
  "src/features/campaigns/pages/DNDBulkManagementPage.tsx",
  "src/features/campaigns/pages/DNDChannelPage.tsx",
  "src/features/campaigns/pages/ProgramDetailsPage.tsx",
  "src/features/campaigns/pages/ProgramsPage.tsx",
  "src/features/campaigns/pages/SeedListManagementPage.tsx",
  "src/features/campaigns/pages/VIPListManagementPage.tsx",
  "src/features/communications/components/TemplateSelector.tsx",
  "src/features/configurations/components/ConfigurationManager/ConfigurationManagerAPI.tsx",
  "src/features/configurations/components/ConfigurationManager/ConfigurationManager.tsx",
  "src/features/configurations/pages/CommunicationChannelDetailsPage.tsx",
  "src/features/configurations/pages/GatewayConfigurationsPage.tsx",
  "src/features/configurations/pages/NotificationTypesPage.tsx",
  "src/features/configurations/pages/TeamRolesPage.tsx",
  "src/features/connection-profiles/pages/ConnectionProfilesPage.tsx",
  "src/features/control-groups/pages/ControlGroupDetailPage.tsx",
  "src/features/control-groups/pages/ControlGroupsPage.tsx",
  "src/features/customers360/pages/CustomerDetailPage.tsx",
  "src/features/customers360/pages/CustomersPage.tsx",
  "src/features/data-connectors/pages/DataConnectorDetailsPage.tsx",
  "src/features/data-connectors/pages/DataConnectors.tsx",
  "src/features/docs/pages/EditDocsPage.tsx",
  "src/features/docs/pages/ManageSidebarPage.tsx",
  "src/features/jobs/pages/JobDependenciesPage.tsx",
  "src/features/jobs/pages/JobWorkflowStepDetailsPage.tsx",
  "src/features/jobs/pages/JobWorkflowStepsPage.tsx",
  "src/features/jobs/pages/ScheduledJobDetailsPage.tsx",
  "src/features/jobs/pages/ScheduledJobsPage.tsx",
  "src/features/jobs/pages/WorkflowDetailsPage.tsx",
  "src/features/jobs/pages/WorkflowsPage.tsx",
  "src/features/kpis/components/KpiCategoriesListPage.tsx",
  "src/features/kpis/pages/AllKPIsPage.tsx",
  "src/features/kpis/pages/SubscriberProfileListPage.tsx",
  "src/features/manual-broadcast/pages/ManualBroadcastListsPage.tsx",
  "src/features/manual-rewards/pages/ManualRewardsPage.tsx",
  "src/features/notifications/pages/NotificationsPage.tsx",
  "src/features/offers/pages/CategoryDetailsPage.tsx",
  "src/features/offers/pages/CharacterSetDetailsPage.tsx",
  "src/features/offers/pages/CreativeTemplateDetailsPage.tsx",
  "src/features/offers/pages/CreativeTemplatesPage.tsx",
  "src/features/offers/pages/EmailRoutesPage.tsx",
  "src/features/offers/pages/LanguagesPage.tsx",
  "src/features/offers/pages/OfferCategoriesPage.tsx",
  "src/features/offers/pages/OfferCreativesPage.tsx",
  "src/features/offers/pages/OfferDetailsPage.tsx",
  "src/features/products/pages/ComboTypeDetailsPage.tsx",
  "src/features/products/pages/ComboTypesPage.tsx",
  "src/features/products/pages/ProductCategoriesPage.tsx",
  "src/features/products/pages/ProductDetailsPage.tsx",
  "src/features/products/pages/ProductsPage.tsx",
  "src/features/quicklists/pages/QuickListDetailsPage.tsx",
  "src/features/quicklists/pages/QuickListsPage.tsx",
  "src/features/routes/pages/PushNotificationRouteDetailsPage.tsx",
  "src/features/routes/pages/RouteDetailsPage.tsx",
  "src/features/routes/pages/WhatsAppRouteDetailsPage.tsx",
  "src/features/segments/pages/SegmentCategoriesPage.tsx",
  "src/features/segments/pages/SegmentDetailsPage.tsx",
  "src/features/segments/pages/SegmentManagementPage.tsx",
  "src/features/servers/pages/ServerDetailsPage.tsx",
  "src/features/servers/pages/ServersPage.tsx",
  "src/features/users/pages/UserManagementPage.tsx",
];

// Pattern detection
const PATTERNS = {
  showDeleteModal: /showDeleteModal|setShowDeleteModal/,
  itemToDelete: /ItemToDelete|CategoryToDelete|EntityToDelete/,
  handleDelete: /handleDelete\w+|handleConfirmDelete/,
  isDeleting: /isDeleting/,
  deleteConfirmModal: /DeleteConfirmModal/,
};

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const patterns = {};

    for (const [key, pattern] of Object.entries(PATTERNS)) {
      patterns[key] = pattern.test(content);
    }

    const hasAnyPattern = Object.values(patterns).some((v) => v);

    return {
      exists: true,
      content,
      patterns,
      hasPatterns: hasAnyPattern,
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
    };
  }
}

function main() {
  console.log("================================================================================");
  console.log("Delete Pattern Refactoring Scanner");
  console.log(`Total files to scan: ${FILES_TO_REFACTOR.length}`);
  console.log("================================================================================\n");

  let filesWithPatterns = 0;
  let filesScanned = 0;
  let filesNotFound = 0;
  const reportData = [];

  for (const filePath of FILES_TO_REFACTOR) {
    const fullPath = path.join(__dirname, filePath);
    const result = scanFile(fullPath);
    const fileName = path.basename(filePath);

    if (!result.exists) {
      filesNotFound++;
      console.log(`[SKIP] ${fileName} - File not found`);
      continue;
    }

    filesScanned++;

    if (result.hasPatterns) {
      filesWithPatterns++;
      const patternsList = Object.entries(result.patterns)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ");

      console.log(`[FOUND] ${fileName}`);
      console.log(`        Patterns: ${patternsList}`);

      reportData.push({
        file: filePath,
        patterns: result.patterns,
      });
    } else {
      console.log(`[SKIP] ${fileName} - No delete patterns`);
    }
  }

  console.log("\n================================================================================");
  console.log("SUMMARY");
  console.log("================================================================================");
  console.log(`Files scanned:       ${filesScanned}`);
  console.log(`Files with patterns: ${filesWithPatterns}`);
  console.log(`Files not found:     ${filesNotFound}`);
  console.log(`Total files:         ${FILES_TO_REFACTOR.length}`);

  if (filesWithPatterns > 0) {
    console.log("\nFiles requiring refactoring:");
    reportData.forEach((item) => {
      console.log(`  - ${item.file}`);
    });
  }

  return filesWithPatterns > 0 ? 0 : 1;
}

process.exit(main());
