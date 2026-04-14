import { createGovernedWizardView } from "./shared.js";

export function renderMasterDataWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "master-data-setup",
    domainId: "master-data",
    title: "Master Data Setup",
    subtitleDomain: "master data",
    onCancel,
    fields: [
      {
        name: "customer_tag_names",
        label: "Customer tag names",
        type: "text",
        required: true,
        placeholder: "Retail, Wholesale, VIP",
        helpText: "Enter customer tags as a comma-separated list.",
      },
      {
        name: "product_category_name",
        label: "Product category name",
        type: "text",
        required: true,
        placeholder: "All Products",
      },
      {
        name: "uom_category_name",
        label: "Unit of measure category name",
        type: "text",
        required: true,
        placeholder: "Units",
      },
    ],
    getCapture(values) {
      return {
        customer_tag_names: values.customer_tag_names,
        product_category_name: values.product_category_name,
        uom_category_name: values.uom_category_name,
      };
    },
  });
}
