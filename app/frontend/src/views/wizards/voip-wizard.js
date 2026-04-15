import { createGovernedWizardView } from "./shared.js";

export function renderVoipWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "voip-setup",
    domainId: "voip",
    title: "VoIP Setup",
    subtitleDomain: "VoIP calling",
    onCancel,
    fields: [
      {
        name: "sip_provider",
        label: "SIP provider",
        type: "select",
        required: true,
        options: [
          { value: "axivox", label: "Axivox (native integration)" },
          { value: "onsip", label: "OnSIP" },
          { value: "other_sip", label: "Other SIP provider (generic config)" },
        ],
      },
      {
        name: "websocket_server",
        label: "WebSocket server address",
        type: "text",
        required: true,
        placeholder: "e.g. wss://pbx.axivox.com:443/ws",
      },
      {
        name: "sip_domain",
        label: "SIP domain",
        type: "text",
        required: true,
        placeholder: "company.pbx.example.com",
      },
      {
        name: "recording_policy",
        label: "Call recording policy",
        type: "select",
        required: true,
        options: [
          { value: "no_recording", label: "No recording" },
          { value: "consented_only", label: "Recording with customer consent only" },
          { value: "all_calls", label: "Record all calls (subject to local law)" },
        ],
        helpText: "Recording calls without consent creates regulatory exposure.",
      },
      {
        name: "enterprise_instance_confirmed",
        label: "Enterprise instance confirmed",
        type: "checkbox",
        checkboxLabel: "VoIP is Enterprise-only — this instance is Enterprise",
      },
      {
        name: "pilot_user_name",
        label: "Pilot user (first to test)",
        type: "text",
        required: true,
        placeholder: "Jane Smith",
      },
    ],
    getCapture(values) {
      return {
        sip_provider: values.sip_provider,
        websocket_server: values.websocket_server,
        sip_domain: values.sip_domain,
        recording_policy: values.recording_policy,
        enterprise_instance_confirmed: values.enterprise_instance_confirmed,
        pilot_user_name: values.pilot_user_name,
      };
    },
  });
}
