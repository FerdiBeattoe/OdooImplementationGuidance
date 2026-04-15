import { createGovernedWizardView } from "./shared.js";

export function renderLiveChatWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "live-chat-setup",
    domainId: "live-chat",
    title: "Live Chat Setup",
    subtitleDomain: "live chat",
    onCancel,
    fields: [
      {
        name: "channel_name",
        label: "Live chat channel name",
        type: "text",
        required: true,
        placeholder: "Website support",
      },
      {
        name: "operators",
        label: "Operator user names",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 20,
        placeholder: "e.g. Jane Smith",
        addLabel: "Add operator",
      },
      {
        name: "coverage_hours",
        label: "Operator coverage hours",
        type: "text",
        required: true,
        placeholder: "Mon–Fri 08:00–17:00",
      },
      {
        name: "fallback_mode",
        label: "Out-of-hours fallback",
        type: "select",
        required: true,
        options: [
          { value: "chatbot", label: "Chatbot qualifier" },
          { value: "offline_form", label: "Offline form" },
          { value: "hide_widget", label: "Hide widget out of hours" },
        ],
      },
      {
        name: "convert_to_ticket",
        label: "Convert escalations to Helpdesk tickets",
        type: "checkbox",
        checkboxLabel: "Auto-open a ticket when an operator escalates a chat",
      },
      {
        name: "widget_page_rule",
        label: "Pages to show the widget on",
        type: "text",
        required: true,
        placeholder: "e.g. /pricing, /contact",
      },
    ],
    getCapture(values) {
      return {
        channel_name: values.channel_name,
        operators: values.operators,
        coverage_hours: values.coverage_hours,
        fallback_mode: values.fallback_mode,
        convert_to_ticket: values.convert_to_ticket,
        widget_page_rule: values.widget_page_rule,
      };
    },
  });
}
