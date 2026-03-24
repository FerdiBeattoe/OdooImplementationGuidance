import {
  classifyActionSafety,
  DOMAINS,
  getAllDomainCapabilities,
  getDomainCapability,
  renderDomainCapabilityLevel,
  getAccountingEvidenceLabel,
  getCompactDownstreamImpactSummary,
  getAccountingReadinessSummary,
  getCrmEvidenceLabel,
  getCrmEvidenceSufficiency,
  getCrmReadinessSummary,
  getInventoryEvidenceSufficiency,
  getManufacturingEvidenceLabel,
  getManufacturingEvidenceSufficiency,
  getManufacturingReadinessSummary,
  getPosEvidenceLabel,
  getPosEvidenceSufficiency,
  getPosReadinessSummary,
  getPurchaseEvidenceLabel,
  getPurchaseEvidenceSufficiency,
  getPurchaseReadinessSummary,
  getInventoryReadinessSummary,
  getSalesEvidenceLabel,
  getSalesEvidenceSufficiency,
  getSalesReadinessSummary,
  getWebsiteEcommerceEvidenceLabel,
  getWebsiteEcommerceEvidenceSufficiency,
  getWebsiteEcommerceReadinessSummary,
  SAMPLE_GUIDANCE_BLOCKS
} from "/shared/index.js";
import { el } from "../lib/dom.js";
import { renderCheckpointPanel } from "../components/checkpoint-panel.js";
import { renderGuidanceBlock } from "../components/guidance-block.js";
import { renderGridBuilderShell } from "../components/grid-builder-shell.js";
import { renderStatusBadge } from "../components/status-badge.js";
import { renderDomainProgress } from "../components/progress-wizard.js";

const DOMAIN_GUIDANCE = {
  accounting: SAMPLE_GUIDANCE_BLOCKS.accountingPolicyCapture,
  crm: SAMPLE_GUIDANCE_BLOCKS.crmLeadOpportunityModel,
  "foundation-company-localization": SAMPLE_GUIDANCE_BLOCKS.foundationLocalization,
  inventory: SAMPLE_GUIDANCE_BLOCKS.inventory,
  "master-data": SAMPLE_GUIDANCE_BLOCKS.masterDataOwnership,
  "manufacturing-mrp": SAMPLE_GUIDANCE_BLOCKS.manufacturingProcessMode,
  pos: SAMPLE_GUIDANCE_BLOCKS.pos,
  projects: SAMPLE_GUIDANCE_BLOCKS.projectsStructureBaseline,
  hr: SAMPLE_GUIDANCE_BLOCKS.hrEmployeeStructure,
  plm: SAMPLE_GUIDANCE_BLOCKS.plmChangeControlBaseline,
  purchase: SAMPLE_GUIDANCE_BLOCKS.purchaseProcessMode,
  quality: SAMPLE_GUIDANCE_BLOCKS.qualityControlBaseline,
  sales: SAMPLE_GUIDANCE_BLOCKS.salesProcessMode,
  documents: SAMPLE_GUIDANCE_BLOCKS.documentsWorkspaceGovernance,
  sign: SAMPLE_GUIDANCE_BLOCKS.signTemplateGovernance,
  approvals: SAMPLE_GUIDANCE_BLOCKS.approvalsStructureBaseline,
  "website-ecommerce": SAMPLE_GUIDANCE_BLOCKS.websiteScopeBaseline,
  "users-roles-security": SAMPLE_GUIDANCE_BLOCKS.roles
};

const SUPPORT_ONLY_CAPABILITY_NOTE =
  "Structured capture is not expanded for this slice yet. Use the capability panel above for the live capabilities available in this build (inspection, preview, and where approved, bounded execution).";

export function renderDomainsView({
  project,
  scaffoldGroups,
  manufacturingGroups,
  manufacturingConfigurationSections,
  masterDataConfigurationSections,
  crmGroups,
  crmConfigurationSections,
  websiteGroups,
  websiteConfigurationSections,
  posGroups,
  posConfigurationSections,
  projectsGroups,
  hrGroups,
  plmGroups,
  qualityGroups,
  documentsGroups,
  signGroups,
  approvalsGroups,
  purchaseGroups,
  purchaseConfigurationSections,
  salesGroups,
  salesConfigurationSections,
  accountingGroups,
  accountingConfigurationSections,
  inventoryGroups,
  inventoryConfigurationSections,
  onUpdateCheckpoint,
  onDeferCheckpoint,
  onAddManufacturingConfiguration,
  onAddMasterDataConfiguration,
  onAddCrmConfiguration,
  onAddWebsiteEcommerceConfiguration,
  onAddPosConfiguration,
  onAddSalesConfiguration,
  onAddPurchaseConfiguration,
  onAddAccountingConfiguration,
  onAddInventoryConfiguration,
  onUpdateManufacturingConfiguration,
  onUpdateMasterDataConfiguration,
  onUpdateCrmConfiguration,
  onUpdateWebsiteEcommerceConfiguration,
  onUpdatePosConfiguration,
  onUpdateSalesConfiguration,
  onUpdatePurchaseConfiguration,
  onUpdateManufacturingEvidence,
  onUpdateCrmEvidence,
  onUpdateWebsiteEcommerceEvidence,
  onUpdatePosEvidence,
  onUpdatePurchaseEvidence,
  onUpdateSalesEvidence,
  onUpdateAccountingConfiguration,
  onUpdateAccountingEvidence,
  onUpdateInventoryConfiguration,
  onUpdateInventoryEvidence,
  onSelectDomain,
  onInspectDomain,
  onPreviewDomain,
  onExecutePreview
}) {
  const selectedDomain = DOMAINS.find((domain) => domain.id === project.workflowState.currentDomainId) || DOMAINS[0];
  const capabilityMap = new Map(getAllDomainCapabilities(project).map((item) => [item.domainId, item]));
  const selectedCapability = getDomainCapability(project, selectedDomain.id);
  const guidance = DOMAIN_GUIDANCE[selectedDomain.id] || SAMPLE_GUIDANCE_BLOCKS.roles;
  const scaffoldPanel = ["foundation-company-localization", "users-roles-security"].includes(selectedDomain.id)
    ? renderScaffoldDomainControls(project, selectedDomain, scaffoldGroups, onUpdateCheckpoint)
    : null;
  const masterDataPanel = selectedDomain.id === "master-data"
    ? renderMasterDataDomainControls(
        project,
        scaffoldGroups,
        masterDataConfigurationSections,
        onUpdateCheckpoint,
        onAddMasterDataConfiguration,
        onUpdateMasterDataConfiguration
      )
    : null;
  const foundationOnlyPanel = ({
    projects: renderSupportOnlyDomainControls(
      project,
      "Projects checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      projectsGroups,
      onUpdateCheckpoint
    ),
    hr: renderSupportOnlyDomainControls(
      project,
      "HR checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      hrGroups,
      onUpdateCheckpoint
    ),
    plm: renderSupportOnlyDomainControls(
      project,
      "PLM checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      plmGroups,
      onUpdateCheckpoint
    ),
    quality: renderSupportOnlyDomainControls(
      project,
      "Quality checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      qualityGroups,
      onUpdateCheckpoint
    ),
    documents: renderSupportOnlyDomainControls(
      project,
      "Documents checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      documentsGroups,
      onUpdateCheckpoint
    ),
    sign: renderSupportOnlyDomainControls(
      project,
      "Sign checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      signGroups,
      onUpdateCheckpoint
    ),
    approvals: renderSupportOnlyDomainControls(
      project,
      "Approvals checkpoint foundations",
      SUPPORT_ONLY_CAPABILITY_NOTE,
      approvalsGroups,
      onUpdateCheckpoint
    )
  })[selectedDomain.id] || null;
  const crmPanel = selectedDomain.id === "crm"
    ? renderCrmDomainControls(
        project,
        crmGroups,
        crmConfigurationSections,
        onUpdateCheckpoint,
        onAddCrmConfiguration,
        onUpdateCrmConfiguration,
        onUpdateCrmEvidence
      )
    : null;
  const websitePanel = selectedDomain.id === "website-ecommerce"
    ? renderWebsiteEcommerceDomainControls(
        project,
        websiteGroups,
        websiteConfigurationSections,
        onUpdateCheckpoint,
        onAddWebsiteEcommerceConfiguration,
        onUpdateWebsiteEcommerceConfiguration,
        onUpdateWebsiteEcommerceEvidence
      )
    : null;
  const salesPanel = selectedDomain.id === "sales"
    ? renderSalesDomainControls(
        project,
        salesGroups,
        salesConfigurationSections,
        onUpdateCheckpoint,
        onAddSalesConfiguration,
        onUpdateSalesConfiguration,
        onUpdateSalesEvidence
      )
    : null;
  const purchasePanel = selectedDomain.id === "purchase"
    ? renderPurchaseDomainControls(
        project,
        purchaseGroups,
        purchaseConfigurationSections,
        onUpdateCheckpoint,
        onAddPurchaseConfiguration,
        onUpdatePurchaseConfiguration,
        onUpdatePurchaseEvidence
      )
    : null;
  const manufacturingPanel = selectedDomain.id === "manufacturing-mrp"
    ? renderManufacturingDomainControls(
        project,
        manufacturingGroups,
        manufacturingConfigurationSections,
        onUpdateCheckpoint,
        onAddManufacturingConfiguration,
        onUpdateManufacturingConfiguration,
        onUpdateManufacturingEvidence
      )
    : null;
  const posPanel = selectedDomain.id === "pos"
    ? renderPosDomainControls(
        project,
        posGroups,
        posConfigurationSections,
        onUpdateCheckpoint,
        onAddPosConfiguration,
        onUpdatePosConfiguration,
        onUpdatePosEvidence
      )
    : null;
  const accountingPanel = selectedDomain.id === "accounting"
    ? renderAccountingDomainControls(
        project,
        accountingGroups,
        accountingConfigurationSections,
        onUpdateCheckpoint,
        onAddAccountingConfiguration,
        onUpdateAccountingConfiguration,
        onUpdateAccountingEvidence
      )
    : null;
  const inventoryPanel = selectedDomain.id === "inventory"
    ? renderInventoryDomainControls(
        project,
        inventoryGroups,
        inventoryConfigurationSections,
        onUpdateCheckpoint,
        onDeferCheckpoint,
        onAddInventoryConfiguration,
        onUpdateInventoryConfiguration,
        onUpdateInventoryEvidence
      )
    : null;

  return el("section", { className: "workspace" }, [
    header("Explore Setup Areas", "Jump directly into specific areas of your business setup. Everything here works together to build your final Odoo 19 system."),
    renderDomainProgress({
      domains: DOMAINS,
      currentDomainId: project.workflowState.currentDomainId,
      checkpoints: project.checkpoints,
      onSelectDomain
    }),
    el(
      "div",
      { className: "list-grid" },
      DOMAINS.map((domain) =>
        {
          const capability = capabilityMap.get(domain.id);
          return el(
          "button",
          {
            className: `list-card ${domain.id === selectedDomain.id ? "list-card--active" : ""}`,
            onclick: () => onSelectDomain(domain.id)
          },
          [
            el("h3", { text: domain.label }),
            renderStatusBadge(findStatus(project.domains, domain.id)),
            el("p", { className: "subtle", text: formatDomainCapabilityCardLine(capability) })
          ]
        );
        }
      )
    ),
    renderCapabilityPanel(project, selectedDomain.id, selectedCapability, onInspectDomain, onPreviewDomain, onExecutePreview),
    renderGuidanceBlock(guidance),
    scaffoldPanel,
    masterDataPanel,
    foundationOnlyPanel,
    crmPanel,
    websitePanel,
    manufacturingPanel,
    posPanel,
    purchasePanel,
    salesPanel,
    accountingPanel,
    inventoryPanel
  ]);
}

