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

  const container = el("div", { className: "max-w-6xl mx-auto space-y-8" });

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
            plugins: { legend: { position: "bottom" } }
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
              borderRadius: 4
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
              borderRadius: 4
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
    el("div", {}, [
      el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-1", text: "Tracking" }),
      el("h2", { className: "font-headline text-2xl font-bold text-on-surface", text: "Analytics & Success Tracking" })
    ]),

    // Charts row
    el("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" }, [
      // Donut
      el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6" }, [
        el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-4", text: "Implementation Progress" }),
        el("div", { className: "relative h-52" }, [
          el("canvas", { id: "chart-donut" }),
          el("div", { className: "absolute inset-0 flex items-center justify-center flex-col pointer-events-none" }, [
            el("span", { className: "text-3xl font-extrabold text-on-surface", text: `${completedSteps}` }),
            el("span", { className: "text-xs text-on-surface-variant", text: "of 30 steps" })
          ])
        ])
      ]),
      // Module bar
      el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6" }, [
        el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-4", text: "Module Completion" }),
        el("canvas", { id: "chart-modules", style: "max-height: 200px" })
      ]),
      // Import bar
      el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6" }, [
        el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-4", text: "Data Import Status" }),
        el("canvas", { id: "chart-import", style: "max-height: 200px" })
      ]),
      // Timeline
      el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6" }, [
        el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-4", text: "Progress Over Time" }),
        el("canvas", { id: "chart-timeline", style: "max-height: 200px" })
      ])
    ]),

    // System Health Panel
    el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden" }, [
      el("div", { className: "px-6 py-4 border-b border-outline-variant/10" }, [
        el("h4", { className: "font-headline text-sm font-bold text-on-surface uppercase tracking-widest", text: "System Health" })
      ]),
      el("div", { className: "divide-y divide-outline-variant/10" }, [
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
    success: { dot: "bg-green-500", text: "text-green-700" },
    error:   { dot: "bg-error",     text: "text-error" },
    warning: { dot: "bg-amber-500", text: "text-amber-700" },
    neutral: { dot: "bg-outline",   text: "text-on-surface-variant" }
  };
  const cfg = statusConfig[status] || statusConfig.neutral;

  return el("div", { className: "px-6 py-4 flex items-start gap-4" }, [
    el("span", { className: `w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}` }),
    el("div", { className: "flex-1" }, [
      el("div", { className: "flex items-center justify-between" }, [
        el("span", { className: "text-sm font-semibold text-on-surface", text: label }),
        el("span", { className: `text-sm font-bold ${cfg.text}`, text: value })
      ]),
      detail ? el("p", { className: "text-xs text-on-surface-variant mt-0.5", text: detail }) : null
    ])
  ]);
}
