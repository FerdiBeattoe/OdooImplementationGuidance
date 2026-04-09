import PdfPrinterModule from "pdfmake/js/Printer.js";

const PdfPrinter = PdfPrinterModule.default || PdfPrinterModule;

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);
const REPORT_CONTENT_TYPE = "application/pdf";
const NAVY = "#0c1a30";
const AMBER = "#f59e0b";

export async function generateGoLiveReport({ projectId, auditEntries = [], runtimeState = {} } = {}) {
  try {
    const normalizedProjectId = normalizeProjectId(projectId);
    const sortedAuditEntries = sortAuditEntries(auditEntries);
    const safeRuntimeState = isPlainObject(runtimeState) ? runtimeState : {};
    const metrics = deriveSummaryMetrics(normalizedProjectId, sortedAuditEntries, safeRuntimeState);
    const timelineGroups = buildTimelineGroups(sortedAuditEntries);
    const governedWriteEntries = selectGovernedWriteEntries(sortedAuditEntries);
    const checkpointRecords = listCheckpointRecords(safeRuntimeState);
    const checkpointRows = buildCheckpointRows(
      checkpointRecords,
      getCheckpointStatuses(safeRuntimeState),
      getCheckpointConfirmations(safeRuntimeState)
    );

    const docDefinition = buildDocumentDefinition({
      projectId: normalizedProjectId,
      metrics,
      runtimeState: safeRuntimeState,
      timelineGroups,
      governedWriteEntries,
      checkpointRows,
    });

    const buffer = await createPdfBuffer(docDefinition);
    const filename = buildFilename(normalizedProjectId);

    return {
      ok: true,
      buffer,
      filename,
      contentType: REPORT_CONTENT_TYPE,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate go-live report.";
    return { ok: false, error: message };
  }
}

function normalizeProjectId(projectId) {
  if (typeof projectId === "string" && projectId.trim() !== "") {
    return projectId.trim();
  }
  return "unknown_project";
}

function buildDocumentDefinition({
  projectId,
  metrics,
  runtimeState,
  timelineGroups,
  governedWriteEntries,
  checkpointRows,
}) {
  return {
    pageMargins: [40, 60, 40, 60],
    info: {
      title: `Project Odoo Go-Live Report - ${projectId}`,
      author: "Project ERP",
      subject: "ERPPath implementation readiness",
    },
    content: [
      buildCoverPage(projectId, metrics),
      buildExecutiveSummarySection(metrics),
      buildDiscoveryProfileSection(runtimeState, metrics),
      buildImplementationTimelineSection(timelineGroups),
      buildGovernedWritesSection(governedWriteEntries),
      buildCheckpointSection(checkpointRows),
      buildSignOffSection(metrics),
    ],
    styles: buildStyles(),
    defaultStyle: {
      font: "Helvetica",
      fontSize: 10,
      color: NAVY,
      lineHeight: 1.3,
    },
    footer(currentPage, pageCount) {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "right",
        margin: [0, 10, 40, 0],
        fontSize: 8,
        color: "#475569",
      };
    },
  };
}

function buildStyles() {
  return {
    coverBadge: {
      fontSize: 12,
      color: AMBER,
      margin: [0, 0, 0, 8],
      bold: true,
    },
    coverTitle: {
      fontSize: 28,
      bold: true,
      margin: [0, 0, 0, 10],
    },
    coverSubtitle: {
      fontSize: 16,
      margin: [0, 0, 0, 40],
      color: "#334155",
    },
    coverMeta: {
      fontSize: 11,
      color: "#475569",
      margin: [0, 4, 0, 0],
    },
    sectionHeading: {
      fontSize: 16,
      bold: true,
      margin: [0, 16, 0, 8],
      color: NAVY,
    },
    sectionSubheading: {
      fontSize: 12,
      bold: true,
      margin: [0, 8, 0, 4],
      color: NAVY,
    },
    tableHeader: {
      fillColor: "#e2e8f0",
      bold: true,
      color: NAVY,
    },
    summaryLabel: {
      color: "#475569",
    },
    summaryValue: {
      bold: true,
    },
    emptyState: {
      italics: true,
      color: "#6b7280",
      margin: [0, 4, 0, 0],
    },
    signRole: {
      bold: true,
    },
  };
}

