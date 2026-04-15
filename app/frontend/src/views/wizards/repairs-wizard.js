import { createGovernedWizardView } from "./shared.js";

export function renderRepairsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "repairs-setup",
    domainId: "repairs",
    title: "Repairs Setup",
    subtitleDomain: "repairs",
    onCancel,
    fields: [
      {
        name: "repair_location_name",
        label: "Default repair location",
        type: "text",
        required: true,
        placeholder: "Workshop",
      },
      {
        name: "invoicing_policy",
        label: "Repair invoicing policy",
        type: "select",
        required: true,
        options: [
          { value: "after_repair", label: "Invoice after repair completes" },
          { value: "before_repair", label: "Invoice before parts are consumed" },
          { value: "warranty_only", label: "No invoice for warranty work" },
        ],
      },
      {
        name: "warranty_behavior",
        label: "Warranty behaviour",
        type: "select",
        required: true,
        options: [
          { value: "covered_in_warranty", label: "Covered: no customer charge" },
          { value: "charge_customer", label: "Always charge the customer" },
          { value: "case_by_case", label: "Case-by-case decision" },
        ],
      },
      {
        name: "consume_components_from_inventory",
        label: "Consume spare parts from Inventory",
        type: "checkbox",
        checkboxLabel: "Decrement stock when components are used on a repair order",
      },
      {
        name: "field_service_split_rule",
        label: "Field Service vs Repairs split",
        type: "select",
        required: true,
        options: [
          { value: "on_site_field_service", label: "On-site jobs → Field Service" },
          { value: "workshop_repairs", label: "Workshop jobs → Repairs only" },
          { value: "single_team_both_flows", label: "Same team handles both flows" },
          { value: "field_service_not_in_scope", label: "Field Service not in scope" },
        ],
      },
    ],
    getCapture(values) {
      return {
        repair_location_name: values.repair_location_name,
        invoicing_policy: values.invoicing_policy,
        warranty_behavior: values.warranty_behavior,
        consume_components_from_inventory: values.consume_components_from_inventory,
        field_service_split_rule: values.field_service_split_rule,
      };
    },
  });
}