function renderCapabilityPanel(project, domainId, capability, onInspectDomain, onPreviewDomain, onExecutePreview) {
  const inspection = project.inspectionState?.domains?.[domainId];
  const previews = (project.previewState?.previews || []).filter((preview) => preview.domainId === domainId).slice(-5).reverse();
  const lastExecution = (project.executionState?.executions || []).filter((execution) => execution.domainId === domainId).slice(-1)[0];

  return el("section", { className: "panel panel--strong" }, [
    el("h3", { text: "What this guide can do" }),
    el("p", { className: "status-line", text: `Current: ${capability.label}` }),
    el("p", { text: `This build supports: ${capability.targetLabel}. ${capability.summary}` }),
    el("div", { className: "summary-grid" }, [
      summaryCard("Check your Odoo", capability.supportsInspection ? "Available" : "Not available"),
      summaryCard("Review changes", capability.supportsPreview ? "Available" : "Not available"),
      summaryCard("Apply changes", capability.supportsExecution ? "Guided and safe" : "Not available")
    ]),
    renderCapabilityBoundaryNote(capability),
    el("div", { className: "hero-panel__actions" }, [
      heroButton("Check your Odoo setup", () => onInspectDomain(domainId), { disabled: !capability.supportsInspection }),
      heroButton("Review what would change", () => onPreviewDomain(domainId), { disabled: !capability.supportsPreview })
    ]),
    !capability.supportsInspection
      ? el("p", { className: "checkpoint-panel__dependency", text: "Live connection not available for this area in the current build." })
      : null,
    !capability.supportsPreview
      ? el("p", { className: "checkpoint-panel__dependency", text: "Change review not available for this area in the current build." })
      : null,
    inspection
      ? el("div", { className: "info-box" }, [
          el("strong", { text: "Latest check" }),
          el("p", { text: inspection.summary || "Your Odoo has been checked." })
        ])
      : el("p", { className: "checkpoint-panel__dependency", text: "No live check has been done for this area yet." }),
    previews.length
      ? el(
          "div",
          { className: "stack" },
          previews.map((preview) =>
            el("section", { className: "checkpoint-panel" }, [
              el("h4", { text: preview.title }),
              el("p", { text: `This would ${preview.operation === "create" ? "create" : "update"}: ${preview.title}` }),
              preview.intendedChanges.length
                ? el("p", { className: "checkpoint-panel__dependency", 
                    text: `Fields affected: ${preview.intendedChanges.map(c => c.field).join(", ")}` })
                : null,
              preview.confirmationRequired
                ? el("p", { className: "info-box", text: "⚠️ This change needs your explicit approval first." })
                : null,
              preview.downstreamImpact
                ? el("p", { className: "checkpoint-panel__dependency", text: `Impact: ${preview.downstreamImpact}` })
                : null,
              canExecutePreview(preview, capability)
                ? heroButton("Apply this change", () => onExecutePreview(preview))
                : el("p", { className: "checkpoint-panel__dependency", text: getPreviewExecutionConstraint(preview, capability) })
            ])
          )
        )
      : null,
    lastExecution
      ? el("div", { className: "info-box" }, [
          el("strong", { text: "Last change applied" }),
          el("p", { text: `${lastExecution.resultSummary} (${lastExecution.status})` })
        ])
      : null
  ]);
}

function renderSalesDomainControls(
  project,
  salesGroups,
  salesConfigurationSections,
  onUpdateCheckpoint,
  onAddSalesConfiguration,
  onUpdateSalesConfiguration,
  onUpdateSalesEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const salesReadiness = getSalesReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "Sales implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded Sales slice governs checkpoint truth, structured capture, evidence classification, and readiness summary for the minimum quotation-to-order foundation. Live inspection, preview, and execution remain constrained by the Capability truth panel for this domain."
    }),
    renderSalesReadinessPanel(salesReadiness),
    ...salesGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Sales support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        renderSalesEvidenceSection(checkpoint, onUpdateSalesEvidence),
        el("p", {
          className: "checkpoint-panel__dependency",
          text:
            "Support fields remain planning evidence only. They do not auto-pass checkpoints or upgrade domain capability."
        }),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    }),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Sales design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are not proof, do not auto-pass Sales checkpoints, and do not imply confirmed live-system behavior."
      }),
      ...salesConfigurationSections.map((section) =>
        renderSalesConfigurationSection(section, onAddSalesConfiguration, onUpdateSalesConfiguration)
      )
    ])
  ]);
}

function renderPurchaseDomainControls(
  project,
  purchaseGroups,
  purchaseConfigurationSections,
  onUpdateCheckpoint,
  onAddPurchaseConfiguration,
  onUpdatePurchaseConfiguration,
  onUpdatePurchaseEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const purchaseReadiness = getPurchaseReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "Purchase implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded Purchase slice governs checkpoint truth, structured capture, evidence classification, and readiness summary for the minimum RFQ-to-purchase-order foundation. Live inspection, preview, and execution remain constrained by the Capability truth panel for this domain."
    }),
    renderPurchaseReadinessPanel(purchaseReadiness),
    ...purchaseGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Purchase support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        renderPurchaseEvidenceSection(checkpoint, onUpdatePurchaseEvidence),
        el("p", {
          className: "checkpoint-panel__dependency",
          text:
            "Support fields remain planning evidence only. They do not auto-pass checkpoints or upgrade domain capability."
        }),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    }),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Purchase design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are not proof, do not auto-pass Purchase checkpoints, and do not imply confirmed live-system behavior."
      }),
      ...purchaseConfigurationSections.map((section) =>
        renderPurchaseConfigurationSection(section, onAddPurchaseConfiguration, onUpdatePurchaseConfiguration)
      )
    ])
  ]);
}

function renderManufacturingDomainControls(
  project,
  manufacturingGroups,
  manufacturingConfigurationSections,
  onUpdateCheckpoint,
  onAddManufacturingConfiguration,
  onUpdateManufacturingConfiguration,
  onUpdateManufacturingEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const summary = getManufacturingReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "Manufacturing implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded Manufacturing slice governs checkpoint truth, structured capture, evidence classification, and readiness summary for the minimum production-foundation baseline. Live inspection, preview, and execution remain constrained by the Capability truth panel for this domain."
    }),
    renderOperationalReadinessPanel("Manufacturing readiness summary", summary, (item) => item.sufficiency),
    ...manufacturingGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Manufacturing support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        renderGenericEvidenceSection({
          title: "Manufacturing evidence context",
          checkpoint,
          evidence: checkpoint.manufacturingEvidence,
          onUpdateEvidence: onUpdateManufacturingEvidence,
          getEvidenceLabel: getManufacturingEvidenceLabel,
          getEvidenceSufficiency: getManufacturingEvidenceSufficiency,
          guidanceText:
            "Structured capture remains context only. User assertion remains distinct from design capture, and neither can clear blockers or pass checkpoints."
        }),
        el("p", {
          className: "checkpoint-panel__dependency",
          text:
            "Support fields remain planning evidence only. They do not auto-pass checkpoints or upgrade domain capability."
        }),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    }),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Manufacturing design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are not proof, do not auto-pass Manufacturing checkpoints, and do not imply confirmed live-system behavior."
      }),
      ...manufacturingConfigurationSections.map((section) =>
        renderManufacturingConfigurationSection(
          section,
          onAddManufacturingConfiguration,
          onUpdateManufacturingConfiguration
        )
      )
    ])
  ]);
}

function renderSupportOnlyDomainControls(project, title, description, groups, onUpdateCheckpoint) {
  const requiresBranchTarget = project.environmentContext.target.enabled;

  return el("section", { className: "panel" }, [
    el("h3", { text: title }),
    el("p", { text: description }),
    ...groups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Accountable support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        el("p", {
          className: "checkpoint-panel__dependency",
          text: "Accountable support fields remain planning evidence only. They do not auto-pass checkpoints or upgrade domain capability."
        }),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    })
  ]);
}

function renderPurchaseReadinessPanel(summary) {
  const tone = summary.readinessState === "ready" ? "info-banner" : "error-banner";

  return el("section", { className: "panel accounting-readiness-summary" }, [
    el("h4", { text: "Purchase readiness summary" }),
    el("p", {
      className: tone,
      text: `Readiness state: ${summary.readinessState}. ${summary.explanation}`
    }),
    el("div", { className: "summary-grid" }, [
      summaryCard("Blockers", String(summary.blockerCount)),
      summaryCard("Evidence gaps", String(summary.evidenceGaps.length)),
      summaryCard("Capture-only areas", String(summary.captureOnly.length)),
      summaryCard("Captured sections", String(summary.captureContext.length))
    ]),
    renderSummaryList("Failed checkpoints", summary.failedCheckpoints, (item) => `${item.title} (${item.checkpointClass})`),
    renderSummaryList("Evidence gaps", summary.evidenceGaps, (item) => `${item.title}: ${item.evidenceLabel}`),
    renderSummaryList("Capture-only areas", summary.captureOnly, (item) => `${item.title}: ${item.summary}`),
    renderSummaryList("Next actions", summary.nextActions, (item) => item.text),
    renderSummaryList("Downstream impact signals", summary.downstreamImpactSignals, (item) => item),
    renderSummaryList("Design capture context", summary.captureContext, (item) => `${item.label}: ${item.inScopeRecords} in-scope row(s) captured`)
  ]);
}