function buildCoverPage(projectId, metrics) {
  return {
    stack: [
      { text: "ERPPath", style: "coverBadge" },
      { text: "Project Odoo Go-Live Report", style: "coverTitle" },
      { text: "Guided implementation readiness overview", style: "coverSubtitle" },
      { text: `Project ID: ${projectId}`, style: "coverMeta" },
      { text: `Implementation window: ${metrics.dateRangeLabel}`, style: "coverMeta" },
      { text: `Activated domains: ${metrics.domainNames.length}`, style: "coverMeta" },
    ],
    margin: [0, 120, 0, 0],
    pageBreak: "after",
  };
}

function buildExecutiveSummarySection(metrics) {
  const rows = [
    [
      { text: "Implementation window", style: "summaryLabel" },
      { text: metrics.dateRangeLabel, style: "summaryValue" },
    ],
    [
      { text: "Duration (days)", style: "summaryLabel" },
      { text: metrics.durationLabel, style: "summaryValue" },
    ],
    [
      { text: "Domains activated", style: "summaryLabel" },
      { text: metrics.domainNames.join(", ") || "No domains recorded", style: "summaryValue" },
    ],
    [
      { text: "Checkpoints complete", style: "summaryLabel" },
      { text: `${metrics.completedCheckpoints} / ${metrics.totalCheckpoints}`, style: "summaryValue" },
    ],
    [
      { text: "Governed writes logged", style: "summaryLabel" },
      { text: `${metrics.governedWriteCount}`, style: "summaryValue" },
    ],
    [
      { text: "Discovery answers captured", style: "summaryLabel" },
      { text: `${metrics.discoveryAnswerCount}`, style: "summaryValue" },
    ],
  ];

  return {
    stack: [
      { text: "Executive Summary", style: "sectionHeading" },
      {
        table: {
          widths: [200, "*"],
          body: rows,
        },
        layout: "lightHorizontalLines",
      },
    ],
  };
}

function buildDiscoveryProfileSection(runtimeState, metrics) {
  const identity = isPlainObject(runtimeState.project_identity) ? runtimeState.project_identity : {};
  const industry = isPlainObject(runtimeState.industry_selection)
    ? runtimeState.industry_selection
    : {};

  const rows = [
    ["Project name", safeString(identity.project_name)],
    ["Company", safeString(identity.company_name)],
    ["Primary contact", safeString(identity.primary_contact)],
    ["Contact email", safeString(identity.contact_email)],
    ["Industry selection", safeString(industry.industry_name)],
    ["Discovery answers recorded", `${metrics.discoveryAnswerCount}`],
  ];

  const domainList = metrics.domainNames.length
    ? metrics.domainNames
    : ["No activated domains recorded"];

  return {
    stack: [
      { text: "Discovery Profile", style: "sectionHeading" },
      {
        table: {
          widths: [200, "*"],
          body: rows,
        },
        layout: "lightHorizontalLines",
      },
      { text: "Activated domains", style: "sectionSubheading" },
      {
        ul: domainList.map((domain) => ({ text: domain })),
        margin: [0, 0, 0, 0],
      },
    ],
  };
}

function buildImplementationTimelineSection(timelineGroups) {
  const stacks = timelineGroups.length
    ? timelineGroups.map((group) => ({
        stack: [
          { text: group.domainLabel, style: "sectionSubheading" },
          {
            ul: group.events.map((event) => eventToLine(event)),
          },
        ],
        margin: [0, 4, 0, 8],
      }))
    : [{ text: "No audit activity recorded for this project.", style: "emptyState" }];

  return {
    stack: [
      { text: "Implementation Timeline by Domain", style: "sectionHeading" },
      ...stacks,
    ],
  };
}

