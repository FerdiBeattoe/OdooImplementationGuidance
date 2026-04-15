import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`voip-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const VOIP_OP_DEFS_VERSION = "1.2.0";
export const VOIP_TARGET_METHOD = "write";
// voip.provider and res.users are both in ALLOWED_APPLY_MODELS.
export const VOIP_COVERAGE_GAP_MODELS = Object.freeze([]);
export const VOIP_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-voip-provider-connection"]: Object.freeze({
    target_model: "voip.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-voip-extension-assignment"]: Object.freeze({
    target_model: "res.users",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-voip-call-logging"]: Object.freeze({
    target_model: "voip.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-voip-crm-integration"]: Object.freeze({
    target_model: "voip.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const VOIP_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(VOIP_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addVoipDefinition(map, checkpoint_id, intended_changes) { const metadata = VOIP_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: VOIP_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
const SIP_PROVIDER_NAME = {
  axivox: "Axivox",
  onsip: "OnSIP",
};
function extractProviderConnectionChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // voip.provider.name is a required char labelling the provider entry. Map the wizard's
  // sip_provider selection to the canonical Odoo label for Axivox and OnSIP; "other_sip" is
  // too generic to coin a name without fabrication.
  const name = SIP_PROVIDER_NAME[capture.sip_provider];
  if (!name) return null;
  return { name };
}
export function assembleVoipOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (voip-wizard.js): {sip_provider, websocket_server, sip_domain,
  // recording_policy, enterprise_instance_confirmed, pilot_user_name}.
  const capture = isPlainObject(wizard_captures?.voip) ? wizard_captures.voip : null;
  // checkpoint-voip-provider-connection → voip.provider (name seed from sip_provider).
  addVoipDefinition(map, "checkpoint-voip-provider-connection", extractProviderConnectionChanges(capture));
  // checkpoint-voip-extension-assignment → res.users.
  // honest-null: pilot_user_name is a display name that does not resolve a res.users id; user
  // records also require login/company_id per record that the wizard does not supply.
  addVoipDefinition(map, "checkpoint-voip-extension-assignment", null);
  // checkpoint-voip-call-logging → voip.provider. execution_relevance "None".
  addVoipDefinition(map, "checkpoint-voip-call-logging", null);
  // checkpoint-voip-crm-integration → voip.provider.
  // honest-null: CRM integration lives on crm.lead trigger rules, not on voip.provider fields;
  // the wizard captures no field that maps to voip.provider.{mode, transcription_policy,
  // pbx_ip}.
  addVoipDefinition(map, "checkpoint-voip-crm-integration", null);
  return map;
}
