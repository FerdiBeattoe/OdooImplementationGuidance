// ---------------------------------------------------------------------------
// Users/Roles Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `users-roles-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const USERS_ROLES_OP_DEFS_VERSION = "1.1.0";
export const USERS_ROLES_USER_MODEL = "res.users";
export const USERS_ROLES_GROUP_MODEL = "res.groups";
export const USERS_ROLES_TARGET_OPERATION = "write";

export const USERS_ROLES_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.USR_FOUND_001,
  CHECKPOINT_IDS.USR_DREQ_001,
  CHECKPOINT_IDS.USR_DREQ_002,
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractUsersRolesCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures["users-roles"]) ? wizard_captures["users-roles"] : null;
}

function buildUserChanges(usersRolesCapture) {
  if (!isPlainObject(usersRolesCapture)) {
    return null;
  }
  const name = typeof usersRolesCapture.admin_user_name === "string"
    ? usersRolesCapture.admin_user_name.trim()
    : "";
  const login = typeof usersRolesCapture.admin_user_email === "string"
    ? usersRolesCapture.admin_user_email.trim()
    : "";
  if (!name && !login) {
    return null;
  }
  return {
    name: name || null,
    login: login || null,
  };
}

function buildGroupChanges(usersRolesCapture) {
  if (!isPlainObject(usersRolesCapture)) {
    return null;
  }
  const changes = [];
  if (usersRolesCapture.create_sales_manager_role === true) {
    changes.push({ name: "Sales Manager" });
  }
  if (usersRolesCapture.create_purchase_manager_role === true) {
    changes.push({ name: "Purchase Manager" });
  }
  return changes.length > 0 ? changes : null;
}

export function assembleUsersRolesOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const usersRolesCapture = extractUsersRolesCapture(wizard_captures);
  const userChanges = buildUserChanges(usersRolesCapture);
  const groupChanges = buildGroupChanges(usersRolesCapture);

  map[CHECKPOINT_IDS.USR_FOUND_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.USR_FOUND_001,
    target_model: USERS_ROLES_USER_MODEL,
    target_operation: USERS_ROLES_TARGET_OPERATION,
    intended_changes: userChanges,
  });

  map[CHECKPOINT_IDS.USR_DREQ_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.USR_DREQ_001,
    target_model: USERS_ROLES_USER_MODEL,
    target_operation: USERS_ROLES_TARGET_OPERATION,
    intended_changes: userChanges,
  });

  map[CHECKPOINT_IDS.USR_DREQ_002] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.USR_DREQ_002,
    target_model: USERS_ROLES_GROUP_MODEL,
    target_operation: USERS_ROLES_TARGET_OPERATION,
    intended_changes: groupChanges,
  });

  const ta02 = answers["TA-02"];
  if (ta02 === true || ta02 === "Yes") {
    map[CHECKPOINT_IDS.USR_DREQ_004] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.USR_DREQ_004,
      target_model: USERS_ROLES_USER_MODEL,
      target_operation: USERS_ROLES_TARGET_OPERATION,
      intended_changes: userChanges,
    });
  }

  const bm02 = answers["BM-02"];
  if (bm02 === true || bm02 === "Yes") {
    map[CHECKPOINT_IDS.USR_DREQ_005] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.USR_DREQ_005,
      target_model: USERS_ROLES_GROUP_MODEL,
      target_operation: USERS_ROLES_TARGET_OPERATION,
      intended_changes: groupChanges,
    });
  }

  return map;
}
