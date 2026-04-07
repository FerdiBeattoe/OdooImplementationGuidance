import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState, setCurrentView } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { pipelineStore } from "../state/pipeline-store.js";
import { getCheckpointRecords, humanizeDomainId, triggerRefresh } from "./pipeline-dashboard.js";

const NAVY = "#0c1a30";
const AMBER = "#f59e0b";
const SUCCESS = "#16a34a";
const DANGER = "#dc2626";
const MUTED = "#6b7280";
const BORDER = "#e2e8f0";
const CARD = `background: #ffffff; border: 1px solid ${BORDER}; border-radius: 10px;`;
const EM_DASH = "\u2014";
const FADED_AMBER = "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const SECONDARY = "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const PRIMARY = "background: #0c1a30; border: 1px solid #0c1a30; color: #ffffff; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";

let toastTimer = null;

function icon(name, size) {
  const normalized = String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();
  return lucideIcon(normalized, size);
}

function toastHost() {
  if (typeof document === "undefined") return null;
  let host = document.getElementById("pre-commit-report-toast-host");
  if (!host) {
    host = el("div", {
      id: "pre-commit-report-toast-host",
      style: "position: fixed; right: 24px; bottom: 24px; z-index: 120; display: flex; flex-direction: column; gap: 12px;",
    });
    document.body.append(host);
  }
  return host;
}

function showToast(message) {
  const host = toastHost();
  if (!host) return;
  clearNode(host);
  if (toastTimer) clearTimeout(toastTimer);
  host.append(el("div", {
    style: "background: #0c1a30; color: #ffffff; padding: 12px 20px; border-radius: 6px; font-size: 14px; box-shadow: 0 10px 25px rgba(12,26,48,0.18); max-width: 320px; font-family: Inter, sans-serif;",
    text: message,
  }));
  toastTimer = setTimeout(() => {
    clearNode(host);
    toastTimer = null;
  }, 3000);
}

function headers(token, json = true) {
  const result = {};
  if (json) result["Content-Type"] = "application/json";
  if (token) result.Authorization = `Bearer ${token}`;
  return result;
}

async function readJson(response) {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function requestTeamJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  if (payload?.error) throw new Error(payload.error);
  return payload;
}

function roleLabel(role) {
  if (role === "project_lead") return "Project Lead";
  if (role === "implementor") return "Implementor";
  if (role === "reviewer") return "Reviewer";
  if (role === "stakeholder") return "Stakeholder";
  return role || "";
}

function formatTimestamp(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return EM_DASH;
  if (Array.isArray(value)) return value.length ? value.join(", ") : EM_DASH;
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return EM_DASH;
    if (entries.length === 1) return formatValue(entries[0][1]);
    return JSON.stringify(value);
  }
  return String(value);
}

function resolveProjectId(runtimeState, project, appState, onboardingState) {
  return runtimeState?.project_identity?.project_id ||
    onboardingState?.connection?.project_id ||
    project?.projectIdentity?.projectId ||
    appState?.activeProject?.projectIdentity?.projectId ||
    null;
}

function activeDomains(runtimeState) {
  const domains = runtimeState?.activated_domains?.domains;
  if (!Array.isArray(domains)) return [];
  return domains.map((domain) => {
    if (typeof domain === "string") return domain;
    if (domain?.activated === false) return null;
    return domain?.domain_id ?? domain?.id ?? null;
  }).filter(Boolean);
}

function blockers(runtimeState) {
  return Array.isArray(runtimeState?.blockers?.active_blockers) ? runtimeState.blockers.active_blockers : [];
}

function confirmations(runtimeState) {
  const records = runtimeState?.checkpoint_confirmations;
  return records && typeof records === "object" && !Array.isArray(records) ? records : {};
}

function approvals(runtimeState) {
  const records = runtimeState?._engine_outputs?.execution_approvals?.execution_approvals;
  return Array.isArray(records) ? records.filter((record) => record && record.execution_occurred === false) : [];
}

function executions(runtimeState) {
  return Array.isArray(runtimeState?.executions) ? runtimeState.executions : [];
}