function buildGovernedWritesSection(entries) {
  if (!entries.length) {
    return {
      stack: [
        { text: "Governed Writes Log", style: "sectionHeading" },
        { text: "No governed write executions have been recorded yet.", style: "emptyState" },
      ],
    };
  }

  const header = [
    { text: "Timestamp", style: "tableHeader" },
    { text: "Checkpoint", style: "tableHeader" },
    { text: "Model", style: "tableHeader" },
    { text: "Field / Target", style: "tableHeader" },
    { text: "Value summary", style: "tableHeader" },
  ];

  const body = entries.map((entry) => [
    formatDateTime(entry.created_at),
    entry.checkpointRef,
    entry.model,
    entry.field,
    entry.value,
  ]);

  return {
    stack: [
      { text: "Governed Writes Log", style: "sectionHeading" },
      {
        table: {
          widths: [110, 90, 90, 110, "*"],
          body: [header, ...body],
        },
        layout: "lightHorizontalLines",
      },
    ],
  };
}

function buildCheckpointSection(rows) {
  if (!rows.length) {
    return {
      stack: [
        { text: "Checkpoint Completion Record", style: "sectionHeading" },
        { text: "Runtime state does not contain checkpoint records.", style: "emptyState" },
      ],
    };
  }

  const header = [
    { text: "Checkpoint", style: "tableHeader" },
    { text: "Domain", style: "tableHeader" },
    { text: "Status", style: "tableHeader" },
    { text: "Confirmed at", style: "tableHeader" },
  ];

  return {
    stack: [
      { text: "Checkpoint Completion Record", style: "sectionHeading" },
      {
        table: {
          headerRows: 1,
          widths: [120, 90, 90, "*"],
          body: [header, ...rows],
        },
        layout: "lightHorizontalLines",
      },
    ],
  };
}

function buildSignOffSection(metrics) {
  return {
    stack: [
      { text: "Governed Sign-Off", style: "sectionHeading", pageBreak: "before" },
      {
        text:
          "ERPPath requires explicit acknowledgement that every governed write and checkpoint review has been inspected prior to go-live.",
        margin: [0, 0, 0, 20],
      },
      {
        columns: [
          buildSignatureBlock("Project lead"),
          buildSignatureBlock("Implementation owner"),
          buildSignatureBlock("Reviewer"),
        ],
        columnGap: 24,
      },
      {
        text: `Implementation window: ${metrics.dateRangeLabel}`,
        margin: [0, 24, 0, 0],
      },
    ],
  };
}

function buildSignatureBlock(label) {
  return {
    width: "*",
    stack: [
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 4] },
      { text: label, style: "signRole" },
      { text: "Name / Date", style: "summaryLabel" },
    ],
  };
}

function selectGovernedWriteEntries(entries) {
  return entries
    .filter((entry) => entry?.action === "governed_write_succeeded")
    .map((entry) => ({
      created_at: entry.created_at,
      checkpointRef: entry.checkpoint_id || entry.details?.checkpoint_id || "Unassigned",
      model:
        entry.details?.operation_model ||
        entry.details?.model ||
        entry.details?.odoo_model ||
        "Unknown model",
      field:
        entry.details?.operation_method ||
        entry.details?.field ||
        entry.details?.target_field ||
        "Unknown field",
      value: summarizeValue(entry.details),
    }));
}

function summarizeValue(details) {
  if (!isPlainObject(details)) {
    return "Not provided";
  }
  if (typeof details.value_summary === "string" && details.value_summary.trim() !== "") {
    return details.value_summary.trim();
  }
  if (typeof details.execution_source_inputs === "string" && details.execution_source_inputs.trim() !== "") {
    return details.execution_source_inputs.trim();
  }
  if (isPlainObject(details.execution_source_inputs)) {
    const keys = Object.keys(details.execution_source_inputs);
    if (keys.length > 0) {
      const values = keys
        .slice(0, 3)
        .map((key) => `${key}: ${stringifyValue(details.execution_source_inputs[key])}`)
        .join(", ");
      return values || "Provided";
    }
  }
  return "Provided";
}

