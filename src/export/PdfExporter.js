const PDF_SECTIONS = {
  SUMMARY: "summary",
  CHECKPOINTS: "checkpoints",
  CONFIGURATION: "configuration",
  MODULES: "modules",
  TIMELINE: "timeline",
  AUDIT_LOG: "audit_log"
};

const PDF_STYLES = {
  fontFamily: "Helvetica, Arial, sans-serif",
  primaryColor: "#0d6b63",
  textColor: "#122023",
  mutedColor: "#5d6a6d",
  borderColor: "#d8d1c2",
  backgroundColor: "#ffffff",
  successColor: "#2d6a3c",
  warningColor: "#9a6a13",
  dangerColor: "#9f2d22"
};

export function createPdfExporter(options = {}) {
  const {
    onExportStart = () => {},
    onExportComplete = () => {},
    onExportError = () => {},
    defaultFilename = "odoo-implementation-report.pdf",
    companyLogo = null,
    includeTimestamp = true
  } = options;

  function generateConfigurationReport(config, options = {}) {
    const {
      title = "Odoo Implementation Configuration",
      subtitle = "Generated Configuration Report",
      sections = Object.values(PDF_SECTIONS),
      includeAuditLog = false
    } = options;

    onExportStart({ type: "configuration", config });

    try {
      const htmlContent = buildHtmlReport({
        title,
        subtitle,
        config,
        sections,
        includeAuditLog,
        timestamp: includeTimestamp ? new Date() : null
      });

      const blob = generatePdfBlob(htmlContent);
      const filename = generateFilename(config, defaultFilename);

      const result = {
        success: true,
        blob,
        filename,
        html: htmlContent,
        size: blob.size,
        timestamp: Date.now()
      };

      onExportComplete(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      onExportError(errorResult);
      return errorResult;
    }
  }

  function generateWizardSummary(wizardState, options = {}) {
    const {
      title = "Setup Wizard Summary",
      includeIncomplete = true
    } = options;

    onExportStart({ type: "wizard", state: wizardState });

    try {
      const htmlContent = buildWizardHtml({
        title,
        wizardState,
        includeIncomplete,
        timestamp: includeTimestamp ? new Date() : null
      });

      const blob = generatePdfBlob(htmlContent);
      const filename = generateFilename({ name: "wizard-summary" }, "wizard-summary.pdf");

      const result = {
        success: true,
        blob,
        filename,
        html: htmlContent,
        size: blob.size,
        timestamp: Date.now()
      };

      onExportComplete(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      onExportError(errorResult);
      return errorResult;
    }
  }

  function buildHtmlReport(options) {
    const { title, subtitle, config, sections, includeAuditLog, timestamp } = options;

    const parts = [
      buildHtmlHeader(title),
      buildReportStyles(),
      "<body>",
      buildReportHeader(title, subtitle, timestamp, companyLogo),
      buildReportSummary(config),
      sections.includes(PDF_SECTIONS.CHECKPOINTS) ? buildCheckpointsSection(config.checkpoints) : "",
      sections.includes(PDF_SECTIONS.CONFIGURATION) ? buildConfigurationSection(config.settings) : "",
      sections.includes(PDF_SECTIONS.MODULES) ? buildModulesSection(config.modules) : "",
      sections.includes(PDF_SECTIONS.TIMELINE) ? buildTimelineSection(config.timeline) : "",
      includeAuditLog && sections.includes(PDF_SECTIONS.AUDIT_LOG) ? buildAuditLogSection(config.auditLog) : "",
      buildReportFooter(),
      "</body></html>"
    ];

    return parts.join("\n");
  }

  function buildWizardHtml(options) {
    const { title, wizardState, includeIncomplete, timestamp } = options;

    const parts = [
      buildHtmlHeader(title),
      buildReportStyles(),
      "<body>",
      buildReportHeader(title, "Wizard Completion Report", timestamp, companyLogo),
      buildWizardSummary(wizardState),
      buildWizardSteps(wizardState, includeIncomplete),
      buildWizardConfiguration(wizardState),
      buildReportFooter(),
      "</body></html>"
    ];

    return parts.join("\n");
  }

  function buildHtmlHeader(title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>`;
  }

  function buildReportStyles() {
    return `<style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: ${PDF_STYLES.fontFamily};
        font-size: 11pt;
        line-height: 1.6;
        color: ${PDF_STYLES.textColor};
        background: ${PDF_STYLES.backgroundColor};
        padding: 40px;
      }
      .report-header {
        border-bottom: 3px solid ${PDF_STYLES.primaryColor};
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .report-header h1 {
        font-size: 24pt;
        color: ${PDF_STYLES.primaryColor};
        margin-bottom: 8px;
      }
      .report-header .subtitle {
        font-size: 12pt;
        color: ${PDF_STYLES.mutedColor};
      }
      .report-header .timestamp {
        font-size: 10pt;
        color: ${PDF_STYLES.mutedColor};
        margin-top: 8px;
      }
      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .section h2 {
        font-size: 16pt;
        color: ${PDF_STYLES.primaryColor};
        border-bottom: 1px solid ${PDF_STYLES.borderColor};
        padding-bottom: 8px;
        margin-bottom: 15px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }
      .summary-card {
        background: #f8f6f0;
        border: 1px solid ${PDF_STYLES.borderColor};
        border-radius: 8px;
        padding: 15px;
      }
      .summary-card .label {
        font-size: 9pt;
        color: ${PDF_STYLES.mutedColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .summary-card .value {
        font-size: 14pt;
        font-weight: 600;
        color: ${PDF_STYLES.textColor};
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      th, td {
        text-align: left;
        padding: 10px 12px;
        border-bottom: 1px solid ${PDF_STYLES.borderColor};
      }
      th {
        background: #f8f6f0;
        font-weight: 600;
        font-size: 10pt;
        color: ${PDF_STYLES.textColor};
      }
      td {
        font-size: 10pt;
      }
      .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 9pt;
        font-weight: 500;
      }
      .status-pass {
        background: rgba(45, 106, 60, 0.1);
        color: ${PDF_STYLES.successColor};
      }
      .status-fail {
        background: rgba(159, 45, 34, 0.1);
        color: ${PDF_STYLES.dangerColor};
      }
      .status-pending {
        background: rgba(154, 106, 19, 0.1);
        color: ${PDF_STYLES.warningColor};
      }
      .config-item {
        margin-bottom: 12px;
        padding: 12px;
        background: #f8f6f0;
        border-radius: 6px;
      }
      .config-item .key {
        font-weight: 600;
        color: ${PDF_STYLES.textColor};
        font-size: 10pt;
      }
      .config-item .value {
        color: ${PDF_STYLES.mutedColor};
        font-size: 10pt;
        margin-top: 2px;
      }
      .timeline-item {
        display: flex;
        gap: 15px;
        padding: 12px 0;
        border-bottom: 1px solid ${PDF_STYLES.borderColor};
      }
      .timeline-item .date {
        min-width: 100px;
        font-size: 10pt;
        color: ${PDF_STYLES.mutedColor};
      }
      .timeline-item .event {
        flex: 1;
      }
      .timeline-item .event-title {
        font-weight: 600;
        font-size: 10pt;
      }
      .timeline-item .event-desc {
        font-size: 9pt;
        color: ${PDF_STYLES.mutedColor};
        margin-top: 2px;
      }
      .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid ${PDF_STYLES.borderColor};
        font-size: 9pt;
        color: ${PDF_STYLES.mutedColor};
        text-align: center;
      }
      @media print {
        body { padding: 20px; }
        .section { page-break-inside: avoid; }
      }
    </style>`;
  }

  function buildReportHeader(title, subtitle, timestamp, logo) {
    const logoHtml = logo ? `<img src="${logo}" class="logo" alt="Company Logo">` : "";
    const timestampHtml = timestamp
      ? `<div class="timestamp">Generated: ${timestamp.toLocaleString()}</div>`
      : "";

    return `<div class="report-header">
      ${logoHtml}
      <h1>${escapeHtml(title)}</h1>
      <div class="subtitle">${escapeHtml(subtitle)}</div>
      ${timestampHtml}
    </div>`;
  }

  function buildReportSummary(config) {
    const stats = calculateStats(config);

    return `<div class="section">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Total Checkpoints</div>
          <div class="value">${stats.totalCheckpoints}</div>
        </div>
        <div class="summary-card">
          <div class="label">Completed</div>
          <div class="value" style="color: ${PDF_STYLES.successColor}">${stats.completed}</div>
        </div>
        <div class="summary-card">
          <div class="label">Pending</div>
          <div class="value" style="color: ${PDF_STYLES.warningColor}">${stats.pending}</div>
        </div>
      </div>
      <p style="font-size: 10pt; color: ${PDF_STYLES.mutedColor}; margin-top: 15px;">
        <strong>Company:</strong> ${escapeHtml(config.company?.name || "Not configured")}<br>
        <strong>Odoo Version:</strong> ${escapeHtml(config.version?.name || "Unknown")}<br>
        <strong>Deployment:</strong> ${escapeHtml(config.deployment?.type || "Unknown")}
      </p>
    </div>`;
  }

  function buildCheckpointsSection(checkpoints = []) {
    const rows = checkpoints.map(cp => `
      <tr>
        <td>${escapeHtml(cp.title || cp.id)}</td>
        <td>${escapeHtml(cp.domain || "General")}</td>
        <td><span class="status-badge status-${cp.status?.toLowerCase() || "pending"}">${cp.status || "Pending"}</span></td>
        <td>${escapeHtml(cp.owner || "Unassigned")}</td>
      </tr>
    `).join("");

    return `<div class="section">
      <h2>Checkpoints Status</h2>
      <table>
        <thead>
          <tr>
            <th>Checkpoint</th>
            <th>Domain</th>
            <th>Status</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan=\"4\" style=\"text-align: center; color: #999;\">No checkpoints configured</td></tr>"}</tbody>
      </table>
    </div>`;
  }

  function buildConfigurationSection(settings = {}) {
    const items = Object.entries(settings).map(([key, value]) => `
      <div class="config-item">
        <div class="key">${escapeHtml(formatKey(key))}</div>
        <div class="value">${escapeHtml(formatValue(value))}</div>
      </div>
    `).join("");

    return `<div class="section">
      <h2>Configuration Settings</h2>
      ${items || "<p style=\"color: #999; font-style: italic;\">No configuration settings recorded</p>"}
    </div>`;
  }

  function buildModulesSection(modules = {}) {
    const installed = modules.installed || [];
    const rows = installed.map(m => `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.technicalName || "-")}</td>
        <td>${escapeHtml(m.category || "Uncategorized")}</td>
        <td><span class="status-badge status-pass">Installed</span></td>
      </tr>
    `).join("");

    return `<div class="section">
      <h2>Installed Modules</h2>
      <table>
        <thead>
          <tr>
            <th>Module Name</th>
            <th>Technical Name</th>
            <th>Category</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan=\"4\" style=\"text-align: center; color: #999;\">No modules recorded</td></tr>"}</tbody>
      </table>
    </div>`;
  }

  function buildTimelineSection(timeline = []) {
    const items = timeline.map(item => `
      <div class="timeline-item">
        <div class="date">${escapeHtml(formatDate(item.timestamp))}</div>
        <div class="event">
          <div class="event-title">${escapeHtml(item.title)}</div>
          <div class="event-desc">${escapeHtml(item.description || "")}</div>
        </div>
      </div>
    `).join("");

    return `<div class="section">
      <h2>Implementation Timeline</h2>
      ${items || "<p style=\"color: #999; font-style: italic;\">No timeline events recorded</p>"}
    </div>`;
  }

  function buildAuditLogSection(auditLog = []) {
    const rows = auditLog.slice(0, 50).map(entry => `
      <tr>
        <td>${escapeHtml(formatDate(entry.timestamp))}</td>
        <td>${escapeHtml(entry.action)}</td>
        <td>${escapeHtml(entry.target || "-")}</td>
        <td>${escapeHtml(entry.actor || "System")}</td>
      </tr>
    `).join("");

    return `<div class="section">
      <h2>Recent Audit Log</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Target</th>
            <th>Actor</th>
          </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan=\"4\" style=\"text-align: center; color: #999;\">No audit entries</td></tr>"}</tbody>
      </table>
      ${auditLog.length > 50 ? `<p style="font-size: 9pt; color: #999; margin-top: 10px;">Showing 50 of ${auditLog.length} entries</p>` : ""}
    </div>`;
  }

  function buildWizardSummary(wizardState) {
    const progress = wizardState.progress || {};

    return `<div class="section">
      <h2>Wizard Progress</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Total Steps</div>
          <div class="value">${progress.total || 0}</div>
        </div>
        <div class="summary-card">
          <div class="label">Completed</div>
          <div class="value" style="color: ${PDF_STYLES.successColor}">${progress.completed || 0}</div>
        </div>
        <div class="summary-card">
          <div class="label">Completion %</div>
          <div class="value">${progress.percent || 0}%</div>
        </div>
      </div>
    </div>`;
  }

  function buildWizardSteps(wizardState, includeIncomplete) {
    const steps = wizardState.steps || [];
    const visibleSteps = includeIncomplete ? steps : steps.filter(s => s.completed);

    const rows = visibleSteps.map((step, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(step.title)}</td>
        <td><span class="status-badge status-${step.completed ? "pass" : "pending"}">${step.completed ? "Complete" : "Pending"}</span></td>
        <td>${step.timestamp ? formatDate(step.timestamp) : "-"}</td>
      </tr>
    `).join("");

    return `<div class="section">
      <h2>Wizard Steps</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Step</th>
            <th>Status</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan=\"4\" style=\"text-align: center; color: #999;\">No steps recorded</td></tr>"}</tbody>
      </table>
    </div>`;
  }

  function buildWizardConfiguration(wizardState) {
    const data = wizardState.data || {};

    const items = Object.entries(data).map(([stepId, stepData]) => {
      const configItems = Object.entries(stepData).map(([key, value]) => `
        <div style="margin-left: 20px; padding: 8px; background: #f8f6f0; border-radius: 4px; margin-top: 5px;">
          <span style="font-weight: 600; font-size: 9pt;">${escapeHtml(formatKey(key))}:</span>
          <span style="font-size: 9pt; color: ${PDF_STYLES.mutedColor};">${escapeHtml(formatValue(value))}</span>
        </div>
      `).join("");

      return `<div class="config-item" style="margin-bottom: 15px;">
        <div class="key">${escapeHtml(formatKey(stepId))}</div>
        ${configItems}
      </div>`;
    }).join("");

    return `<div class="section">
      <h2>Configuration Data</h2>
      ${items || "<p style=\"color: #999; font-style: italic;\">No configuration data recorded</p>"}
    </div>`;
  }

  function buildReportFooter() {
    return `<div class="report-footer">
      <p>Generated by Odoo Implementation Platform</p>
      <p style="font-size: 8pt; margin-top: 5px;">This document is confidential and intended for authorized use only.</p>
    </div>`;
  }

  function generatePdfBlob(htmlContent) {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return blob;
  }

  function downloadPdf(result, filename = null) {
    if (!result.success || !result.blob) {
      throw new Error("Cannot download: export failed or no data available");
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || result.filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  }

  function generateFilename(config, defaultName) {
    const company = config?.company?.name || config?.name || "implementation";
    const date = new Date().toISOString().split("T")[0];
    const safeCompany = company.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    return `${safeCompany}_report_${date}.pdf`;
  }

  function calculateStats(config) {
    const checkpoints = config.checkpoints || [];
    const completed = checkpoints.filter(cp => cp.status === "Pass" || cp.status === "Complete").length;

    return {
      totalCheckpoints: checkpoints.length,
      completed,
      pending: checkpoints.length - completed,
      completionRate: checkpoints.length > 0 ? Math.round((completed / checkpoints.length) * 100) : 0
    };
  }

  function formatKey(key) {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, " ");
  }

  function formatValue(value) {
    if (value === null || value === undefined) return "Not set";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function formatDate(timestamp) {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  function fetchWithTimeout(url, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Request timeout")), 10000);
      fetch(url, options)
        .then(response => {
          clearTimeout(timeout);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  return {
    generateConfigurationReport,
    generateWizardSummary,
    downloadPdf,
    PDF_SECTIONS,
    PDF_STYLES
  };
}

export { PDF_SECTIONS, PDF_STYLES };
