import { getProjectStoreRecordId, getProjectStoreRecordLabel, renderConnectionCapabilityLabel } from "/shared/index.js";
import { el } from "../lib/dom.js";

const NAV_ITEMS = [
  ["dashboard", "Project Overview", "See everything you've completed and what's next."],
  ["stages", "Setup Journey", "A step-by-step path to get your business ready."],
  ["domains", "Explore Areas", "Jump directly to specific areas like Sales or Finance."],
  ["decisions", "Ready to Go Live?", "Review everything before you start using Odoo for real."]
];

export function renderLayoutShell({ project, content, notifications, onNavigate, onSave, onResume }) {
  const savedProjects = (project.savedProjects || []).filter((item) => getProjectStoreRecordId(item));
  const canOpenGovernedViews = savedProjects.some(
    (item) => getProjectStoreRecordId(item) === project.projectIdentity.projectId
  );
  const connectionLabel = renderConnectionCapabilityLabel(project.connectionState?.capabilityLevel || "manual-only");
  const connectionDetail = project.connectionState?.reason || "Application-layer connection only";
  const navigation = el(
    "nav",
    { className: "sidebar-nav" },
    NAV_ITEMS.map(([id, label, description]) =>
      el(
        "button",
        {
          className: `sidebar-nav__item ${project.workflowState.currentView === id ? "sidebar-nav__item--active" : ""}`,
          onclick: () => onNavigate(id),
          disabled: id !== "dashboard" && !canOpenGovernedViews ? "disabled" : null
        },
        [
          el("strong", { text: label }),
          el("span", { className: "sidebar-nav__meta", text: description })
        ]
      )
    )
  );

  const resumeSelect = el(
    "select",
    {
      onchange: (event) => {
        if (event.target.value) {
          onResume(event.target.value);
          event.target.value = "";
        }
      }
    },
    [
      el("option", { value: "", text: "Resume saved project..." }),
      ...savedProjects.map((item) =>
        el("option", { value: getProjectStoreRecordId(item), text: getProjectStoreRecordLabel(item) })
      )
    ]
  );

  return el("div", { className: "app-shell" }, [
    el("aside", { className: "sidebar", "aria-label": "Main navigation" }, [
      el("section", { className: "sidebar__brand" }, [
        el("p", { className: "sidebar__eyebrow", text: "Odoo 19" }),
        el("h1", { text: "Your Setup Guide" }),
        el("p", {
          className: "sidebar__intro",
          text: "We'll walk you through exactly what you need to configure in Odoo 19. No technical knowledge required."
        })
      ]),
      el("section", { className: "sidebar-card", "aria-label": "Menu" }, [
        navigation
      ]),
      el("section", { className: "sidebar-card" }, [
        el("h3", { text: "Connection truth" }),
        el("p", { className: "sidebar-card__note", text: connectionLabel }),
        el("p", { className: "sidebar-card__note", text: connectionDetail })
      ]),
      el("section", { className: "sidebar-card" }, [
        el("h3", { text: "Save your progress" }),
        el("p", {
          className: "sidebar-card__note",
          text: "Your choices are saved locally. You can securely leave and pick up exactly where you left off later."
        }),
        el("div", { className: "sidebar__actions" }, [
          el("button", { className: "button button--primary", onclick: onSave, text: "Save my progress" }),
          resumeSelect
        ])
      ])
    ]),
    el("main", { className: "content" }, [
      notifications.length
        ? el(
            "section",
            { className: "notifications" },
            notifications.map((item) =>
              el("p", { className: `notification notification--${item.tone}`, text: item.message })
            )
          )
        : null,
      content
    ])
  ]);
}

function sidebarPill(label, value) {
  return el("span", { className: "sidebar-pill" }, [`${label}: ${value}`]);
}