function previewForCheckpoint(checkpointId, runtimeState) {
  const previews = Array.isArray(runtimeState?.previews) ? runtimeState.previews : [];
  return previews.find((preview) => preview?.checkpoint_id === checkpointId || preview?.linked_checkpoint_id === checkpointId) || null;
}

function previewForApproval(approval, runtimeState) {
  const previews = Array.isArray(runtimeState?.previews) ? runtimeState.previews : [];
  return previews.find((preview) => preview?.preview_id === approval?.preview_id) || null;
}

function currentMembership(members, onboardingState) {
  const userId = onboardingState?.user?.id || null;
  const userEmail = String(onboardingState?.user?.email || "").trim().toLowerCase();
  const accepted = Array.isArray(members) ? members.filter((member) => member?.accepted_at) : [];
  return accepted.find((member) => {
    if (userId && member.account_id === userId) return true;
    return !userId && userEmail && String(member.email || "").trim().toLowerCase() === userEmail;
  }) || null;
}

function actorDisplay(confirmation, members) {
  if (!confirmation?.actor) return null;
  const actor = String(confirmation.actor).trim();
  const actorLower = actor.toLowerCase();
  const member = Array.isArray(members) ? members.find((candidate) => {
    const email = String(candidate?.email || "").trim().toLowerCase();
    const fullName = String(candidate?.full_name || "").trim().toLowerCase();
    return email === actorLower || fullName === actorLower;
  }) : null;
  return member ? `${member.full_name} (${roleLabel(member.role)})` : actor;
}

function fieldLabel(preview) {
  const changes = preview?.intended_changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return EM_DASH;
  const keys = Object.keys(changes);
  return keys.length ? keys.join(", ") : EM_DASH;
}

function badge(text) {
  const background = text === "Safe" ? "rgba(22,163,74,0.12)" : text === "Conditional" ? "rgba(245,158,11,0.12)" : "rgba(12,26,48,0.06)";
  const color = text === "Safe" ? "#166534" : text === "Conditional" ? "#92400e" : NAVY;
  return el("span", {
    style: `display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 6px; background: ${background}; color: ${color}; font-size: 12px; font-weight: 600; font-family: Inter, sans-serif;`,
    text: text || EM_DASH,
  });
}

function detail(label, value, muted = false) {
  return el("div", { style: "display: flex; flex-direction: column; gap: 4px;" }, [
    el("span", { style: "font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 700;", text: label }),
    el("span", { style: `font-size: 14px; color: ${muted ? MUTED : NAVY};`, text: value || EM_DASH }),
  ]);
}

function memberName(member) {
  return String(member?.full_name || member?.email || "").trim();
}

function resolveCompanyName(runtimeState, project, appState) {
  const projectIdentity = runtimeState?.project_identity || {};
  const candidates = [
    appState?.activeProject?.projectIdentity?.organizationName,
    project?.projectIdentity?.organizationName,
    projectIdentity.organization_name,
    projectIdentity.customer_entity,
    projectIdentity.company_name,
    projectIdentity.project_name,
    appState?.activeProject?.projectIdentity?.projectName,
    project?.projectIdentity?.projectName,
  ];
  const value = candidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  return value ? value.trim() : null;
}

function resolveProjectLeadDisplay(members, membership, onboardingState) {
  const acceptedMembers = Array.isArray(members) ? members.filter((member) => member?.accepted_at) : [];
  const projectLead = acceptedMembers.find((member) => member?.role === "project_lead");
  if (projectLead) return `${memberName(projectLead) || EM_DASH} (${roleLabel(projectLead.role)})`;
  if (membership) return `${memberName(membership) || EM_DASH} (${roleLabel(membership.role)})`;
  const fallbackName = String(onboardingState?.user?.full_name || onboardingState?.user?.email || "").trim();
  return fallbackName ? `${fallbackName} (${roleLabel(membership?.role || "project_lead") || "Project Lead"})` : EM_DASH;
}

