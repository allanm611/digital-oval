#!/usr/bin/env node

/**
 * Generate detailed refactoring report for all 58 files.
 * Creates individual instruction files for each file needing refactoring.
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

function extractDeletePatterns(content, filePath) {
  const patterns = {
    deleteStateVars: [],
    deleteHandlers: [],
    serviceMethod: null,
    modalUsage: null,
  };

  // Find delete-related state variables
  const stateRegex = /const \[(show\w*Delete\w*|is\w*Deleting|\w*ToDelete)\s*,\s*set\w+\]\s*=\s*useState/g;
  let match;
  while ((match = stateRegex.exec(content)) !== null) {
    patterns.deleteStateVars.push(match[1]);
  }

  // Find delete handlers
  const handlerRegex = /const (handle\w*Delete\w*|handleConfirmDelete|handleCancelDelete)\s*=/g;
  while ((match = handlerRegex.exec(content)) !== null) {
    patterns.deleteHandlers.push(match[1]);
  }

  // Try to find service method
  const serviceRegex = /\.delete\w+\(/g;
  while ((match = serviceRegex.exec(content)) !== null) {
    const methodName = match[0].replace(/\./g, "").replace(/\(/g, "");
    if (!patterns.serviceMethod) {
      patterns.serviceMethod = methodName;
    }
  }

  // Check for DeleteConfirmModal usage
  if (content.includes("DeleteConfirmModal")) {
    patterns.modalUsage = "found";
  }

  return patterns;
}

function generateReport(filePath, patterns) {
  const fileName = path.basename(filePath);
  const hasPatterns =
    patterns.deleteStateVars.length > 0 ||
    patterns.deleteHandlers.length > 0 ||
    patterns.modalUsage;

  if (!hasPatterns) {
    return null;
  }

  return {
    file: filePath,
    fileName,
    patterns,
  };
}

function main() {
  console.log("================================================================================");
  console.log("Refactoring Report Generator");
  console.log("================================================================================\n");

  const reports = [];
  let filesWithPatterns = 0;
  let filesScanned = 0;

  for (const filePath of FILES_TO_REFACTOR) {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`[SKIP] ${path.basename(filePath)} - File not found`);
      continue;
    }

    filesScanned++;
    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const patterns = extractDeletePatterns(content, filePath);
      const report = generateReport(filePath, patterns);

      if (report) {
        filesWithPatterns++;
        reports.push(report);
        console.log(`[FOUND] ${report.fileName}`);
        if (patterns.deleteStateVars.length > 0) {
          console.log(`        State vars: ${patterns.deleteStateVars.join(", ")}`);
        }
        if (patterns.deleteHandlers.length > 0) {
          console.log(`        Handlers: ${patterns.deleteHandlers.join(", ")}`);
        }
        if (patterns.serviceMethod) {
          console.log(`        Service: ${patterns.serviceMethod}`);
        }
      } else {
        console.log(`[SKIP] ${path.basename(filePath)} - No patterns`);
      }
    } catch (err) {
      console.log(`[ERROR] ${path.basename(filePath)} - ${err.message}`);
    }
  }

  // Generate master report
  const reportPath = path.join(process.cwd(), "REFACTORING_REPORT.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalFiles: FILES_TO_REFACTOR.length,
        filesScanned,
        filesWithPatterns,
        reports,
      },
      null,
      2
    )
  );

  console.log("\n================================================================================");
  console.log("SUMMARY");
  console.log("================================================================================");
  console.log(`Files scanned:       ${filesScanned}`);
  console.log(`Files with patterns: ${filesWithPatterns}`);
  console.log(`Report saved to:     ${reportPath}`);

  // Generate per-file instruction sheets
  for (const report of reports) {
    const instructionFile = path.join(
      process.cwd(),
      `.refactor-instructions/${report.fileName}.md`
    );

    // Create directory if needed
    const dir = path.dirname(instructionFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const instructions = `# Refactoring Instructions for ${report.fileName}

## File: ${report.file}

### Delete State Variables to Remove
${report.patterns.deleteStateVars.map((v) => `- [ ] ${v}`).join("\n")}

### Delete Handlers to Replace
${report.patterns.deleteHandlers.map((h) => `- [ ] ${h}()`).join("\n")}

### Service Method(s)
${report.patterns.serviceMethod ? `- ${report.patterns.serviceMethod}()` : "- Unknown"}

### DeleteConfirmModal Usage
${report.patterns.modalUsage ? "- ✓ Found and needs update" : "- Not found"}

### Refactoring Steps
1. [ ] Backup file in git
2. [ ] Remove state variables listed above
3. [ ] Replace handlers with itemActionHandler factory
4. [ ] Update DeleteConfirmModal component props
5. [ ] Run TypeScript type check
6. [ ] Test delete functionality
7. [ ] Verify modal opens/closes correctly
8. [ ] Verify toast notifications work
9. [ ] Commit changes

### Notes
- Reference implementation: CampaignCategoriesPage.tsx
- Similar pattern files to review for insights
- Check service module for exact method signature
`;

    fs.writeFileSync(instructionFile, instructions);
  }

  console.log(
    `Instruction files created in: .refactor-instructions/`
  );

  return 0;
}

process.exit(main());
