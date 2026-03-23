import { getProjectStoreRecordId, getProjectStoreRecordLabel, PRODUCT_NAME } from "/shared/index.js";
import { el } from "../lib/dom.js";

const NAV_ITEMS = [
  ["dashboard", "Dashboard"],
  ["stages", "Stages"],
  ["domains", "Domains"],
  ["decisions", "Decisions & Readiness"]
];

export function renderLayoutShell({ project, content, notifications, onNavigate, onSave, onResume }) {
  const savedProjects = (project.savedProjects || []).filter((item) => getProjectStoreRecordId(item));
  const canOpenGovernedViews = savedProjects.some(
    (item) => getProjectStoreRecordId(item) === project.projectIdentity.projectId
  );
  const navigation = el(
    "nav",
    { className: "sidebar-nav" },
    NAV_ITEMS.map(([id, label]) =>
      el(
        "button",
        {
          className: `sidebar-nav__item ${project.workflowState.currentView === id ? "sidebar-nav__item--active" : ""}`,
          onclick: () => onNavigate(id),
          disabled: id !== "dashboard" && !canOpenGovernedViews ? "disabled" : null
        },
        [label]
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
    el("aside", { className: "sidebar" }, [
      el("h1", { text: PRODUCT_NAME }),
      el("p", {
        text:
          "Implementation control only. This shell does not perform remediation, migration repair, diagnostics, or unrestricted writes."
      }),
      navigation,
      el("div", { className: "sidebar__actions" }, [
        el("button", { className: "button button--primary", onclick: onSave, text: "Save Project" }),
        resumeSelect
      ]),
      el("section", { className: "sidebar__meta" }, [
        el("h3", { text: "Current target" }),
        el("p", { text: `${project.projectIdentity.version} / ${project.projectIdentity.edition} / ${project.projectIdentity.deployment}` }),
        el("p", { text: `${project.projectIdentity.projectMode}` })
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
