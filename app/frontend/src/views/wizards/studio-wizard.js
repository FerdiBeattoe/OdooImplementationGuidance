import { createGovernedWizardView } from "./shared.js";

export function renderStudioWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "studio-setup",
    domainId: "studio",
    title: "Studio Setup",
    subtitleDomain: "Odoo Studio",
    onCancel,
    fields: [
      {
        name: "authorized_admins",
        label: "Authorised Studio admins",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 8,
        placeholder: "e.g. Priya Patel",
        addLabel: "Add admin",
        helpText: "Only named admins may open Studio. Studio edits in live hit everyone.",
      },
      {
        name: "change_control_policy_published",
        label: "Change-control policy published",
        type: "checkbox",
        checkboxLabel: "Team has a written policy for requesting, testing and approving Studio changes",
      },
      {
        name: "staging_environment_exists",
        label: "Staging environment available",
        type: "checkbox",
        checkboxLabel: "A non-production Odoo environment exists for testing Studio changes first",
      },
      {
        name: "enterprise_instance_confirmed",
        label: "Enterprise instance confirmed",
        type: "checkbox",
        checkboxLabel: "Studio is Enterprise-only — this instance is Enterprise",
      },
      {
        name: "customization_export_cadence",
        label: "Customisation export cadence",
        type: "select",
        required: true,
        options: [
          { value: "after_every_change", label: "Export customisations after every change" },
          { value: "weekly", label: "Weekly export for backup" },
          { value: "monthly", label: "Monthly export for backup" },
        ],
        helpText: "Exported ZIPs are how Studio customisations survive a restore.",
      },
    ],
    getCapture(values) {
      return {
        authorized_admins: values.authorized_admins,
        change_control_policy_published: values.change_control_policy_published,
        staging_environment_exists: values.staging_environment_exists,
        enterprise_instance_confirmed: values.enterprise_instance_confirmed,
        customization_export_cadence: values.customization_export_cadence,
      };
    },
  });
}
