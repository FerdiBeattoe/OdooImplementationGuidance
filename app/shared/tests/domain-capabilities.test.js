import test from "node:test";
import assert from "node:assert/strict";

import { createInitialProjectState } from "../project-state.js";
import { getAllDomainCapabilities, getDomainCapability } from "../domain-capabilities.js";

test("all in-scope domains expose an explicit target capability level", () => {
  const capabilities = getAllDomainCapabilities(createInitialProjectState());

  assert.equal(capabilities.length, 51);
  assert.ok(capabilities.every((item) => item.targetLevel >= 1 || item.domainId));
  assert.ok(capabilities.some((item) => item.domainId === "inventory" && item.targetLabel === "Bounded executable"));
  assert.ok(capabilities.some((item) => item.domainId === "crm" && item.targetLabel === "Bounded executable"));
  assert.ok(capabilities.some((item) => item.domainId === "master-data" && item.targetLabel === "Partially executable"));
  assert.ok(capabilities.some((item) => item.domainId === "accounting" && item.targetLabel === "Partially executable"));
  assert.ok(capabilities.some((item) => item.domainId === "field-service" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "maintenance" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "rental" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "repairs" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "subscriptions" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "timesheets" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "expenses" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "attendance" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "recruitment" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "fleet" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "events" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "email-marketing" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "helpdesk" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "payroll" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "planning" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "knowledge" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "discuss" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "outgoing-mail" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "incoming-mail" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "accounting-reports" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "spreadsheet" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "live-chat" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "whatsapp" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "sms-marketing" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "calendar" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "iot" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "studio" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "consolidation" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "lunch" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "referrals" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "loyalty" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "appraisals" && item.targetLabel === "Previewable"));
  assert.ok(capabilities.some((item) => item.domainId === "voip" && item.targetLabel === "Previewable"));
});

test("CRM and inventory only reach level 4 after truthful executable inspection support exists", () => {
  const project = createInitialProjectState();

  let capability = getDomainCapability(project, "crm");
  assert.equal(capability.currentLevel, 0);

  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.inspectionState.domains.crm = {
    status: "complete",
    lastPreviewableAt: new Date().toISOString(),
    lastExecutableAt: new Date().toISOString()
  };

  capability = getDomainCapability(project, "crm");
  assert.equal(capability.currentLevel, 4);
  assert.equal(capability.label, "Bounded executable");
});

test("master-data reaches level 3 only after truthful executable inspection support exists", () => {
  const project = createInitialProjectState();

  let capability = getDomainCapability(project, "master-data");
  assert.equal(capability.currentLevel, 0);

  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.inspectionState.domains["master-data"] = {
    status: "complete",
    lastPreviewableAt: new Date().toISOString(),
    lastExecutableAt: new Date().toISOString()
  };

  capability = getDomainCapability(project, "master-data");
  assert.equal(capability.currentLevel, 3);
  assert.equal(capability.label, "Partially executable");
});
