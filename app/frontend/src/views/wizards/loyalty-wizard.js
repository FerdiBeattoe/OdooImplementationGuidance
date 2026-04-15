import { createGovernedWizardView } from "./shared.js";

export function renderLoyaltyWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "loyalty-setup",
    domainId: "loyalty",
    title: "Loyalty Setup",
    subtitleDomain: "loyalty and gift cards",
    onCancel,
    fields: [
      {
        name: "program_type",
        label: "Program type",
        type: "select",
        required: true,
        options: [
          { value: "loyalty_points", label: "Loyalty points programme" },
          { value: "gift_cards", label: "Gift cards" },
          { value: "both", label: "Both loyalty and gift cards" },
          { value: "promotions_only", label: "Promotions / discounts only" },
        ],
      },
      {
        name: "points_earn_rate",
        label: "Points earned per currency unit spent",
        type: "number",
        required: true,
        min: "0",
        step: "0.01",
        placeholder: "1",
      },
      {
        name: "points_value",
        label: "Point redemption value (currency per point)",
        type: "number",
        required: true,
        min: "0",
        step: "0.0001",
        placeholder: "0.01",
      },
      {
        name: "expiry_months",
        label: "Points / gift card expiry (months)",
        type: "number",
        required: true,
        min: "0",
        step: "1",
        placeholder: "24",
      },
      {
        name: "liability_account_name",
        label: "Liability account name",
        type: "text",
        required: true,
        placeholder: "Loyalty Liability",
        helpText: "Unearned revenue / points liability account for finance tracking.",
      },
      {
        name: "pos_enabled",
        label: "Enable redemption at Point of Sale",
        type: "checkbox",
        checkboxLabel: "Train till operators and enable the POS loyalty feature",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.points_earn_rate))) {
        errors.points_earn_rate = "Earn rate must be a valid number.";
      }
      if (!Number.isFinite(Number(values.points_value))) {
        errors.points_value = "Point value must be a valid number.";
      }
      if (!Number.isFinite(Number(values.expiry_months))) {
        errors.expiry_months = "Expiry must be a valid number of months.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        program_type: values.program_type,
        points_earn_rate: values.points_earn_rate,
        points_value: values.points_value,
        expiry_months: values.expiry_months,
        liability_account_name: values.liability_account_name,
        pos_enabled: values.pos_enabled,
      };
    },
  });
}
