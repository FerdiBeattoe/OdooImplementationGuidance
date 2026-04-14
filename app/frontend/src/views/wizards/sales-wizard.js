import { COMMON_CURRENCY_OPTIONS, createGovernedWizardView } from "./shared.js";

export function renderSalesWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "sales-setup",
    domainId: "sales",
    title: "Sales Setup",
    subtitleDomain: "sales",
    onCancel,
    fields: [
      {
        name: "pricelist_name",
        label: "Default pricelist name",
        type: "text",
        required: true,
        placeholder: "Standard Sales Pricelist",
      },
      {
        name: "currency_id",
        label: "Currency",
        type: "select",
        required: true,
        options: COMMON_CURRENCY_OPTIONS,
      },
      {
        name: "active",
        label: "Whether pricelists are active",
        type: "checkbox",
        checkboxLabel: "Enable pricelists in Sales",
        defaultValue: true,
      },
    ],
    getCapture(values) {
      return {
        pricelist_name: values.pricelist_name,
        currency_id: values.currency_id,
        active: values.active,
      };
    },
  });
}
