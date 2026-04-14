import { createGovernedWizardView } from "./shared.js";

export function renderPosWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "pos-setup",
    domainId: "pos",
    title: "POS Setup",
    subtitleDomain: "pos",
    onCancel,
    fields: [
      {
        name: "pos_name",
        label: "POS name",
        type: "text",
        required: true,
        placeholder: "Main Store POS",
      },
      {
        name: "accept_cash",
        label: "Accept cash",
        type: "checkbox",
        checkboxLabel: "Accept cash payments",
        defaultValue: true,
      },
      {
        name: "accept_card",
        label: "Accept card",
        type: "checkbox",
        checkboxLabel: "Accept card payments",
        defaultValue: true,
      },
    ],
    getCapture(values) {
      return {
        pos_name: values.pos_name,
        accept_cash: values.accept_cash,
        accept_card: values.accept_card,
      };
    },
  });
}