function formatPdfDate(value) {
  if (!value) return EM_DASH;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return EM_DASH;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatPdfTimestamp(value) {
  if (!value) return EM_DASH;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return EM_DASH;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatPdfFilenameDate(value) {
  const parsed = value ? new Date(value) : new Date();
  const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = safe.getFullYear();
  const month = String(safe.getMonth() + 1).padStart(2, "0");
  const day = String(safe.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function stripedPdfRow(values, rowIndex, extra = {}) {
  const fillColor = rowIndex % 2 === 0 ? "#ffffff" : "#f9fafb";
  return values.map((value) => ({
    text: value || EM_DASH,
    fillColor,
    ...extra,
  }));
}

function pdfTableLayout() {
  return {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => BORDER,
    vLineColor: () => BORDER,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 5,
    paddingBottom: () => 5,
  };
}

function pdfMetadataLayout() {
  return {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  };
}

function checkpointPdfRows(domain) {
  const rows = domain.checkpoints.length ? domain.checkpoints : [{
    checkpointId: EM_DASH,
    title: "No checkpoints available",
    model: EM_DASH,
    field: EM_DASH,
    intendedValue: EM_DASH,
    safetyClass: EM_DASH,
    approvedBy: EM_DASH,
    approvedAt: EM_DASH,
  }];
  return rows.map((checkpoint, index) => stripedPdfRow([
    checkpoint.checkpointId || EM_DASH,
    checkpoint.title || EM_DASH,
    checkpoint.model || EM_DASH,
    checkpoint.field || EM_DASH,
    checkpoint.intendedValue || EM_DASH,
    checkpoint.safetyClass || EM_DASH,
    checkpoint.approvedBy || EM_DASH,
    checkpoint.approvedAt || EM_DASH,
  ], index, { fontSize: 9, color: NAVY }));
}

function buildPdfDefinition(report) {
  const reportDate = formatPdfDate(report.generatedAt);
  const metadataRows = [
    ["Project", report.projectId || EM_DASH],
    ["Instance", report.url || EM_DASH],
    ["Database", report.database || EM_DASH],
    ["Generated", formatPdfTimestamp(report.generatedAt)],
    ["Approved by", report.projectLeadDisplay || EM_DASH],
  ];
  const content = [
    {
      text: "Pre-Commit Implementation Report",
      fontSize: 20,
      bold: true,
      color: NAVY,
      margin: [0, 0, 0, 16],
    },
    {
      table: {
        widths: [110, "*"],
        body: metadataRows.map((row, index) => stripedPdfRow([
          row[0],
          row[1],
        ], index, { fontSize: 9, color: NAVY }).map((cell, columnIndex) => ({
          ...cell,
          bold: columnIndex === 0,
        }))),
      },
      layout: pdfMetadataLayout(),
      margin: [0, 0, 0, 18],
    },
  ];

  report.activeDomains.forEach((domain) => {
    content.push(
      {
        text: String(domain.domainLabel || EM_DASH).toUpperCase(),
        fontSize: 11,
        bold: true,
        color: NAVY,
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: [44, "*", 84, 68, "*", 78, 102, 76],
          body: [
            [
              { text: "ID", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Name", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Model", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Field", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Intended Value", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Safety Class", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Approved By", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
              { text: "Approved At", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 9 },
            ],
            ...checkpointPdfRows(domain),
          ],
        },
        layout: pdfTableLayout(),
        margin: [0, 0, 0, 18],
      }
    );
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ["*", "*", "*", "*"],
      body: [
        [
          { text: "Total modules", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 10 },
          { text: "Confirmed", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 10 },
          { text: "Pending writes", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 10 },
          { text: "Blocked", fillColor: NAVY, color: "#ffffff", bold: true, fontSize: 10 },
        ],
        stripedPdfRow([
          String(report.totalModulesActive),
          String(report.confirmedCheckpointCount),
          String(report.pendingWriteCount),
          String(report.blockedCheckpointCount),
        ], 0, { fontSize: 10, color: NAVY }),
      ],
    },
    layout: pdfTableLayout(),
    margin: [0, 0, 0, 0],
  });

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [40, 72, 40, 56],
    defaultStyle: {
      fontSize: 10,
      color: NAVY,
    },
    header(currentPage, pageCount, pageSize) {
      return {
        margin: [40, 18, 40, 0],
        stack: [
          {
            columns: [
              { text: report.clientCompanyName || report.projectId || EM_DASH, bold: true, color: NAVY, fontSize: 10 },
              { text: reportDate, alignment: "right", color: NAVY, fontSize: 10 },
            ],
          },
          {
            canvas: [
              { type: "line", x1: 0, y1: 10, x2: pageSize.width - 80, y2: 10, lineWidth: 2, lineColor: AMBER },
            ],
          },
        ],
      };
    },
    footer(currentPage, pageCount, pageSize) {
      return {
        margin: [40, 0, 40, 14],
        stack: [
          {
            canvas: [
              { type: "line", x1: 0, y1: 0, x2: pageSize.width - 80, y2: 0, lineWidth: 1, lineColor: NAVY },
            ],
            margin: [0, 0, 0, 8],
          },
          {
            columns: [
              { text: "Powered by Project Odoo  projecterp.com", fontSize: 8, color: MUTED },
              {
                text: [{ text: currentPage }, " of ", { text: pageCount }],
                alignment: "right",
                fontSize: 8,
                color: MUTED,
              },
            ],
          },
        ],
      };
    },
    content,
  };
}

function exportPdf(report) {
  if (typeof window === "undefined" || !window.pdfMake) {
    console.error("PDF export unavailable: window.pdfMake is not loaded.");
    showToast("PDF export unavailable. Please refresh and try again.");
    return;
  }
  try {
    const filename = `PreCommit-${report.projectId || "project"}-${formatPdfFilenameDate(report.generatedAt)}.pdf`;
    window.pdfMake.createPdf(buildPdfDefinition(report)).download(filename);
  } catch (error) {
    console.error("PDF export failed.", error);
    showToast("PDF export unavailable. Please refresh and try again.");
  }
}

function buildReportModel({ runtimeState, members, onboardingState, project, appState, generatedAt }) {
  const records = getCheckpointRecords(runtimeState);
  const activeDomainIds = activeDomains(runtimeState);
  const confirmationMap = confirmations(runtimeState);
  const approvalMap = new Map(approvals(runtimeState).map((approval) => [approval.checkpoint_id, approval]));
  const executionMap = new Map(executions(runtimeState).filter((execution) => execution?.checkpoint_id && execution?.result_status === "success").map((execution) => [execution.checkpoint_id, execution]));
  const blockerMap = new Map(blockers(runtimeState).filter((blocker) => blocker?.source_checkpoint_id || blocker?.checkpoint_id).map((blocker) => [blocker.source_checkpoint_id || blocker.checkpoint_id, blocker]));
  const domainIds = Array.from(new Set([...activeDomainIds, ...records.map((record) => record?.domain ?? record?.domain_id ?? null).filter(Boolean)]));
  const domains = domainIds.map((domainId) => {
    const checkpoints = records
      .filter((record) => (record?.domain ?? record?.domain_id ?? null) === domainId)
      .sort((a, b) => String(a?.checkpoint_id || "").localeCompare(String(b?.checkpoint_id || "")))
      .map((record) => {
        const checkpointId = record?.checkpoint_id || "";
        const confirmation = confirmationMap[checkpointId] || null;
        const execution = executionMap.get(checkpointId) || null;
        const blocker = blockerMap.get(checkpointId) || null;
        const approval = approvalMap.get(checkpointId) || null;
        const preview = previewForCheckpoint(checkpointId, runtimeState);
        const isExecuted = Boolean(execution);
        const isBlocked = Boolean(blocker) || record?.status === "Blocked";
        const isConfirmed = Boolean(confirmation) || record?.status === "Complete";
        return {
          checkpointId,
          title: record?.checkpoint_name ? `${checkpointId} ${record.checkpoint_name}` : checkpointId,
          operation: preview?.target_operation || EM_DASH,
          model: preview?.target_model || EM_DASH,
          field: fieldLabel(preview),
          intendedValue: formatValue(preview?.intended_changes),
          safetyClass: record?.safety_class || EM_DASH,
          approvedBy: confirmation ? actorDisplay(confirmation, members) || String(confirmation.actor || "") : "Awaiting confirmation",
          approvedAt: confirmation?.confirmed_at ? formatTimestamp(confirmation.confirmed_at) : "",
          blockerReason: blocker?.blocked_reason || "",
          hasPendingWrite: Boolean(approval),
          isExecuted,
          isBlocked,
          isConfirmed,
          borderColor: isExecuted ? SUCCESS : isBlocked ? DANGER : isConfirmed ? AMBER : "#e5e7eb",
        };
      });
    const pendingWriteCount = checkpoints.filter((checkpoint) => checkpoint.hasPendingWrite).length;
    const blockedCount = checkpoints.filter((checkpoint) => checkpoint.isBlocked).length;
    const confirmedCount = checkpoints.filter((checkpoint) => checkpoint.isConfirmed).length;
    return {
      domainId,
      domainLabel: humanizeDomainId(domainId),
      checkpoints,
      totalCount: checkpoints.length,
      pendingWriteCount,
      blockedCount,
      confirmedCount,
      isComplete: checkpoints.length > 0 && blockedCount === 0 && pendingWriteCount === 0 && checkpoints.every((checkpoint) => checkpoint.isConfirmed || checkpoint.isExecuted),
    };
  }).filter((domain) => domain.totalCount > 0 || activeDomainIds.includes(domain.domainId));
  const active = domains.filter((domain) => activeDomainIds.includes(domain.domainId) || domain.totalCount > 0);
  const affected = active.filter((domain) => domain.pendingWriteCount > 0);
  const membership = currentMembership(members, onboardingState);
  const projectId = resolveProjectId(runtimeState, project, appState, onboardingState);
  return {
    projectId,
    clientCompanyName: resolveCompanyName(runtimeState, project, appState) || projectId || EM_DASH,
    projectLeadDisplay: resolveProjectLeadDisplay(members, membership, onboardingState),
    url: onboardingState?.connection?.url || EM_DASH,
    database: onboardingState?.connection?.database || EM_DASH,
    generatedAt,
    generatedLabel: formatTimestamp(generatedAt),
    isProjectLead: membership?.role === "project_lead",
    currentMembership: membership,
    activeDomains: active,
    affectedDomains: affected,
    pendingWriteCount: active.reduce((total, domain) => total + domain.pendingWriteCount, 0),
    blockedCheckpointCount: active.reduce((total, domain) => total + domain.blockedCount, 0),
    confirmedCheckpointCount: active.reduce((total, domain) => total + domain.confirmedCount, 0),
    totalModulesActive: active.length,
    completeDomainCount: active.filter((domain) => domain.isComplete).length,
    inProgressDomainCount: Math.max(active.length - active.filter((domain) => domain.isComplete).length, 0),
  };
}

function summaryPanel(report) {
  return el("aside", { style: `${CARD} padding: 20px; display: flex; flex-direction: column; gap: 16px; flex: 0 0 320px; min-width: 280px;`, dataset: { testid: "pre-commit-summary" } }, [
    el("div", { style: "font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; font-weight: 700;", text: "Summary" }),
    el("div", { style: "display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;" }, [
      stat("Total modules active", String(report.totalModulesActive)),
      stat("Confirmed checkpoints", String(report.confirmedCheckpointCount)),
      stat("Pending writes", String(report.pendingWriteCount)),
      stat("Blocked checkpoints", String(report.blockedCheckpointCount)),
    ]),
    el("div", { style: "display: flex; flex-direction: column; gap: 6px; padding-top: 12px; border-top: 1px solid #e2e8f0;" }, [
      el("div", { style: "font-size: 13px; color: #6b7280;", text: "Domains complete vs in progress" }),
      el("div", { style: "font-size: 16px; font-weight: 700; color: #0c1a30;", text: `${report.completeDomainCount} complete / ${report.inProgressDomainCount} in progress` }),
    ]),
  ]);
}

function stat(label, value) {
  return el("div", { style: "padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; display: flex; flex-direction: column; gap: 4px;" }, [
    el("span", { style: "font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 700;", text: label }),
    el("span", { style: "font-size: 18px; font-weight: 700; color: #0c1a30;", text: value }),
  ]);
}

function checkpointCard(checkpoint) {
  return el("article", { style: `${CARD} border-left: 3px solid ${checkpoint.borderColor}; padding: 18px 18px 18px 16px; display: flex; flex-direction: column; gap: 12px;`, dataset: { testid: `pre-commit-card-${checkpoint.checkpointId}` } }, [
    el("div", { style: "display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap;" }, [
      el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
        el("div", { style: `font-size: 15px; font-weight: 700; color: ${NAVY};`, text: checkpoint.title || EM_DASH }),
        el("div", { style: "font-size: 13px; color: #6b7280;", text: `Operation ${checkpoint.operation}  Model ${checkpoint.model}  Field ${checkpoint.field}` }),
      ]),
      badge(checkpoint.safetyClass),
    ]),
    el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 16px;" }, [
      detail("Current value", EM_DASH),
      detail("Intended value", checkpoint.intendedValue),
      detail("Approved by", checkpoint.approvedBy, checkpoint.approvedBy === "Awaiting confirmation"),
      checkpoint.approvedAt ? detail("Approved at", checkpoint.approvedAt) : null,
    ]),
    checkpoint.blockerReason ? el("div", { style: "font-size: 13px; color: #dc2626;", text: checkpoint.blockerReason }) : null,
  ]);
}

