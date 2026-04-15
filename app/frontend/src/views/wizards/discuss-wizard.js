import { createGovernedWizardView } from "./shared.js";

export function renderDiscussWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "discuss-setup",
    domainId: "discuss",
    title: "Discuss Setup",
    subtitleDomain: "discuss messaging",
    onCancel,
    fields: [
      {
        name: "default_channels",
        label: "Initial channel names",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. general",
        addLabel: "Add channel",
        helpText: "Appoint owners per channel before the list self-organises into noise.",
      },
      {
        name: "default_channel_visibility",
        label: "Default channel visibility",
        type: "select",
        required: true,
        options: [
          { value: "public", label: "Public (all employees)" },
          { value: "private", label: "Private (invited only)" },
        ],
      },
      {
        name: "notification_default",
        label: "Company-wide notification default",
        type: "select",
        required: true,
        options: [
          { value: "all_messages", label: "All messages" },
          { value: "mentions_only", label: "Mentions only" },
        ],
      },
      {
        name: "use_video_calls",
        label: "Use Odoo video / voice calls",
        type: "checkbox",
        checkboxLabel: "Use Discuss for calls rather than an external tool",
      },
    ],
    getCapture(values) {
      return {
        default_channels: values.default_channels,
        default_channel_visibility: values.default_channel_visibility,
        notification_default: values.notification_default,
        use_video_calls: values.use_video_calls,
      };
    },
  });
}