function renderSalesReadinessPanel(summary) {
  const tone = summary.readinessState === "ready" ? "info-banner" : "error-banner";

  return el("section", { className: "panel accounting-readiness-summary" }, [
    el("h4", { text: "Sales readiness summary" }),
    el("p", {
      className: tone,
      text: `Readiness state: ${summary.readinessState}. ${summary.explanation}`
    }),
    el("div", { className: "summary-grid" }, [
      summaryCard("Blockers", String(summary.blockerCount)),
      summaryCard("Evidence gaps", String(summary.evidenceGaps.length)),
      summaryCard("Capture-only areas", String(summary.captureOnly.length)),
      summaryCard("Captured sections", String(summary.captureContext.length))
    ]),
    renderSummaryList("Failed checkpoints", summary.failedCheckpoints, (item) => `${item.title} (${item.checkpointClass})`),
    renderSummaryList("Evidence gaps", summary.evidenceGaps, (item) => `${item.title}: ${item.evidenceLabel}`),
    renderSummaryList("Capture-only areas", summary.captureOnly, (item) => `${item.title}: ${item.summary}`),
    renderSummaryList("Next actions", summary.nextActions, (item) => item.text),
    renderSummaryList("Downstream impact signals", summary.downstreamImpactSignals, (item) => item),
    renderSummaryList("Design capture context", summary.captureContext, (item) => `${item.label}: ${item.inScopeRecords} in-scope row(s) captured`)
  ]);
}

function renderSalesEvidenceSection(checkpoint, onUpdateSalesEvidence) {
  const evidence = checkpoint.salesEvidence || {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
  const assertionEditable = evidence.mode === "user_asserted";

  return el("section", { className: "panel checkpoint-panel__workflow" }, [
    el("h5", { text: "Sales evidence context" }),
    el("p", {
      className: "info-banner",
      text:
        "Structured capture remains context only. User assertion remains distinct from design capture, and neither can clear blockers or pass checkpoints."
    }),
    el("div", { className: "entry-grid" }, [
      field("Evidence classification", getSalesEvidenceLabel(evidence), () => {}, { readOnly: true }),
      field("Sufficiency / readiness", getSalesEvidenceSufficiency(checkpoint), () => {}, { readOnly: true }),
      field("Evidence summary", evidence.summary, (value) =>
        onUpdateSalesEvidence(checkpoint.id, { summary: value })
      , { readOnly: !assertionEditable }),
      field("Evidence source label", evidence.sourceLabel, (value) =>
        onUpdateSalesEvidence(checkpoint.id, { sourceLabel: value })
      , { readOnly: !assertionEditable }),
      field("Evidence notes", evidence.notes, (value) =>
        onUpdateSalesEvidence(checkpoint.id, { notes: value })
      , { readOnly: !assertionEditable }),
      field("Recorded actor", evidence.recordedActor || "No explicit evidence actor recorded", () => {}, { readOnly: true }),
      field("Recorded timestamp", evidence.recordedAt || "No explicit evidence timestamp recorded", () => {}, { readOnly: true })
    ]),
    el("div", { className: "checkpoint-panel__actions" }, [
      el("button", {
        className: "button",
        text: "Record user assertion",
        onclick: () =>
          onUpdateSalesEvidence(checkpoint.id, {
            mode: "user_asserted",
            sourceLabel: evidence.sourceLabel || "User assertion"
          })
      }),
      el("button", {
        className: "button",
        text: "Clear to derived evidence",
        onclick: () =>
          onUpdateSalesEvidence(checkpoint.id, {
            mode: "none",
            summary: "",
            sourceLabel: "",
            notes: ""
          })
      })
    ])
  ]);
}

function renderPurchaseEvidenceSection(checkpoint, onUpdatePurchaseEvidence) {
  const evidence = checkpoint.purchaseEvidence || {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
  const assertionEditable = evidence.mode === "user_asserted";

  return el("section", { className: "panel checkpoint-panel__workflow" }, [
    el("h5", { text: "Purchase evidence context" }),
    el("p", {
      className: "info-banner",
      text:
        "Structured capture remains context only. User assertion remains distinct from design capture, and neither can clear blockers or pass checkpoints."
    }),
    el("div", { className: "entry-grid" }, [
      field("Evidence classification", getPurchaseEvidenceLabel(evidence), () => {}, { readOnly: true }),
      field("Sufficiency / readiness", getPurchaseEvidenceSufficiency(checkpoint), () => {}, { readOnly: true }),
      field("Evidence summary", evidence.summary, (value) =>
        onUpdatePurchaseEvidence(checkpoint.id, { summary: value })
      , { readOnly: !assertionEditable }),
      field("Evidence source label", evidence.sourceLabel, (value) =>
        onUpdatePurchaseEvidence(checkpoint.id, { sourceLabel: value })
      , { readOnly: !assertionEditable }),
      field("Evidence notes", evidence.notes, (value) =>
        onUpdatePurchaseEvidence(checkpoint.id, { notes: value })
      , { readOnly: !assertionEditable }),
      field("Recorded actor", evidence.recordedActor || "No explicit evidence actor recorded", () => {}, { readOnly: true }),
      field("Recorded timestamp", evidence.recordedAt || "No explicit evidence timestamp recorded", () => {}, { readOnly: true })
    ]),
    el("div", { className: "checkpoint-panel__actions" }, [
      el("button", {
        className: "button",
        text: "Record user assertion",
        onclick: () =>
          onUpdatePurchaseEvidence(checkpoint.id, {
            mode: "user_asserted",
            sourceLabel: evidence.sourceLabel || "User assertion"
          })
      }),
      el("button", {
        className: "button",
        text: "Clear to derived evidence",
        onclick: () =>
          onUpdatePurchaseEvidence(checkpoint.id, {
            mode: "none",
            summary: "",
            sourceLabel: "",
            notes: ""
          })
      })
    ])
  ]);
}

function renderCrmDomainControls(
  project,
  crmGroups,
  crmConfigurationSections,
  onUpdateCheckpoint,
  onAddCrmConfiguration,
  onUpdateCrmConfiguration,
  onUpdateCrmEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const summary = getCrmReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "CRM implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded CRM slice governs checkpoint truth, structured capture for pipeline, ownership, and quotation-handoff planning, plus evidence classification and readiness summary for the lead/opportunity baseline. Live inspection, preview, and execution remain constrained by the Capability truth panel for this domain."
    }),
    renderOperationalReadinessPanel("CRM readiness summary", summary, (item) => item.sufficiency),
    ...crmGroups.map((group) =>
      renderFullStackDomainCheckpointGroup({
        checkpoint: group.checkpoint,
        area: group.area,
        guidanceKey: group.guidanceKey,
        supportLabel: "CRM support reference",
        requiresBranchTarget,
        onUpdateCheckpoint,
        evidenceTitle: "CRM evidence context",
        onUpdateEvidence: onUpdateCrmEvidence,
        getEvidenceLabel: getCrmEvidenceLabel,
        getEvidenceSufficiency: getCrmEvidenceSufficiency
      })
    ),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "CRM design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are not proof, do not auto-pass CRM checkpoints, and do not imply confirmed live-system behavior."
      }),
      ...crmConfigurationSections.map((section) =>
        renderGenericConfigurationSection(
          section,
          onAddCrmConfiguration,
          onUpdateCrmConfiguration,
          getCrmConfigurationFields,
          crmRecordLabel
        )
      )
    ])
  ]);
}

function renderWebsiteEcommerceDomainControls(
  project,
  websiteGroups,
  websiteConfigurationSections,
  onUpdateCheckpoint,
  onAddWebsiteEcommerceConfiguration,
  onUpdateWebsiteEcommerceConfiguration,
  onUpdateWebsiteEcommerceEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const summary = getWebsiteEcommerceReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "Website / eCommerce implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded Website / eCommerce slice governs checkpoint truth, structured capture for catalog, checkout, and delivery planning, plus evidence classification and readiness summary for the bounded website baseline. Live inspection, preview, and execution remain constrained by the Capability truth panel for this domain."
    }),
    renderOperationalReadinessPanel("Website / eCommerce readiness summary", summary, (item) => item.sufficiency),
    ...websiteGroups.map((group) =>
      renderFullStackDomainCheckpointGroup({
        checkpoint: group.checkpoint,
        area: group.area,
        guidanceKey: group.guidanceKey,
        supportLabel: "Website support reference",
        requiresBranchTarget,
        onUpdateCheckpoint,
        evidenceTitle: "Website / eCommerce evidence context",
        onUpdateEvidence: onUpdateWebsiteEcommerceEvidence,
        getEvidenceLabel: getWebsiteEcommerceEvidenceLabel,
        getEvidenceSufficiency: getWebsiteEcommerceEvidenceSufficiency
      })
    ),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Website / eCommerce design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are not proof, do not auto-pass Website / eCommerce checkpoints, and do not imply confirmed live-system behavior."
      }),
      ...websiteConfigurationSections.map((section) =>
        renderGenericConfigurationSection(
          section,
          onAddWebsiteEcommerceConfiguration,
          onUpdateWebsiteEcommerceConfiguration,
          getWebsiteConfigurationFields,
          websiteRecordLabel
        )
      )
    ])
  ]);
}

function renderPosDomainControls(
  project,
  posGroups,
  posConfigurationSections,
  onUpdateCheckpoint,
  onAddPosConfiguration,
  onUpdatePosConfiguration,
  onUpdatePosEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const summary = getPosReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "POS implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded POS slice governs checkpoint truth, structured capture for session and invoicing-policy planning, plus evidence classification and readiness summary for the bounded POS baseline. Live inspection, preview, and execution remain constrained by the Capability truth panel for this domain."
    }),
    renderOperationalReadinessPanel("POS readiness summary", summary, (item) => item.sufficiency),
    ...posGroups.map((group) =>
      renderFullStackDomainCheckpointGroup({
        checkpoint: group.checkpoint,
        area: group.area,
        guidanceKey: group.guidanceKey,
        supportLabel: "POS support reference",
        requiresBranchTarget,
        onUpdateCheckpoint,
        evidenceTitle: "POS evidence context",
        onUpdateEvidence: onUpdatePosEvidence,
        getEvidenceLabel: getPosEvidenceLabel,
        getEvidenceSufficiency: getPosEvidenceSufficiency
      })
    ),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "POS design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are not proof, do not auto-pass POS checkpoints, and do not imply confirmed live-system behavior."
      }),
      ...posConfigurationSections.map((section) =>
        renderGenericConfigurationSection(
          section,
          onAddPosConfiguration,
          onUpdatePosConfiguration,
          getPosConfigurationFields,
          posRecordLabel
        )
      )
    ])
  ]);
}