function stringifyValue(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function buildCheckpointRows(records, statuses, confirmations) {
  return records.map((record) => {
    const checkpointId = record.checkpoint_id || record.id || "";
    const domainId = record.domain || record.domain_id || "general";
    const status = statuses[checkpointId] || "Pending";
    const confirmation = confirmations[checkpointId];
    return [
      checkpointId,
      humanizeDomainId(domainId),
      status,
      formatDateTime(confirmation?.confirmed_at),
    ];
  });
}

function listCheckpointRecords(runtimeState) {
  if (Array.isArray(runtimeState?.checkpoints)) {
    return runtimeState.checkpoints.filter((record) => record && record.checkpoint_id);
  }
  if (Array.isArray(runtimeState?.checkpoints?.records)) {
    return runtimeState.checkpoints.records.filter((record) => record && record.checkpoint_id);
  }
  return [];
}

function getCheckpointStatuses(runtimeState) {
  return isPlainObject(runtimeState?.checkpoint_statuses)
    ? runtimeState.checkpoint_statuses
    : {};
}

function getCheckpointConfirmations(runtimeState) {
  return isPlainObject(runtimeState?.checkpoint_confirmations)
    ? runtimeState.checkpoint_confirmations
    : {};
}

function deriveSummaryMetrics(projectId, auditEntries, runtimeState) {
  const start = auditEntries.length ? Date.parse(auditEntries[0].created_at) : null;
  const end = auditEntries.length ? Date.parse(auditEntries[auditEntries.length - 1].created_at) : null;
  const durationDays = computeDurationDays(start, end);

  const domainNames = extractDomainNames(runtimeState, auditEntries);
  const checkpointRecords = listCheckpointRecords(runtimeState);
  const statuses = getCheckpointStatuses(runtimeState);
  const completed = checkpointRecords.reduce((sum, record) => {
    const value = statuses[record.checkpoint_id];
    return value === "Complete" ? sum + 1 : sum;
  }, 0);

  return {
    projectId,
    startDate: isValidDate(start) ? new Date(start) : null,
    endDate: isValidDate(end) ? new Date(end) : null,
    durationDays,
    dateRangeLabel: buildDateRangeLabel(start, end),
    durationLabel: durationDays ? `${durationDays}` : "Pending",
    domainNames,
    completedCheckpoints: completed,
    totalCheckpoints: checkpointRecords.length,
    governedWriteCount: countGovernedWriteEvents(auditEntries),
    discoveryAnswerCount: countDiscoveryAnswers(runtimeState),
  };
}

function sortAuditEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return [...entries].sort((a, b) => {
    const aTime = Date.parse(a?.created_at || "");
    const bTime = Date.parse(b?.created_at || "");
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return -1;
    if (Number.isNaN(bTime)) return 1;
    return aTime - bTime;
  });
}

function buildTimelineGroups(entries) {
  if (!entries.length) {
    return [];
  }

  const groups = new Map();
  for (const entry of entries) {
    const domainId = normalizeDomain(entry);
    if (!groups.has(domainId)) {
      groups.set(domainId, []);
    }
    groups.get(domainId).push(entry);
  }

  return Array.from(groups.entries()).map(([domainId, events]) => ({
    domainId,
    domainLabel: humanizeDomainId(domainId),
    events: events.map((event) => ({
      timestamp: event.created_at,
      action: event.action,
      checkpoint: event.checkpoint_id || event.details?.checkpoint_id || null,
    })),
  }));
}