function domainSection(domain) {
  return el("section", { style: "display: flex; flex-direction: column; gap: 14px;", dataset: { testid: `pre-commit-domain-${domain.domainId}` } }, [
    el("div", { style: "display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; border-bottom: 2px solid #f59e0b;" }, [
      el("div", { style: `font-size: 13px; font-weight: 800; color: ${NAVY}; letter-spacing: 0.14em; text-transform: uppercase;`, text: domain.domainLabel }),
      el("div", { style: "font-size: 13px; color: #6b7280;", text: `${domain.confirmedCount} of ${domain.totalCount} checkpoints confirmed  ${domain.pendingWriteCount} pending writes` }),
    ]),
    ...(domain.checkpoints.length ? domain.checkpoints.map((checkpoint) => checkpointCard(checkpoint)) : [el("div", { style: `${CARD} padding: 16px; font-size: 14px; color: #6b7280;`, text: "No checkpoints available for this module." })]),
  ]);
}

async function executePendingWrites(projectId) {
  let loops = 0;
  while (loops < 500) {
    const runtimeState = pipelineStore.getState().runtime_state;
    const pending = approvals(runtimeState);
    if (!pending.length) return;
    const approval = pending[0];
    const preview = previewForApproval(approval, runtimeState);
    if (!preview) throw new Error("No preview record found - cannot execute without a resolved operation.");
    if (!preview.target_model || !preview.target_operation) throw new Error("Preview missing target_model or target_operation - cannot execute.");
    await pipelineStore.applyGoverned({
      approval_id: approval.approval_id,
      runtime_state: runtimeState,
      operation: { model: preview.target_model, method: preview.target_operation, values: preview.intended_changes ?? {} },
      connection_context: { project_id: projectId },
    });
    if (pipelineStore.getState().status === "failure") throw new Error(pipelineStore.getState().error || "Commit failed.");
    await triggerRefresh({
      psState: pipelineStore.getState(),
      obState: onboardingStore.getState(),
      onRun: (payload) => pipelineStore.runPipeline(payload),
      onLoad: (nextProjectId) => pipelineStore.loadPipelineState(nextProjectId),
    });
    if (pipelineStore.getState().status === "failure") throw new Error(pipelineStore.getState().error || "Pipeline refresh failed.");
    loops += 1;
  }
  throw new Error("Commit stopped because the pipeline did not settle.");
}