function renderFullStackDomainCheckpointGroup({
  checkpoint,
  area,
  guidanceKey,
  supportLabel,
  requiresBranchTarget,
  onUpdateCheckpoint,
  evidenceTitle,
  onUpdateEvidence,
  getEvidenceLabel,
  getEvidenceSufficiency
}) {
  const safety = classifyActionSafety("advance-checkpoint", {
    requiresBranchTarget,
    checkpointBlocked: checkpoint.status === "Fail"
  });

  return el("section", { className: "inventory-group" }, [
    el("h4", { text: area }),
    renderCheckpointPanel(checkpoint, {
      downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[guidanceKey])
    }),
    renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[guidanceKey]),
    el("div", { className: "entry-grid" }, [
      field(supportLabel, checkpoint.evidenceReference, (value) =>
        onUpdateCheckpoint(checkpoint.id, {
          evidenceReference: value,
          evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
        })
      ),
      field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
        onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
      ),
      field("Reviewer", checkpoint.reviewer, (value) =>
        onUpdateCheckpoint(checkpoint.id, { reviewer: value })
      ),
      renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
    ]),
    renderGenericEvidenceSection({
      title: evidenceTitle,
      checkpoint,
      evidence: getCheckpointEvidence(checkpoint),
      onUpdateEvidence,
      getEvidenceLabel,
      getEvidenceSufficiency,
      guidanceText:
        "Structured capture remains context only. User assertion remains distinct from design capture, and neither can clear blockers or pass checkpoints."
    }),
    el("p", {
      className: "checkpoint-panel__dependency",
      text: "This slice is checkpoint-truth first. Structured capture and evidence metadata do not auto-pass checkpoints or imply live-system completion."
    }),
    el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
  ]);
}

function renderOperationalReadinessPanel(title, summary, evidenceFormatter) {
  const tone = summary.readinessState === "ready" ? "info-banner" : "error-banner";

  return el("section", { className: "panel accounting-readiness-summary" }, [
    el("h4", { text: title }),
    el("p", {
      className: tone,
      text: `Readiness state: ${summary.readinessState}. ${summary.explanation}`
    }),
    el("div", { className: "summary-grid" }, [
      summaryCard("Blockers", String(summary.blockerCount)),
      summaryCard("Evidence gaps", String(summary.evidenceGaps.length)),
      summaryCard("Capture-only areas", String(summary.captureOnly.length)),
      summaryCard("Captured sections", String(summary.captureContext.length))
    ]),
    renderSummaryList("Failed checkpoints", summary.failedCheckpoints, (item) => `${item.title} (${item.checkpointClass})`),
    renderSummaryList("Deferred checkpoints", summary.deferredCheckpoints || [], (item) => `${item.title}: ${item.reviewPoint}`),
    renderSummaryList("Evidence gaps", summary.evidenceGaps, (item) => `${item.title}: ${evidenceFormatter(item)}`),
    renderSummaryList("Capture-only areas", summary.captureOnly, (item) => `${item.title}: ${item.summary}`),
    renderSummaryList("Next actions", summary.nextActions, (item) => item.text),
    renderSummaryList("Downstream impact signals", summary.downstreamImpactSignals, (item) => item),
    renderSummaryList("Design capture context", summary.captureContext, (item) => `${item.label}: ${item.inScopeRecords} in-scope row(s) captured`)
  ]);
}

function renderGenericEvidenceSection({
  title,
  checkpoint,
  evidence,
  onUpdateEvidence,
  getEvidenceLabel,
  getEvidenceSufficiency,
  guidanceText
}) {
  const currentEvidence = evidence || {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
  const assertionEditable = currentEvidence.mode === "user_asserted";

  return el("section", { className: "panel checkpoint-panel__workflow" }, [
    el("h5", { text: title }),
    el("p", {
      className: "info-banner",
      text: guidanceText
    }),
    el("div", { className: "entry-grid" }, [
      field("Evidence classification", getEvidenceLabel(currentEvidence), () => {}, { readOnly: true }),
      field("Sufficiency / readiness", getEvidenceSufficiency(checkpoint), () => {}, { readOnly: true }),
      field("Evidence summary", currentEvidence.summary, (value) =>
        onUpdateEvidence(checkpoint.id, { summary: value })
      , { readOnly: !assertionEditable }),
      field("Evidence source label", currentEvidence.sourceLabel, (value) =>
        onUpdateEvidence(checkpoint.id, { sourceLabel: value })
      , { readOnly: !assertionEditable }),
      field("Evidence notes", currentEvidence.notes, (value) =>
        onUpdateEvidence(checkpoint.id, { notes: value })
      , { readOnly: !assertionEditable }),
      field("Recorded actor", currentEvidence.recordedActor || "No explicit evidence actor recorded", () => {}, { readOnly: true }),
      field("Recorded timestamp", currentEvidence.recordedAt || "No explicit evidence timestamp recorded", () => {}, { readOnly: true })
    ]),
    el("div", { className: "checkpoint-panel__actions" }, [
      el("button", {
        className: "button",
        text: "Record user assertion",
        onclick: () =>
          onUpdateEvidence(checkpoint.id, {
            mode: "user_asserted",
            sourceLabel: currentEvidence.sourceLabel || "User assertion"
          })
      }),
      el("button", {
        className: "button",
        text: "Clear to derived evidence",
        onclick: () =>
          onUpdateEvidence(checkpoint.id, {
            mode: "none",
            summary: "",
            sourceLabel: "",
            notes: "",
            recordedActor: "",
            recordedAt: ""
          })
      })
    ])
  ]);
}

function getCheckpointEvidence(checkpoint) {
  return (
    checkpoint.manufacturingEvidence ||
    checkpoint.crmEvidence ||
    checkpoint.websiteEcommerceEvidence ||
    checkpoint.posEvidence ||
    null
  );
}

function renderGenericConfigurationSection(section, onAdd, onUpdate, getFields, labelBuilder) {
  return el("section", { className: "checkpoint-panel inventory-config-section" }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [
        el("h4", { text: section.label }),
        el("p", { text: section.description })
      ]),
      renderStatusBadge(section.summary.inScopeRecords ? "In Progress" : "Not Started")
    ]),
    section.checkpoint
      ? el("p", {
          className: "checkpoint-panel__dependency",
          text: `Linked checkpoint: ${section.checkpoint.title} (${section.checkpoint.status})`
        })
      : null,
    el("p", {
      className: "checkpoint-panel__dependency",
      text: `Captured rows: ${section.summary.totalRecords}. In-scope rows: ${section.summary.inScopeRecords}.`
    }),
    el("div", { className: "checkpoint-panel__actions" }, [
      el("button", { className: "button", text: "Add record", onclick: () => onAdd(section.id) })
    ]),
    ...section.records.map((record) => renderGenericConfigurationRecord(section, record, onUpdate, getFields, labelBuilder))
  ]);
}

function renderGenericConfigurationRecord(section, record, onUpdate, getFields, labelBuilder) {
  const fields = getFields(section.id, record);

  return el("section", { className: "checkpoint-panel inventory-config-record" }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [
        el("h5", { text: labelBuilder(section.id, record) }),
        el("p", { text: `Capture key: ${record.key}` })
      ]),
      renderStatusBadge(record.inScope ? "In Progress" : "Not Started")
    ]),
    el(
      "div",
      { className: "entry-grid" },
      fields.map((fieldConfig) => renderGenericConfigurationField(section.id, record.key, fieldConfig, onUpdate))
    )
  ]);
}

function renderGenericConfigurationField(sectionId, recordKey, fieldConfig, onUpdate) {
  if (fieldConfig.type === "select") {
    return selectField(fieldConfig.label, fieldConfig.options, fieldConfig.value, (value) =>
      onUpdate(sectionId, recordKey, { [fieldConfig.key]: fieldConfig.boolean ? value === "true" : value })
    );
  }

  return field(fieldConfig.label, fieldConfig.value, (value) =>
    onUpdate(sectionId, recordKey, { [fieldConfig.key]: value })
  );
}

function getCrmConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "pipelineCapture":
      return [
        { key: "stageLabel", label: "Stage label", value: record.stageLabel },
        { key: "stageSequenceNotes", label: "Stage sequence notes", value: record.stageSequenceNotes },
        { key: "conversionPolicyNotes", label: "Conversion policy notes", value: record.conversionPolicyNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "activityDisciplineCapture":
      return [
        { key: "salesTeamLabel", label: "Sales team label", value: record.salesTeamLabel },
        { key: "ownerRoleNote", label: "Owner / role note", value: record.ownerRoleNote },
        { key: "activityTypeNotes", label: "Activity type notes", value: record.activityTypeNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "quotationHandoffCapture":
      return [
        { key: "handoffType", label: "Handoff type", value: record.handoffType },
        { key: "downstreamHandoffNote", label: "Downstream handoff note", value: record.downstreamHandoffNote },
        { key: "dependencyNote", label: "Dependency note", value: record.dependencyNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    default:
      return [];
  }
}

function crmRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "pipelineCapture":
      return record.stageLabel || "Pipeline capture record";
    case "activityDisciplineCapture":
      return record.salesTeamLabel || record.ownerRoleNote || "Activity discipline capture record";
    case "quotationHandoffCapture":
      return record.handoffType || "Quotation handoff capture record";
    default:
      return "Structured record";
  }
}

function getWebsiteConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "storefrontCapture":
      return [
        { key: "publicationScopeLabel", label: "Publication scope label", value: record.publicationScopeLabel },
        { key: "catalogBoundaryNotes", label: "Catalog boundary notes", value: record.catalogBoundaryNotes },
        { key: "accessModelNotes", label: "Access model notes", value: record.accessModelNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "checkoutCapture":
      return [
        { key: "checkoutFlowLabel", label: "Checkout flow label", value: record.checkoutFlowLabel },
        { key: "paymentProviderNotes", label: "Payment provider notes", value: record.paymentProviderNotes },
        { key: "orderConfirmationNotes", label: "Order confirmation notes", value: record.orderConfirmationNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "deliveryHandoffCapture":
      return [
        { key: "handoffType", label: "Handoff type", value: record.handoffType },
        { key: "downstreamHandoffNote", label: "Downstream handoff note", value: record.downstreamHandoffNote },
        { key: "dependencyNote", label: "Dependency note", value: record.dependencyNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    default:
      return [];
  }
}

function websiteRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "storefrontCapture":
      return record.publicationScopeLabel || "Storefront capture record";
    case "checkoutCapture":
      return record.checkoutFlowLabel || "Checkout capture record";
    case "deliveryHandoffCapture":
      return record.handoffType || "Delivery handoff capture record";
    default:
      return "Structured record";
  }
}

function getPosConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "sessionPolicyCapture":
      return [
        { key: "sessionOpeningPolicyLabel", label: "Session opening policy label", value: record.sessionOpeningPolicyLabel },
        { key: "cashierRoleNotes", label: "Cashier role notes", value: record.cashierRoleNotes },
        { key: "offlinePolicyNotes", label: "Offline policy notes", value: record.offlinePolicyNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "invoicingPolicyCapture":
      return [
        { key: "invoicingPolicyLabel", label: "Invoicing policy label", value: record.invoicingPolicyLabel },
        { key: "journalLinkageNotes", label: "Journal linkage notes", value: record.journalLinkageNotes },
        { key: "cashControlNotes", label: "Cash control notes", value: record.cashControlNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    default:
      return [];
  }
}

function posRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "sessionPolicyCapture":
      return record.sessionOpeningPolicyLabel || "Session policy capture record";
    case "invoicingPolicyCapture":
      return record.invoicingPolicyLabel || "Invoicing policy capture record";
    default:
      return "Structured record";
  }
}

function getMasterDataConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "partnerCategoryCapture":
      return [
        { key: "categoryName", label: "Partner classification name", value: record.categoryName },
        { key: "stewardshipNote", label: "Stewardship note", value: record.stewardshipNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "productCategoryCapture":
      return [
        { key: "categoryName", label: "Product category name", value: record.categoryName },
        { key: "parentCategoryName", label: "Parent category name (optional)", value: record.parentCategoryName },
        { key: "stewardshipNote", label: "Stewardship note", value: record.stewardshipNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "uomCategoryCapture":
      return [
        { key: "categoryName", label: "Unit category name", value: record.categoryName },
        { key: "stewardshipNote", label: "Stewardship note", value: record.stewardshipNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    default:
      return [];
  }
}

function masterDataRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "partnerCategoryCapture":
      return record.categoryName || "Partner classification capture record";
    case "productCategoryCapture":
      return record.categoryName || "Product category capture record";
    case "uomCategoryCapture":
      return record.categoryName || "Unit category capture record";
    default:
      return "Structured record";
  }
}

function renderScaffoldDomainControls(project, selectedDomain, scaffoldGroups, onUpdateCheckpoint) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const selectedCapability = getDomainCapability(project, selectedDomain.id);

  return el("section", { className: "panel" }, [
    el("h3", { text: `${selectedDomain.label} checkpoint foundations` }),
    el("p", {
      text:
        "This scaffold wave establishes bounded checkpoint truth only. It does not add capture models, evidence engines, readiness scoring, or cross-domain dependency expansion."
    }),
    selectedDomain.id === "master-data"
      ? el("p", {
          className: "checkpoint-panel__dependency",
          text: `Master Data here is implementation-control only, not a generic record-administration surface. Capability truth remains explicit: current L${selectedCapability.currentLevel} ${selectedCapability.label}; target L${selectedCapability.targetLevel} ${selectedCapability.targetLabel}. Use inspections and previews where shown; only actions marked executable in the capability panel can run.`
        })
      : null,
    ...scaffoldGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Accountable support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        el("p", {
          className: "checkpoint-panel__dependency",
          text:
            "Linked support fields remain planning evidence only. They do not auto-pass checkpoints or upgrade domain capability."
        }),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    })
  ]);
}

function renderMasterDataDomainControls(
  project,
  masterDataGroups,
  masterDataConfigurationSections,
  onUpdateCheckpoint,
  onAddMasterDataConfiguration,
  onUpdateMasterDataConfiguration
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const capability = getDomainCapability(project, "master-data");

  return el("section", { className: "panel" }, [
    el("h3", { text: "Master Data implementation-control checkpoints" }),
    el("p", {
      text:
        "Master Data here is bounded implementation support for shared reference structures. It is not a generic record-administration workspace."
    }),
    el("p", {
      className: "checkpoint-panel__dependency",
      text: `Capability truth: current L${capability.currentLevel} ${capability.label}; target L${capability.targetLevel} ${capability.targetLabel}. Only actions marked executable in preview can run.`
    }),
    ...masterDataGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Accountable support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        el("p", {
          className: "checkpoint-panel__dependency",
          text:
            "Master Data checkpoints remain implementation-control truth. Support fields do not auto-pass checkpoints and do not grant unrestricted write authority."
        }),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    }),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Master Data design capture" }),
      el("p", {
        text:
          "These rows define bounded shared-data scaffolding intent. They are used for truthful preview classification and do not expose arbitrary model writes."
      }),
      ...masterDataConfigurationSections.map((section) =>
        renderGenericConfigurationSection(
          section,
          onAddMasterDataConfiguration,
          onUpdateMasterDataConfiguration,
          getMasterDataConfigurationFields,
          masterDataRecordLabel
        )
      )
    ])
  ]);
}

function renderAccountingDomainControls(
  project,
  accountingGroups,
  accountingConfigurationSections,
  onUpdateCheckpoint,
  onAddAccountingConfiguration,
  onUpdateAccountingConfiguration,
  onUpdateAccountingEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const accountingReadiness = getAccountingReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "Accounting implementation-control checkpoints" }),
    el("p", {
      text:
        "This bounded Accounting slice governs only the finance controls required to preserve truthful Inventory-sensitive dependency handling."
    }),
    renderAccountingReadinessPanel(accountingReadiness),
    ...accountingGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Accounting support reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Accountable support linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        renderAccountingEvidenceSection(checkpoint, onUpdateAccountingEvidence),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    }),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Accounting design capture" }),
      el("p", {
        text:
          "These rows capture implementation planning inputs only. They are not proof, do not auto-pass Accounting checkpoints, and do not weaken Inventory dependency truth."
      }),
      ...accountingConfigurationSections.map((section) =>
        renderAccountingConfigurationSection(section, onAddAccountingConfiguration, onUpdateAccountingConfiguration)
      )
    ])
  ]);
}

function renderAccountingReadinessPanel(summary) {
  const tone = summary.readinessState === "ready" ? "info-banner" : "error-banner";

  return el("section", { className: "panel accounting-readiness-summary" }, [
    el("h4", { text: "Accounting prerequisite slice readiness" }),
    el("p", {
      className: tone,
      text: `Readiness state: ${summary.readinessState}. ${summary.explanation}`
    }),
    el("div", { className: "summary-grid" }, [
      summaryCard("Blockers", String(summary.blockerCount)),
      summaryCard("Deferred items", String(summary.deferredCheckpoints.length)),
      summaryCard("Evidence gaps", String(summary.evidenceGaps.length)),
      summaryCard("Capture-only areas", String(summary.captureOnly.length))
    ]),
    renderSummaryList("Failed checkpoints", summary.failedCheckpoints, (item) => `${item.title} (${item.checkpointClass})`),
    renderSummaryList("Deferred checkpoints", summary.deferredCheckpoints, (item) => `${item.title}: ${item.reviewPoint}`),
    renderSummaryList("Evidence gaps", summary.evidenceGaps, (item) => `${item.title}: ${item.evidenceLabel}`),
    renderSummaryList("Capture-only areas", summary.captureOnly, (item) => `${item.title}: ${item.summary}`),
    renderSummaryList("Next actions", summary.nextActions, (item) => item.text),
    renderSummaryList("Downstream impact signals", summary.downstreamImpactSignals, (item) => item),
    renderSummaryList("Design capture context", summary.captureContext, (item) => `${item.label}: ${item.inScopeRecords} in-scope row(s) captured`)
  ]);
}

function renderAccountingEvidenceSection(checkpoint, onUpdateAccountingEvidence) {
  const evidence = checkpoint.accountingEvidence || {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
  const assertionEditable = evidence.mode === "user_asserted";

  return el("section", { className: "panel checkpoint-panel__workflow" }, [
    el("h5", { text: "Accounting evidence context" }),
    el("p", {
      className: "info-banner",
      text:
        "Structured capture remains context only. User assertion is separate from design capture, and neither can clear blockers or pass checkpoints."
    }),
    el("div", { className: "entry-grid" }, [
      field("Evidence classification", getAccountingEvidenceLabel(evidence), () => {}, { readOnly: true }),
      field("Sufficiency / readiness", getAccountingEvidenceSufficiency(checkpoint), () => {}, { readOnly: true }),
      field("Evidence summary", evidence.summary, (value) =>
        onUpdateAccountingEvidence(checkpoint.id, { summary: value })
      , { readOnly: !assertionEditable }),
      field("Evidence source label", evidence.sourceLabel, (value) =>
        onUpdateAccountingEvidence(checkpoint.id, { sourceLabel: value })
      , { readOnly: !assertionEditable }),
      field("Evidence notes", evidence.notes, (value) =>
        onUpdateAccountingEvidence(checkpoint.id, { notes: value })
      , { readOnly: !assertionEditable }),
      field("Recorded actor", evidence.recordedActor || "No explicit evidence actor recorded", () => {}, { readOnly: true }),
      field("Recorded timestamp", evidence.recordedAt || "No explicit evidence timestamp recorded", () => {}, { readOnly: true })
    ]),
    el("div", { className: "checkpoint-panel__actions" }, [
      el("button", {
        className: "button",
        text: "Record user assertion",
        onclick: () =>
          onUpdateAccountingEvidence(checkpoint.id, {
            mode: "user_asserted",
            summary: "",
            sourceLabel: "User assertion",
            notes: ""
          })
      }),
      el("button", {
        className: "button",
        text: "Clear to capture-derived state",
        onclick: () =>
          onUpdateAccountingEvidence(checkpoint.id, {
            mode: "none",
            summary: "",
            sourceLabel: "",
            notes: "",
            recordedActor: "",
            recordedAt: ""
          })
      })
    ])
  ]);
}

function renderInventoryDomainControls(
  project,
  inventoryGroups,
  inventoryConfigurationSections,
  onUpdateCheckpoint,
  onDeferCheckpoint,
  onAddInventoryConfiguration,
  onUpdateInventoryConfiguration,
  onUpdateInventoryEvidence
) {
  const requiresBranchTarget = project.environmentContext.target.enabled;
  const readinessSummary = getInventoryReadinessSummary(project);

  return el("section", { className: "panel" }, [
    el("h3", { text: "Inventory implementation-control checkpoints" }),
    el("p", {
      text:
        "Inventory checkpoints are dependency-aware. Unmet upstream controls force blocking and prevent guessed progression."
    }),
    renderInventoryReadinessSummary(readinessSummary),
    ...inventoryGroups.map((group) => {
      const checkpoint = group.checkpoint;
      const safety = classifyActionSafety("advance-checkpoint", {
        requiresBranchTarget,
        checkpointBlocked: checkpoint.status === "Fail"
      });

      return el("section", { className: "inventory-group" }, [
        el("h4", { text: group.area }),
        renderCheckpointPanel(checkpoint, {
          downstreamImpactSummary: getCompactDownstreamImpactSummary(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey])
        }),
        renderGuidanceBlock(SAMPLE_GUIDANCE_BLOCKS[group.guidanceKey]),
        el("div", { className: "entry-grid" }, [
          field("Evidence reference", checkpoint.evidenceReference, (value) =>
            onUpdateCheckpoint(checkpoint.id, {
              evidenceReference: value,
              evidenceStatus: value ? "Evidence linked" : checkpoint.evidenceStatus
            })
          ),
          field("Checkpoint owner", checkpoint.checkpointOwner, (value) =>
            onUpdateCheckpoint(checkpoint.id, { checkpointOwner: value })
          ),
          field("Reviewer", checkpoint.reviewer, (value) =>
            onUpdateCheckpoint(checkpoint.id, { reviewer: value })
          ),
          renderCheckpointStatusField(checkpoint, onUpdateCheckpoint)
        ]),
        renderInventoryEvidenceSection(checkpoint, onUpdateInventoryEvidence),
        renderInventoryDefermentSection(checkpoint, group.defermentEligibility, onDeferCheckpoint),
        el("p", { className: "checkpoint-panel__dependency", text: `Action safety: ${safety.safety}. ${safety.reason}` })
      ]);
    }),
    el("section", { className: "panel inventory-config-capture" }, [
      el("h3", { text: "Inventory design capture" }),
      el("p", {
        text:
          "These rows capture implementation design inputs only. They are user-entered planning records, not system-detectable proof and not live Odoo execution state."
      }),
      ...inventoryConfigurationSections.map((section) =>
        renderInventoryConfigurationSection(section, onAddInventoryConfiguration, onUpdateInventoryConfiguration)
      )
    ])
  ]);
}