function eventToLine(event) {
  const timestamp = formatDateTime(event.timestamp);
  const action = humanizeAction(event.action);
  const checkpoint = event.checkpoint ? ` (${event.checkpoint})` : "";
  return `${timestamp} - ${action}${checkpoint}`;
}

function normalizeDomain(entry) {
  const direct = typeof entry?.domain === "string" && entry.domain.trim() !== "" ? entry.domain.trim() : null;
  if (direct) {
    return direct;
  }
  const detailDomain = typeof entry?.details?.domain === "string" && entry.details.domain.trim() !== ""
    ? entry.details.domain.trim()
    : null;
  if (detailDomain) {
    return detailDomain;
  }
  return "general";
}

function humanizeAction(action) {
  if (typeof action !== "string" || action.trim() === "") {
    return "Event";
  }
  return action
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractDomainNames(runtimeState, auditEntries) {
  const names = [];
  const seen = new Set();

  const activatedRecords = Array.isArray(runtimeState?.activated_domains?.domains)
    ? runtimeState.activated_domains.domains
        .filter((record) => record && record.activated === true)
        .map((record) => record.domain_id)
    : [];

  for (const domainId of activatedRecords) {
    const label = humanizeDomainId(domainId);
    if (!seen.has(label)) {
      names.push(label);
      seen.add(label);
    }
  }

  if (names.length === 0 && Array.isArray(runtimeState?.activated_domains_preview)) {
    for (const domainId of runtimeState.activated_domains_preview) {
      const label = humanizeDomainId(domainId);
      if (!seen.has(label)) {
        names.push(label);
        seen.add(label);
      }
    }
  }

  if (names.length === 0 && Array.isArray(auditEntries)) {
    for (const entry of auditEntries) {
      const label = humanizeDomainId(entry?.domain || entry?.details?.domain || null);
      if (!seen.has(label)) {
        names.push(label);
        seen.add(label);
      }
    }
  }

  return names;
}

function humanizeDomainId(domainId) {
  if (typeof domainId !== "string" || domainId.trim() === "") {
    return "General";
  }
  return domainId
    .trim()
    .split(/[\s_\-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function countGovernedWriteEvents(entries) {
  if (!Array.isArray(entries)) {
    return 0;
  }
  return entries.reduce((count, entry) => {
    if (typeof entry?.action !== "string") {
      return count;
    }
    if (entry.action.startsWith("governed_write_")) {
      return count + 1;
    }
    if (entry.action === "checkpoint_confirmed") {
      return count + 1;
    }
    return count;
  }, 0);
}

function countDiscoveryAnswers(runtimeState) {
  const answers = runtimeState?.discovery_answers?.answers;
  if (!isPlainObject(answers)) {
    return 0;
  }
  return Object.keys(answers).length;
}

function computeDurationDays(startMs, endMs) {
  if (!isValidDate(startMs) || !isValidDate(endMs) || endMs < startMs) {
    return 0;
  }
  const diff = endMs - startMs;
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function buildDateRangeLabel(startMs, endMs) {
  if (!isValidDate(startMs) && !isValidDate(endMs)) {
    return "Timeline pending";
  }
  if (isValidDate(startMs) && isValidDate(endMs)) {
    return `${formatDate(startMs)} to ${formatDate(endMs)}`;
  }
  if (isValidDate(startMs)) {
    return `${formatDate(startMs)} onward`;
  }
  return `through ${formatDate(endMs)}`;
}

function formatDate(value) {
  if (!isValidDate(value)) {
    return "Not recorded";
  }
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!isValidDate(value)) {
    return "Not recorded";
  }
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeString(value) {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return "Not recorded";
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value) {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  if (typeof value === "number") {
    return !Number.isNaN(value);
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function buildFilename(projectId) {
  const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const today = formatDateStamp(new Date());
  return `erppath-implementation-report-${safeId}-${today}.pdf`;
}

function formatDateStamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function createPdfBuffer(docDefinition) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      pdfDoc.on("data", (chunk) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err) => reject(err));
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default generateGoLiveReport;
