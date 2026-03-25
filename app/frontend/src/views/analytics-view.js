import { el } from "../lib/dom.js";
import { getImplementationState, getActivityLog, getSyncHistory } from "../state/implementationStore.js";

export function renderAnalyticsView({ project }) {
  const implState = getImplementationState();
  const activityLog = getActivityLog();
  const syncHistory = getSyncHistory();

  // ── Compute metrics ───────────────────────────────────────
  const wizardData = implState.wizardData || {};
  const roadmapSteps = implState.roadmapSteps || {};
  const importedData = implState.importedData || {};

  const completedWizards = Object.values(wizardData).filter(Boolean).length;
  const totalWizards = 12;
  const completedSteps = Object.values(roadmapSteps).filter(s => s === "complete").length;
  const inProgressSteps = Object.values(roadmapSteps).filter(s => s === "in-progress").length;
  const notStartedSteps = 30 - completedSteps - inProgressSteps;

  const importedCounts = {
    Products: (importedData.products || []).length,
    "Product Variants": (importedData.productVariants || []).length,
    Customers: (importedData.customers || []).length,
    Vendors: (importedData.vendors || []).length,
    "Bills of Materials": (importedData.billsOfMaterials || []).length,
    Employees: (importedData.employees || []).length,
    "Opening Balances": (importedData.openingBalances || []).length,
    "Sales Orders": (importedData.salesOrders || []).length
  };

  const isConnected = project?.connectionState?.status === "connected";
  const lastSync = syncHistory[0]?.timestamp || null;
  const apiErrors = activityLog.filter(e => e.type === "error").length;

  const container = el("div", { style: "max-width: 1000px; margin: 0 auto; padding: 32px; display: flex; flex-direction: column; gap: 24px;" });

  // ── Load Chart.js ─────────────────────────────────────────
  let chartJsLoaded = typeof Chart !== "undefined";
  if (!chartJsLoaded) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js";
    script.onload = () => {
      chartJsLoaded = true;
      renderCharts();
    };
    document.head.append(script);
  }

  function renderCharts() {
    if (typeof Chart === "undefined") return;

    // Chart 1: Progress Donut
    const donutCanvas = container.querySelector("#chart-donut");
    if (donutCanvas) {
      try {
        new Chart(donutCanvas, {
          type: "doughnut",
          data: {
            labels: ["Complete", "In Progress", "Not Started"],
            datasets: [{
              data: [completedSteps, inProgressSteps, notStartedSteps],
              backgroundColor: ["#13677b", "#57344f", "#e0e3e5"],
              borderWidth: 0
            }]
          },
          options: {
            cutout: "70%",
            plugins: { legend: { position: "bottom", labels: { usePointStyle: false, boxWidth: 8, padding: 16, font: { size: 11, family: "'Inter', sans-serif" } } } }
          }
        });
      } catch {}
    }

    // Chart 2: Module completion bar
    const barCanvas = container.querySelector("#chart-modules");
    if (barCanvas) {
      const WIZARD_KEYS = [
        { label: "Company", key: "companySetup" },
        { label: "Users", key: "usersAccess" },
        { label: "Accounts", key: "chartOfAccounts" },
        { label: "Sales", key: "salesConfig" },
        { label: "CRM", key: "crmConfig" },
        { label: "Inventory", key: "inventoryConfig" },
        { label: "Accounting", key: "accountingConfig" },
        { label: "Purchase", key: "purchaseConfig" },
        { label: "Mfg", key: "manufacturingConfig" },
        { label: "HR", key: "hrPayrollConfig" },
        { label: "Website", key: "websiteEcommerce" },
        { label: "POS", key: "posConfig" }
      ];
      try {
        new Chart(barCanvas, {
          type: "bar",
          data: {
            labels: WIZARD_KEYS.map(w => w.label),
            datasets: [{
              label: "Complete",
              data: WIZARD_KEYS.map(w => wizardData[w.key] ? 100 : 0),
              backgroundColor: "#13677b",
              borderRadius: 0
            }]
          },
          options: {
            scales: { y: { max: 100, title: { display: true, text: "% Complete" } } },
            plugins: { legend: { display: false } }
          }
        });
      } catch {}
    }

    // Chart 3: Data import stacked bar
    const importCanvas = container.querySelector("#chart-import");
    if (importCanvas) {
      try {
        new Chart(importCanvas, {
          type: "bar",
          data: {
            labels: Object.keys(importedCounts),
            datasets: [{
              label: "Imported",
              data: Object.values(importedCounts),
              backgroundColor: "#57344f",
              borderRadius: 0
            }]
          },
          options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      } catch {}
    }

    // Chart 4: Timeline line chart
    const timelineCanvas = container.querySelector("#chart-timeline");
    if (timelineCanvas) {
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7.push(d.toLocaleDateString([], { month: "short", day: "numeric" }));
      }
      try {
        new Chart(timelineCanvas, {
          type: "line",
          data: {
            labels: last7,
            datasets: [{
              label: "Cumulative Steps Complete",
              data: last7.map((_, i) => Math.min(completedSteps, i * Math.floor(completedSteps / 6))),
              borderColor: "#13677b",
              backgroundColor: "rgba(19, 103, 123, 0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 4
            }]
          },
          options: {
            plugins: { legend: { display: false } }
          }
        });
      } catch {}
    }
  }

  // Build layout
  container.append(
    // Header
    el("div", { style: "margin-bottom: 8px;" }, [
      el("p", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px;", text: "TRACKING" }),
      el("h2", { style: "font-family: var(--font-headline); font-size: 28px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug);", text: "Analytics & Success Tracking" })
    ]),

    // Charts row
    el("div", { style: "display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;" }, [
      // Donut
      el("div", { style: "background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 24px;" }, [
        el("h4", { style: "font-family: var(--font-headline); font-size: 14px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 16px; letter-spacing: var(--ls-snug);", text: "Implementation Progress" }),
        el("div", { style: "position: relative; height: 200px; display: flex; align-items: center; justify-content: center;" }, [
          el("canvas", { id: "chart-donut", style: "max-height: 180px;" }),
          el("div", { style: "position: absolute; display: flex; flex-direction: column; align-items: center;" }, [
            el("span", { style: "font-family: var(--font-headline); font-size: 32px; font-weight: 700; color: var(--color-on-surface);", text: `${completedSteps}` }),
            el("span", { style: "font-family: var(--font-label); font-size: 11px; color: var(--color-on-surface-variant); text-transform: uppercase; letter-spacing: var(--ls-wide);", text: "of 30 steps" })
          ])
        ])
      ]),
      // Module bar
      el("div", { style: "background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 24px;" }, [
        el("h4", { style: "font-family: var(--font-headline); font-size: 14px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 16px; letter-spacing: var(--ls-snug);", text: "Module Completion" }),
        el("canvas", { id: "chart-modules", style: "max-height: 200px;" })
      ]),
      // Import bar
      el("div", { style: "background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 24px;" }, [
        el("h4", { style: "font-family: var(--font-headline); font-size: 14px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 16px; letter-spacing: var(--ls-snug);", text: "Data Import Status" }),
        el("canvas", { id: "chart-import", style: "max-height: 200px;" })
      ]),
      // Timeline
      el("div", { style: "background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 24px;" }, [
        el("h4", { style: "font-family: var(--font-headline); font-size: 14px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 16px; letter-spacing: var(--ls-snug);", text: "Progress Over Time" }),
        el("canvas", { id: "chart-timeline", style: "max-height: 200px;" })
      ])
    ]),

    // System Health Panel
    el("div", { style: "background: var(--color-surface); box-shadow: var(--shadow-sm); overflow: hidden;" }, [
      el("div", { style: "padding: 16px 24px; background: var(--color-surface-container-low); border-bottom: 1px solid var(--color-surface-container-high);" }, [
        el("h4", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 700; color: var(--color-on-surface); text-transform: uppercase; letter-spacing: var(--ls-widest);", text: "SYSTEM HEALTH" })
      ]),
      el("div", {}, [
        healthRow("Odoo Connection",
          isConnected ? "Connected" : "Not connected",
          isConnected ? "success" : "error",
          isConnected ? `${project?.connectionState?.url || ""}` : "Connect in the sidebar"
        ),
        healthRow("Last Sync",
          lastSync ? new Date(lastSync).toLocaleString() : "Never",
          lastSync ? "success" : "warning",
          ""
        ),
        healthRow("API Errors (this session)",
          String(apiErrors),
          apiErrors === 0 ? "success" : "error",
          apiErrors > 0 ? "Check Activity Log for details" : ""
        ),
        healthRow("Wizard Progress",
          `${completedWizards} of ${totalWizards} complete`,
          completedWizards === totalWizards ? "success" : completedWizards > 0 ? "warning" : "neutral",
          ""
        )
      ])
    ])
  );

  // Trigger chart rendering after DOM is attached
  setTimeout(() => {
    if (typeof Chart !== "undefined") {
      renderCharts();
    }
  }, 100);

  return container;
}

function healthRow(label, value, status, detail) {
  const statusConfig = {
    success: { dot: "#059669", text: "#059669" },
    error:   { dot: "var(--color-error)", text: "var(--color-error)" },
    warning: { dot: "#9a6a13", text: "#9a6a13" },
    neutral: { dot: "var(--color-outline)", text: "var(--color-on-surface-variant)" }
  };
  const cfg = statusConfig[status] || statusConfig.neutral;

  return el("div", { style: "padding: 16px 24px; display: flex; align-items: flex-start; gap: 16px; border-bottom: 1px solid var(--color-surface-container-low);" }, [
    el("span", { style: `width: 8px; height: 8px; flex-shrink: 0; margin-top: 6px; background: ${cfg.dot};` }),
    el("div", { style: "flex: 1;" }, [
      el("div", { style: "display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;" }, [
        el("span", { style: "font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--color-on-surface);", text: label }),
        el("span", { style: `font-family: var(--font-label); font-size: 13px; font-weight: 600; color: ${cfg.text};`, text: value })
      ]),
      detail ? el("p", { style: "font-family: var(--font-body); font-size: 12px; color: var(--color-on-surface-variant); margin: 0;", text: detail }) : null
    ])
  ]);
}