function renderInventoryReadinessSummary(summary) {
  const stateTone = summary.readinessState === "ready" ? "info-banner" : "error-banner";

  return el("section", { className: "panel inventory-readiness-summary" }, [
    el("h4", { text: "Inventory readiness summary" }),
    el("p", {
      className: stateTone,
      text: `Readiness state: ${summary.readinessState}. ${summary.explanation}`
    }),
    el("div", { className: "summary-grid" }, [
      summaryCard("Blockers", String(summary.blockerCount)),
      summaryCard("Deferred items", String(summary.deferredCheckpoints.length)),
      summaryCard("Evidence gaps", String(summary.evidenceGaps.length)),
      summaryCard("Capture-only areas", String(summary.captureOnly.length))
    ]),
    renderSummaryList("Failed checkpoints", summary.failedCheckpoints, (item) => `${item.title} (${item.checkpointClass})`),
    renderSummaryList("Deferred checkpoints", summary.deferredCheckpoints, (item) => `${item.title}: ${item.reviewPoint}`),
    renderSummaryList("Evidence gaps", summary.evidenceGaps, (item) => `${item.title}: ${item.sufficiency}`),
    renderSummaryList("Capture-only areas", summary.captureOnly, (item) => `${item.title}: ${item.summary}`),
    renderSummaryList("Next actions", summary.nextActions, (item) => item.text),
    renderSummaryList("Downstream impact signals", summary.downstreamImpactSignals, (item) => item),
    renderSummaryList("Design capture context", summary.captureContext, (item) => `${item.label}: ${item.inScopeRecords} in-scope row(s) captured`)
  ]);
}

function renderCheckpointStatusField(checkpoint, onUpdateCheckpoint) {
  if (["Foundational", "Domain Required", "Go-Live"].includes(checkpoint.checkpointClass)) {
    return field(
      "Result state",
      `${checkpoint.status} (read-only for ${checkpoint.checkpointClass})`,
      () => {},
      { readOnly: true }
    );
  }

  return selectField("Result state", ["Fail", "Warning", "Pass"], checkpoint.status, (value) =>
    onUpdateCheckpoint(checkpoint.id, { status: value })
  );
}

function renderInventoryEvidenceSection(checkpoint, onUpdateInventoryEvidence) {
  const evidence = checkpoint.inventoryEvidence || {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
  const canUserAssert = evidence.mode !== "system_detected";
  const assertionEditable = evidence.mode === "user_asserted";

  return el("section", { className: "panel checkpoint-panel__workflow" }, [
    el("h5", { text: "Evidence classification and provenance" }),
    el("p", {
      className: "info-banner",
      text:
        "Captured design rows remain design capture only. User assertion remains distinct from system-detectable evidence."
    }),
    evidence.mode === "system_detected"
      ? el("p", {
          className: "info-banner",
          text: "System-detectable evidence is display-only in the current architecture and requires explicit system provenance."
        })
      : null,
    el("div", { className: "entry-grid" }, [
      field("Evidence classification", evidence.mode.replaceAll("_", " "), () => {}, { readOnly: true }),
      field("Sufficiency / readiness", getInventoryEvidenceSufficiency(checkpoint), () => {}, { readOnly: true }),
      field("Evidence summary", evidence.summary, (value) =>
        onUpdateInventoryEvidence(checkpoint.id, { summary: value })
      , { readOnly: !assertionEditable }),
      field("Evidence source label", evidence.sourceLabel, (value) =>
        onUpdateInventoryEvidence(checkpoint.id, { sourceLabel: value })
      , { readOnly: !assertionEditable }),
      field("Evidence notes", evidence.notes, (value) =>
        onUpdateInventoryEvidence(checkpoint.id, { notes: value })
      , { readOnly: !assertionEditable }),
      field("Recorded actor", evidence.recordedActor || "No explicit evidence actor recorded", () => {}, { readOnly: true }),
      field("Recorded timestamp", evidence.recordedAt || "No explicit evidence timestamp recorded", () => {}, { readOnly: true })
    ]),
    canUserAssert
      ? el("div", { className: "checkpoint-panel__actions" }, [
          el("button", {
            className: "button",
            text: "Record user assertion",
            onclick: () =>
              onUpdateInventoryEvidence(checkpoint.id, {
                mode: "user_asserted",
                sourceLabel: evidence.sourceLabel || "User assertion"
              })
          }),
          el("button", {
            className: "button",
            text: "Clear to derived evidence",
            onclick: () =>
              onUpdateInventoryEvidence(checkpoint.id, {
                mode: "none",
                summary: "",
                sourceLabel: "",
                notes: ""
              })
          })
        ])
      : null
  ]);
}

function renderInventoryDefermentSection(checkpoint, defermentEligibility, onDeferCheckpoint) {
  const canDefer = Boolean(defermentEligibility?.allowed);
  const statusText = checkpoint.defermentFlag
    ? "Deferred item remains visible and must return for review at the recorded review point."
    : canDefer
      ? "Deferment is governance-allowed for this checkpoint once required metadata is recorded."
      : defermentEligibility?.reason || "Deferment is not allowed for this checkpoint.";

  const reasonId = `deferment-reason-${checkpoint.id}`;
  const constraintId = `deferment-constraint-${checkpoint.id}`;
  const reviewPointId = `deferment-review-point-${checkpoint.id}`;
  const actorId = `deferment-actor-${checkpoint.id}`;

  return el("section", { className: "panel checkpoint-panel__workflow" }, [
    el("h5", { text: "Deferment and review" }),
    el("p", {
      className: canDefer ? "info-banner" : "error-banner",
      text: statusText
    }),
    el("div", { className: "entry-grid" }, [
      field("Deferment reason", checkpoint.defermentReason, () => {}, { id: reasonId, readOnly: !canDefer }),
      field("Deferment constraint", checkpoint.defermentConstraint, () => {}, { id: constraintId, readOnly: !canDefer }),
      field("Review point", checkpoint.reviewPoint, () => {}, { id: reviewPointId, readOnly: !canDefer }),
      field("Recorded actor", checkpoint.defermentFlag ? checkpoint.lastTransitionBy || "" : "ui-user", () => {}, {
        id: actorId,
        readOnly: !canDefer
      })
    ]),
    checkpoint.defermentFlag
      ? el("p", {
          className: "checkpoint-panel__dependency",
          text: `Recorded at: ${checkpoint.lastTransitionAt || "unrecorded time"}`
        })
      : null,
    canDefer
      ? renderDeferActionForm(checkpoint, { reasonId, constraintId, reviewPointId, actorId }, onDeferCheckpoint)
      : null
  ]);
}

function renderDeferActionForm(checkpoint, ids, onDeferCheckpoint) {
  return el("div", { className: "checkpoint-panel__actions" }, [
    el(
      "button",
      {
        className: "button",
        text: checkpoint.defermentFlag ? "Update deferment record" : "Record deferment",
        onclick: () =>
          onDeferCheckpoint(checkpoint.id, {
            checkpointOwner: checkpoint.checkpointOwner,
            defermentReason: document.getElementById(ids.reasonId)?.value || "",
            defermentConstraint: document.getElementById(ids.constraintId)?.value || "",
            reviewPoint: document.getElementById(ids.reviewPointId)?.value || "",
            actor: document.getElementById(ids.actorId)?.value || ""
          })
      }
    )
  ]);
}

function renderInventoryConfigurationSection(section, onAddInventoryConfiguration, onUpdateInventoryConfiguration) {
  const checkpointStatus = section.checkpoint?.defermentFlag ? "Deferred" : section.checkpoint?.status || "Not Started";
  const summaryRows = [
    { label: "Linked checkpoint", value: section.checkpoint?.title || "Not linked" },
    { label: "Checkpoint state", value: checkpointStatus },
    { label: "Records captured", value: String(section.summary.totalRecords) },
    { label: "In-scope records", value: String(section.summary.inScopeRecords) },
    { label: "Linked records", value: String(section.summary.linkedRecords) }
  ];

  return el("section", { className: "panel inventory-config-section" }, [
    el("div", { className: "inventory-config-section__header" }, [
      el("div", {}, [el("h4", { text: section.label }), el("p", { text: section.description })]),
      el("button", {
        className: "button",
        text: "Add record",
        onclick: () => onAddInventoryConfiguration(section.id)
      })
    ]),
    renderGridBuilderShell(`${section.label} grid`, summaryRows),
    el("p", {
      className: "checkpoint-panel__dependency",
      text: "Derived checkpoint state is read-only here. Captured rows do not auto-pass or clear blockers."
    }),
    section.records.length
      ? el(
          "div",
          { className: "inventory-config-records" },
          section.records.map((record) => renderInventoryConfigurationRecord(section, record, onUpdateInventoryConfiguration))
        )
      : el("p", { className: "info-banner", text: "No structured records captured for this section yet." })
  ]);
}

function renderAccountingConfigurationSection(section, onAddAccountingConfiguration, onUpdateAccountingConfiguration) {
  const linkedCheckpoints = section.linkedCheckpoints?.length ? section.linkedCheckpoints : section.checkpoint ? [section.checkpoint] : [];
  const summaryRows = [
    { label: "Records captured", value: String(section.summary.totalRecords) },
    { label: "In-scope records", value: String(section.summary.inScopeRecords) },
    { label: "Linked capture rows", value: String(section.summary.linkedRecords) },
    ...linkedCheckpoints.map((checkpoint, index) => ({
      label: `Linked checkpoint ${index + 1}`,
      value: `${checkpoint.title} | ${checkpoint.status} | ${checkpoint.evidenceStatus || "No evidence recorded"}`
    }))
  ];

  return el("section", { className: "panel inventory-config-section" }, [
    el("div", { className: "inventory-config-section__header" }, [
      el("div", {}, [el("h4", { text: section.label }), el("p", { text: section.description })]),
      el("button", {
        className: "button",
        text: "Add record",
        onclick: () => onAddAccountingConfiguration(section.id)
      })
    ]),
    renderGridBuilderShell(`${section.label} grid`, summaryRows),
    el("p", {
      className: "checkpoint-panel__dependency",
      text:
        "Rows are implementation capture only, not proof, not live-system state, and cannot clear blockers or pass checkpoints."
    }),
    section.records.length
      ? el(
          "div",
          { className: "inventory-config-records" },
          section.records.map((record) => renderAccountingConfigurationRecord(section, record, onUpdateAccountingConfiguration))
        )
      : el("p", { className: "info-banner", text: "No structured records captured for this section yet." })
  ]);
}

function renderSalesConfigurationSection(section, onAddSalesConfiguration, onUpdateSalesConfiguration) {
  const summaryRows = [
    { label: "Linked checkpoint", value: section.checkpoint?.title || "Not linked" },
    { label: "Checkpoint state", value: section.checkpoint?.status || "Not Started" },
    { label: "Records captured", value: String(section.summary.totalRecords) },
    { label: "In-scope records", value: String(section.summary.inScopeRecords) },
    { label: "Linked records", value: String(section.summary.linkedRecords) }
  ];

  return el("section", { className: "panel inventory-config-section" }, [
    el("div", { className: "inventory-config-section__header" }, [
      el("div", {}, [el("h4", { text: section.label }), el("p", { text: section.description })]),
      el("button", {
        className: "button",
        text: "Add record",
        onclick: () => onAddSalesConfiguration(section.id)
      })
    ]),
    renderGridBuilderShell(`${section.label} grid`, summaryRows),
    el("p", {
      className: "checkpoint-panel__dependency",
      text: "Derived checkpoint state is read-only here. Captured rows do not auto-pass or clear blockers."
    }),
    section.records.length
      ? el(
          "div",
          { className: "inventory-config-records" },
          section.records.map((record) => renderSalesConfigurationRecord(section, record, onUpdateSalesConfiguration))
        )
      : el("p", { className: "info-banner", text: "No structured records captured for this section yet." })
  ]);
}

function renderPurchaseConfigurationSection(section, onAddPurchaseConfiguration, onUpdatePurchaseConfiguration) {
  const summaryRows = [
    { label: "Linked checkpoint", value: section.checkpoint?.title || "Not linked" },
    { label: "Checkpoint state", value: section.checkpoint?.status || "Not Started" },
    { label: "Records captured", value: String(section.summary.totalRecords) },
    { label: "In-scope records", value: String(section.summary.inScopeRecords) },
    { label: "Linked records", value: String(section.summary.linkedRecords) }
  ];

  return el("section", { className: "panel inventory-config-section" }, [
    el("div", { className: "inventory-config-section__header" }, [
      el("div", {}, [el("h4", { text: section.label }), el("p", { text: section.description })]),
      el("button", {
        className: "button",
        text: "Add record",
        onclick: () => onAddPurchaseConfiguration(section.id)
      })
    ]),
    renderGridBuilderShell(`${section.label} grid`, summaryRows),
    el("p", {
      className: "checkpoint-panel__dependency",
      text: "Derived checkpoint state is read-only here. Captured rows do not auto-pass or clear blockers."
    }),
    section.records.length
      ? el(
          "div",
          { className: "inventory-config-records" },
          section.records.map((record) => renderPurchaseConfigurationRecord(section, record, onUpdatePurchaseConfiguration))
        )
      : el("p", { className: "info-banner", text: "No structured records captured for this section yet." })
  ]);
}

function renderPurchaseConfigurationRecord(section, record, onUpdatePurchaseConfiguration) {
  const fields = getPurchaseConfigurationFields(section.id, record);

  return el("section", { className: "checkpoint-panel inventory-config-record" }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [
        el("h5", { text: purchaseRecordLabel(section.id, record) }),
        el("p", { text: `Capture key: ${record.key}` })
      ]),
      renderStatusBadge(record.inScope ? "In Progress" : "Not Started")
    ]),
    el(
      "div",
      { className: "entry-grid" },
      fields.map((fieldConfig) => renderPurchaseConfigField(section.id, record.key, fieldConfig, onUpdatePurchaseConfiguration))
    )
  ]);
}

