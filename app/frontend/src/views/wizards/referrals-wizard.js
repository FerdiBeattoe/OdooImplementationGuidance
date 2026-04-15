import { createGovernedWizardView } from "./shared.js";

export function renderReferralsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "referrals-setup",
    domainId: "referrals",
    title: "Referrals Setup",
    subtitleDomain: "referrals",
    onCancel,
    fields: [
      {
        name: "reward_trigger_stage",
        label: "Reward trigger stage",
        type: "select",
        required: true,
        options: [
          { value: "offer_accepted", label: "Offer accepted" },
          { value: "hired", label: "Hired" },
          { value: "probation_complete", label: "Probation complete" },
        ],
        helpText: "Changing this later retroactively confuses payouts.",
      },
      {
        name: "reward_type",
        label: "Reward type",
        type: "select",
        required: true,
        options: [
          { value: "cash", label: "Cash" },
          { value: "vouchers", label: "Vouchers" },
          { value: "gifts", label: "Physical gifts" },
          { value: "points", label: "Gamified points" },
        ],
      },
      {
        name: "reward_amount",
        label: "Reward amount / value",
        type: "number",
        required: true,
        min: "0",
        step: "0.01",
        placeholder: "500",
      },
      {
        name: "reward_currency",
        label: "Reward currency (if cash)",
        type: "text",
        required: true,
        placeholder: "USD",
      },
      {
        name: "publicise_plan",
        label: "Publicise the programme internally",
        type: "checkbox",
        checkboxLabel: "Publish rules, rewards, and link-sharing process to all employees",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.reward_amount))) {
        errors.reward_amount = "Reward amount must be a valid number.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        reward_trigger_stage: values.reward_trigger_stage,
        reward_type: values.reward_type,
        reward_amount: values.reward_amount,
        reward_currency: values.reward_currency,
        publicise_plan: values.publicise_plan,
      };
    },
  });
}