function fireAudit(token, report) {
  if (!token || typeof fetch !== "function") return;
  void fetch("/api/audit/write", {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify({
      projectId: report.projectId,
      actorName: report.currentMembership?.full_name || onboardingStore.getState()?.user?.full_name || onboardingStore.getState()?.user?.email || "",
      actorRole: report.currentMembership?.role || "",
      action: "commit_approved",
      details: { moduleCount: report.affectedDomains.length, writeCount: report.pendingWriteCount },
    }),
  }).catch(() => {});
}

export function renderPreCommitReportView({ project, onNavigate } = {}) {
  const generatedAt = new Date().toISOString();
  const container = el("section", {
    style: "max-width: 1320px; margin: 0 auto; padding: 24px 32px 40px; font-family: Inter, sans-serif; display: flex; flex-direction: column; gap: 24px;",
    dataset: { testid: "pre-commit-report-view" },
  });
  const contentEl = el("div");
  const modalHost = el("div");
  const state = { loadingTeam: false, teamError: "", members: [], modalOpen: false, confirmValue: "", committing: false, commitError: "" };
  let latestLoadId = 0;
  container.append(contentEl, modalHost);

  const navigate = (view) => {
    if (onNavigate) onNavigate(view);
    else setCurrentView(view);
  };

  const viewState = () => {
    const appState = getState();
    const onboardingState = onboardingStore.getState();
    const runtimeState = pipelineStore.getState().runtime_state;
    return {
      onboardingState,
      runtimeState,
      report: buildReportModel({ runtimeState, members: state.members, onboardingState, project, appState, generatedAt }),
    };
  };

  async function loadMembers() {
    const { onboardingState, report } = viewState();
    if (!report.projectId) {
      state.teamError = "Team membership is unavailable until this project has an ID.";
      render();
      return;
    }
    const hasUserIdentity = Boolean(onboardingState?.user?.id || String(onboardingState?.user?.email || "").trim());
    if (!hasUserIdentity) {
      render();
      return;
    }
    const requestId = ++latestLoadId;
    state.loadingTeam = true;
    state.teamError = "";
    render();
    try {
      const payload = await requestTeamJson(`/api/team/${encodeURIComponent(report.projectId)}`, {
        method: "GET",
        headers: headers(onboardingState?.sessionToken || null, false),
      });
      if (requestId !== latestLoadId) return;
      state.members = Array.isArray(payload.members) ? payload.members : [];
      state.teamError = "";
    } catch (error) {
      if (requestId !== latestLoadId) return;
      state.teamError = error instanceof Error ? error.message : "Failed to load team members.";
    } finally {
      if (requestId === latestLoadId) {
        state.loadingTeam = false;
        render();
      }
    }
  }

  function topBar(report) {
    return el("div", { style: `position: sticky; top: 0; z-index: 20; ${CARD} padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;`, dataset: { testid: "pre-commit-top-bar" } }, [
      el("button", { type: "button", style: `${SECONDARY} display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px;`, onClick: () => navigate("pipeline"), dataset: { testid: "pre-commit-back-button" } }, [
        icon("ArrowLeft", 16),
        el("span", { text: "Back" }),
      ]),
      el("div", { style: "flex: 1 1 360px; display: flex; flex-direction: column; gap: 4px; min-width: 260px;" }, [
        el("h1", { style: "margin: 0; font-size: 24px; font-weight: 700; color: #0c1a30; font-family: Inter, sans-serif;", text: "Pre-Commit Implementation Report" }),
        el("div", { style: "font-size: 13px; color: #6b7280;", text: `Generated ${report.generatedLabel || EM_DASH}  ${report.url}  ${report.database}` }),
      ]),
      el("div", { style: "display: flex; align-items: center; gap: 10px; flex-wrap: wrap;" }, [
        el("button", { type: "button", style: `${SECONDARY} display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px;`, onClick: () => exportPdf(report), dataset: { testid: "pre-commit-export-button" } }, [
          icon("Download", 16),
          el("span", { text: "Export as PDF" }),
        ]),
        report.isProjectLead ? el("button", { type: "button", style: `${PRIMARY} display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px;`, onClick: () => { state.modalOpen = true; state.confirmValue = ""; state.commitError = ""; render(); }, dataset: { testid: "pre-commit-commit-button" } }, [
          icon("ShieldCheck", 16),
          el("span", { text: "Commit to Odoo" }),
        ]) : null,
      ]),
    ]);
  }

  function modal(report) {
    return el("div", { style: "position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 100;" }, [
      el("div", { style: "width: 100%; max-width: 480px; background: #ffffff; border-radius: 10px; padding: 32px; box-shadow: 0 24px 48px rgba(12,26,48,0.18); display: flex; flex-direction: column; gap: 18px; font-family: Inter, sans-serif;" }, [
        el("h2", { style: "margin: 0; font-size: 18px; font-weight: 700; color: #0c1a30;", text: "Commit to Odoo" }),
        el("p", { style: "margin: 0; font-size: 14px; color: #374151; line-height: 1.5;", text: `You are about to write ${report.pendingWriteCount} changes across ${report.affectedDomains.length} modules to ${report.database} on ${report.url}.` }),
        el("div", { style: `${CARD} padding: 14px; display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow: auto;` }, report.activeDomains.map((domain) => (
          el("div", { style: "display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; color: #0c1a30;" }, [
            el("span", { text: domain.domainLabel }),
            el("span", { style: "color: #6b7280;", text: `${domain.pendingWriteCount} pending` }),
          ])
        ))),
        el("label", { style: "display: flex; flex-direction: column; gap: 8px;" }, [
          el("span", { style: "font-size: 13px; font-weight: 600; color: #0c1a30;", text: "This action cannot be undone." }),
          el("input", { type: "text", value: state.confirmValue, placeholder: "Type COMMIT to confirm", style: "width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 14px; color: #111827; font-family: Inter, sans-serif; box-sizing: border-box;", onInput: (event) => { state.confirmValue = event.target.value; render(); }, dataset: { testid: "pre-commit-confirm-input" } }),
        ]),
        state.commitError ? el("div", { style: "font-size: 13px; color: #dc2626;", text: state.commitError }) : null,
        el("div", { style: "display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;" }, [
          el("button", { type: "button", style: `${SECONDARY} padding: 10px 16px;`, onClick: () => { state.modalOpen = false; state.confirmValue = ""; state.committing = false; state.commitError = ""; render(); }, disabled: state.committing }, [
            el("span", { text: "Cancel" }),
          ]),
          el("button", { type: "button", style: `${PRIMARY} padding: 10px 16px;${state.committing ? " opacity: 0.8; cursor: wait;" : ""}`, disabled: state.confirmValue !== "COMMIT" || state.committing, onClick: async () => {
            if (state.confirmValue !== "COMMIT" || state.committing) return;
            const { onboardingState, report: liveReport } = viewState();
            if (!liveReport.projectId) {
              state.commitError = "Project ID is unavailable.";
              render();
              return;
            }
            state.committing = true;
            state.commitError = "";
            render();
            try {
              await executePendingWrites(liveReport.projectId);
              fireAudit(onboardingState?.sessionToken || null, liveReport);
              state.modalOpen = false;
              state.confirmValue = "";
              state.committing = false;
              state.commitError = "";
              navigate("pipeline");
              showToast("Changes committed to Odoo");
            } catch (error) {
              state.committing = false;
              state.commitError = error instanceof Error ? error.message : "Commit failed.";
              render();
            }
          }, dataset: { testid: "pre-commit-confirm-button" } }, [
            el("span", { text: state.committing ? "Committing..." : "Confirm Commit" }),
          ]),
        ]),
      ]),
    ]);
  }

  function renderContent() {
    const { runtimeState, report } = viewState();
    if (!runtimeState) {
      return el("div", { style: `${CARD} padding: 24px; color: #6b7280;` }, [
        el("div", { style: "font-size: 16px; font-weight: 600; color: #0c1a30; margin-bottom: 8px;", text: "No pipeline state available" }),
        el("div", { style: "font-size: 14px;", text: "Run or load the implementation pipeline before opening this report." }),
      ]);
    }
    const isNarrow = typeof window !== "undefined" ? window.innerWidth < 1120 : false;
    const reportBody = el("div", { style: "display: flex; flex-direction: column; gap: 24px; flex: 1 1 720px; min-width: 320px;" }, report.activeDomains.length ? report.activeDomains.map((domain) => domainSection(domain)) : [
      el("div", { style: `${CARD} padding: 20px; font-size: 14px; color: #6b7280;`, text: "No active modules are available for review." }),
    ]);
    const summary = summaryPanel(report);
    return el("div", { style: "display: flex; flex-direction: column; gap: 24px;" }, [
      topBar(report),
      state.teamError ? el("div", { style: "background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 14px 16px; color: #b91c1c; font-size: 14px;", text: state.teamError }) : null,
      el("div", { style: "display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap;" }, isNarrow ? [summary, reportBody] : [reportBody, summary]),
    ]);
  }

  function render() {
    clearNode(contentEl);
    clearNode(modalHost);
    contentEl.append(renderContent());
    if (state.modalOpen) modalHost.append(modal(viewState().report));
  }

  render();
  queueMicrotask(() => { void loadMembers(); });
  return container;
}