function renderPurchaseConfigField(sectionId, recordKey, fieldConfig, onUpdatePurchaseConfiguration) {
  if (fieldConfig.type === "select") {
    return selectField(fieldConfig.label, fieldConfig.options, fieldConfig.value, (value) =>
      onUpdatePurchaseConfiguration(sectionId, recordKey, {
        [fieldConfig.key]: fieldConfig.boolean ? value === "true" : value
      })
    );
  }

  return field(fieldConfig.label, fieldConfig.value, (value) =>
    onUpdatePurchaseConfiguration(sectionId, recordKey, { [fieldConfig.key]: value })
  );
}

function getPurchaseConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "processCapture":
      return [
        { key: "rfqFlowMode", label: "RFQ flow mode", value: record.rfqFlowMode },
        { key: "poConfirmationAssumptions", label: "PO confirmation assumptions", value: record.poConfirmationAssumptions },
        { key: "exceptionNotes", label: "Exception notes", value: record.exceptionNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "vendorPricingCapture":
      return [
        { key: "pricingApproachLabel", label: "Pricing approach label", value: record.pricingApproachLabel },
        { key: "vendorPricelistUsageAssumption", label: "Vendor pricelist usage assumption", value: record.vendorPricelistUsageAssumption },
        { key: "priceControlNote", label: "Price control note", value: record.priceControlNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "approvalControlCapture":
      return [
        { key: "approvalRequired", label: "Approval required", value: String(record.approvalRequired), type: "select", options: ["true", "false"], boolean: true },
        { key: "approvalOwnerRoleNote", label: "Approval owner / role note", value: record.approvalOwnerRoleNote },
        { key: "controlNotes", label: "Control notes", value: record.controlNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "inboundHandoffCapture":
      return [
        { key: "inboundHandoffType", label: "Inbound handoff type", value: record.inboundHandoffType },
        { key: "downstreamHandoffNote", label: "Downstream handoff note", value: record.downstreamHandoffNote },
        { key: "dependencyNote", label: "Dependency note", value: record.dependencyNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    default:
      return [];
  }
}

function purchaseRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "processCapture":
      return record.rfqFlowMode || "Purchase process capture record";
    case "vendorPricingCapture":
      return record.pricingApproachLabel || "Vendor pricing capture record";
    case "approvalControlCapture":
      return record.approvalOwnerRoleNote || (record.approvalRequired ? "Approval-required capture record" : "Purchase approval capture record");
    case "inboundHandoffCapture":
      return record.inboundHandoffType || "Inbound handoff capture record";
    default:
      return "Structured record";
  }
}

function renderSalesConfigurationRecord(section, record, onUpdateSalesConfiguration) {
  const fields = getSalesConfigurationFields(section.id, record);

  return el("section", { className: "checkpoint-panel inventory-config-record" }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [
        el("h5", { text: salesRecordLabel(section.id, record) }),
        el("p", { text: `Capture key: ${record.key}` })
      ]),
      renderStatusBadge(record.inScope ? "In Progress" : "Not Started")
    ]),
    el(
      "div",
      { className: "entry-grid" },
      fields.map((fieldConfig) => renderSalesConfigField(section.id, record.key, fieldConfig, onUpdateSalesConfiguration))
    )
  ]);
}

function renderSalesConfigField(sectionId, recordKey, fieldConfig, onUpdateSalesConfiguration) {
  if (fieldConfig.type === "select") {
    return selectField(fieldConfig.label, fieldConfig.options, fieldConfig.value, (value) =>
      onUpdateSalesConfiguration(sectionId, recordKey, {
        [fieldConfig.key]: fieldConfig.boolean ? value === "true" : value
      })
    );
  }

  return field(fieldConfig.label, fieldConfig.value, (value) =>
    onUpdateSalesConfiguration(sectionId, recordKey, { [fieldConfig.key]: value })
  );
}

function getSalesConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "processCapture":
      return [
        { key: "quoteFlowMode", label: "Quote flow mode", value: record.quoteFlowMode },
        { key: "orderConfirmationAssumptions", label: "Order confirmation assumptions", value: record.orderConfirmationAssumptions },
        { key: "exceptionNotes", label: "Exception notes", value: record.exceptionNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "pricingCapture":
      return [
        { key: "pricingApproachLabel", label: "Pricing approach label", value: record.pricingApproachLabel },
        { key: "pricelistUsageAssumption", label: "Pricelist usage assumption", value: record.pricelistUsageAssumption },
        { key: "discountControlNote", label: "Discount control note", value: record.discountControlNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "quotationControlCapture":
      return [
        { key: "approvalRequired", label: "Approval required", value: String(record.approvalRequired), type: "select", options: ["true", "false"], boolean: true },
        { key: "approvalOwnerRoleNote", label: "Approval owner / role note", value: record.approvalOwnerRoleNote },
        { key: "controlNotes", label: "Control notes", value: record.controlNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    case "fulfillmentHandoffCapture":
      return [
        { key: "fulfillmentHandoffType", label: "Fulfillment handoff type", value: record.fulfillmentHandoffType },
        { key: "downstreamHandoffNote", label: "Downstream handoff note", value: record.downstreamHandoffNote },
        { key: "dependencyNote", label: "Dependency note", value: record.dependencyNote },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"], boolean: true }
      ];
    default:
      return [];
  }
}

function salesRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "processCapture":
      return record.quoteFlowMode || "Sales process capture record";
    case "pricingCapture":
      return record.pricingApproachLabel || "Pricing capture record";
    case "quotationControlCapture":
      return record.approvalOwnerRoleNote || (record.approvalRequired ? "Approval-required capture record" : "Quotation control capture record");
    case "fulfillmentHandoffCapture":
      return record.fulfillmentHandoffType || "Fulfillment handoff capture record";
    default:
      return "Structured record";
  }
}

function renderAccountingConfigurationRecord(section, record, onUpdateAccountingConfiguration) {
  const fields = getAccountingConfigurationFields(section.id, record);

  return el("section", { className: "checkpoint-panel inventory-config-record" }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [
        el("h5", { text: accountingRecordLabel(section.id, record) }),
        el("p", { text: `Capture key: ${record.key}` })
      ]),
      renderStatusBadge(record.inScope ? "In Progress" : "Not Started")
    ]),
    el(
      "div",
      { className: "entry-grid" },
      fields.map((fieldConfig) => renderAccountingConfigField(section.id, record.key, fieldConfig, onUpdateAccountingConfiguration))
    )
  ]);
}

function renderAccountingConfigField(sectionId, recordKey, fieldConfig, onUpdateAccountingConfiguration) {
  if (fieldConfig.type === "select") {
    return selectField(fieldConfig.label, fieldConfig.options, fieldConfig.value, (value) =>
      onUpdateAccountingConfiguration(sectionId, recordKey, { [fieldConfig.key]: value === "true" })
    );
  }

  return field(fieldConfig.label, fieldConfig.value, (value) =>
    onUpdateAccountingConfiguration(sectionId, recordKey, { [fieldConfig.key]: value })
  );
}

function getAccountingConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "policyCapture":
      return [
        { key: "companyAccountingScope", label: "Company / accounting scope", value: record.companyAccountingScope },
        { key: "policyTopic", label: "Policy topic", value: record.policyTopic },
        { key: "valuationMethodLabel", label: "Valuation method label", value: record.valuationMethodLabel },
        { key: "inventoryScopeNotes", label: "Inventory scope notes", value: record.inventoryScopeNotes },
        { key: "decisionOwnerNotes", label: "Decision-owner notes", value: record.decisionOwnerNotes },
        { key: "downstreamConstraintNotes", label: "Downstream constraint notes", value: record.downstreamConstraintNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"] }
      ];
    case "stockMappingCapture":
      return [
        { key: "companyAccountingScope", label: "Company / accounting scope", value: record.companyAccountingScope },
        { key: "productScopeNotes", label: "Product / scope notes", value: record.productScopeNotes },
        { key: "stockInputReference", label: "Stock input reference", value: record.stockInputReference },
        { key: "stockOutputReference", label: "Stock output reference", value: record.stockOutputReference },
        { key: "valuationReference", label: "Valuation reference", value: record.valuationReference },
        { key: "supportNotes", label: "Support notes", value: record.supportNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"] }
      ];
    case "landedCostCapture":
      return [
        { key: "companyAccountingScope", label: "Company / accounting scope", value: record.companyAccountingScope },
        { key: "landedCostPolicyLabel", label: "Landed-cost policy label", value: record.landedCostPolicyLabel },
        { key: "allocationBasisNotes", label: "Allocation-basis notes", value: record.allocationBasisNotes },
        { key: "accountingTreatmentNotes", label: "Accounting treatment notes", value: record.accountingTreatmentNotes },
        { key: "supportNotes", label: "Support notes", value: record.supportNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"] }
      ];
    default:
      return [];
  }
}

function accountingRecordLabel(sectionId, record) {
  switch (sectionId) {
    case "policyCapture":
      return record.policyTopic || record.valuationMethodLabel || "Policy capture record";
    case "stockMappingCapture":
      return record.productScopeNotes || "Stock-mapping capture record";
    case "landedCostCapture":
      return record.landedCostPolicyLabel || "Landed-cost capture record";
    default:
      return "Structured record";
  }
}

function renderInventoryConfigurationRecord(section, record, onUpdateInventoryConfiguration) {
  const fields = getInventoryConfigurationFields(section.id, record);

  return el("section", { className: "checkpoint-panel inventory-config-record" }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [
        el("h5", { text: recordLabel(section.id, record) }),
        el("p", { text: `Capture key: ${record.key}` })
      ]),
      renderStatusBadge(record.inScope ? "In Progress" : "Not Started")
    ]),
    el(
      "div",
      { className: "entry-grid" },
      fields.map((fieldConfig) => renderInventoryConfigField(section.id, record.key, fieldConfig, onUpdateInventoryConfiguration))
    )
  ]);
}

function renderInventoryConfigField(sectionId, recordKey, fieldConfig, onUpdateInventoryConfiguration) {
  if (fieldConfig.type === "select") {
    return selectField(fieldConfig.label, fieldConfig.options, fieldConfig.value, (value) =>
      onUpdateInventoryConfiguration(sectionId, recordKey, { [fieldConfig.key]: value === "true" })
    );
  }

  return field(fieldConfig.label, fieldConfig.value, (value) =>
    onUpdateInventoryConfiguration(sectionId, recordKey, { [fieldConfig.key]: value })
  );
}

function getInventoryConfigurationFields(sectionId, record) {
  switch (sectionId) {
    case "warehouses":
      return [
        { key: "warehouseName", label: "Warehouse name", value: record.warehouseName },
        { key: "code", label: "Code", value: record.code },
        { key: "companyScope", label: "Company / scope", value: record.companyScope },
        { key: "purposeNotes", label: "Purpose / notes", value: record.purposeNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"] }
      ];
    case "operationTypes":
      return [
        { key: "linkedWarehouseKey", label: "Linked warehouse key", value: record.linkedWarehouseKey },
        { key: "operationTypeName", label: "Operation type name", value: record.operationTypeName },
        { key: "operationTypeKey", label: "Operation type code / key", value: record.operationTypeKey },
        { key: "flowCategory", label: "Flow direction / category", value: record.flowCategory },
        { key: "sequenceOrder", label: "Sequence / order", value: record.sequenceOrder },
        { key: "notes", label: "Notes", value: record.notes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"] }
      ];
    case "routes":
      return [
        { key: "routeName", label: "Route name", value: record.routeName },
        { key: "scopeCategory", label: "Scope / category", value: record.scopeCategory },
        { key: "linkedWarehouseKeys", label: "Linked warehouse keys", value: record.linkedWarehouseKeys.join(", ") },
        { key: "linkedOperationTypeKeys", label: "Linked operation-type keys", value: record.linkedOperationTypeKeys.join(", ") },
        { key: "purposeNotes", label: "Purpose / notes", value: record.purposeNotes },
        { key: "inScope", label: "Active / in-scope", value: String(record.inScope), type: "select", options: ["true", "false"] }
      ];
    default:
      return [];
  }
}

function recordLabel(sectionId, record) {
  switch (sectionId) {
    case "warehouses":
      return record.warehouseName || "Warehouse record";
    case "operationTypes":
      return record.operationTypeName || "Operation-type record";
    case "routes":
      return record.routeName || "Route record";
    default:
      return "Structured record";
  }
}

function renderSummaryList(title, items, formatter) {
  return el("section", { className: "panel inventory-readiness-summary__section" }, [
    el("h5", { text: title }),
    items.length
      ? el(
          "ul",
          { className: "guidance-block__list" },
          items.map((item) => el("li", { text: formatter(item) }))
        )
      : el("p", { className: "checkpoint-panel__dependency", text: "None currently recorded." })
  ]);
}

function summaryCard(label, value) {
  return el("div", { className: "summary-card" }, [
    el("strong", { text: label }),
    el("span", { text: value })
  ]);
}

function formatDomainCapabilityCardLine(capability) {
  if (!capability) {
    return `Current: Manual-only guide | Available in this build: Manual-only`;
  }

  return `Current: ${capability.label} | Available in this build: ${capability.targetLabel}`;
}

function renderCapabilityBoundaryNote(capability) {
  if (!capability.supportsPreview) {
    return el("p", {
      className: "checkpoint-panel__dependency",
      text: "This domain remains manual/checkpoint-led in this build. No preview or execution actions are available."
    });
  }

  if (!capability.supportsExecution) {
    return el("p", {
      className: "checkpoint-panel__dependency",
      text: "This domain supports inspection and preview only. Execution remains blocked in this build."
    });
  }

  return el("p", {
    className: "checkpoint-panel__dependency",
    text: "Execution is bounded. Only previews classified safe and executable can run, and every attempt is logged."
  });
}

function canExecutePreview(preview, capability) {
  return capability.supportsExecution && preview.executable && preview.safetyClass === "safe";
}

function getPreviewExecutionConstraint(preview, capability) {
  if (preview.blockedReason) {
    return preview.blockedReason;
  }

  if (!capability.supportsExecution) {
    return "Execution for this domain is not enabled in this build.";
  }

  if (preview.safetyClass !== "safe") {
    return `Execution blocked by safety class: ${preview.safetyClass}.`;
  }

  if (!preview.executable) {
    return "Execution prerequisites are not satisfied for this preview.";
  }

  return "Execution is available only for previews classified safe and executable.";
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [el("h2", { text: title }), el("p", { text: description })]);
}

function heroButton(label, onClick, options = {}) {
  return el("button", {
    className: "button",
    onclick: options.disabled ? null : onClick,
    disabled: options.disabled ? "disabled" : undefined,
    text: label
  });
}

function findStatus(items, id) {
  return items.find((item) => item.id === id)?.status || "Not Started";
}

function field(label, value, onChange, options = {}) {
  return el("label", { className: "field" }, [
    el("span", { text: label }),
    el("input", {
      id: options.id,
      readOnly: options.readOnly,
      value,
      oninput: (event) => onChange(event.target.value)
    })
  ]);
}

function selectField(label, options, selectedValue, onChange) {
  return el("label", { className: "field" }, [
    el("span", { text: label }),
    el(
      "select",
      { onchange: (event) => onChange(event.target.value) },
      options.map((optionValue) => {
        const option = el("option", { value: optionValue, text: optionValue });
        option.selected = optionValue === selectedValue;
        return option;
      })
    )
  ]);
}
