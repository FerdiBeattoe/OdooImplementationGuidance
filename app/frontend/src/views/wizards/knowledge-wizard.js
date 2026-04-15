import { createGovernedWizardView } from "./shared.js";

export function renderKnowledgeWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "knowledge-setup",
    domainId: "knowledge",
    title: "Knowledge Setup",
    subtitleDomain: "knowledge base",
    onCancel,
    fields: [
      {
        name: "top_level_workspaces",
        label: "Top-level workspaces",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. Operations",
        addLabel: "Add workspace",
        helpText: "Keep it to 5–10 workspaces max — re-organising hundreds of articles later is brutal.",
      },
      {
        name: "workspace_owner",
        label: "Default workspace owner",
        type: "text",
        required: true,
        placeholder: "Head of Operations",
      },
      {
        name: "default_access",
        label: "Default access rule",
        type: "select",
        required: true,
        options: [
          { value: "public", label: "Public (anyone)" },
          { value: "company", label: "Company-wide" },
          { value: "restricted", label: "Restricted (named users)" },
        ],
      },
      {
        name: "helpdesk_linkage",
        label: "Link articles into Helpdesk tickets",
        type: "checkbox",
        checkboxLabel: "Surface runbooks inside support ticket templates",
      },
      {
        name: "migrate_existing_wiki",
        label: "Migrate from existing wiki (Notion / Confluence)",
        type: "checkbox",
        checkboxLabel: "Plan a migration so both wikis don't linger half-full",
      },
    ],
    getCapture(values) {
      return {
        top_level_workspaces: values.top_level_workspaces,
        workspace_owner: values.workspace_owner,
        default_access: values.default_access,
        helpdesk_linkage: values.helpdesk_linkage,
        migrate_existing_wiki: values.migrate_existing_wiki,
      };
    },
  });
}
