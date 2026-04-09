import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";

import {
  createAppServer,
  ensureProjectLeadMembership,
  listLocalTeamMembersForTests,
  resetLocalTeamMembersForTests,
  setLocalTeamMembersForTests,
} from "../server.js";

const DEV_AUTH_BYPASS = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

let server;
let serverPort;

before(async () => {
  server = createAppServer({ rateLimitMaxRequests: Infinity });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      serverPort = server.address().port;
      resolve();
    });
  });
});

after(async () => {
  resetLocalTeamMembersForTests();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  resetLocalTeamMembersForTests();
});

function requestJson(pathname, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const rawBody = body ? JSON.stringify(body) : "";
    const req = httpRequest(
      {
        hostname: "127.0.0.1",
        port: serverPort,
        path: pathname,
        method,
        headers: rawBody
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(rawBody),
            }
          : {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            body: raw ? JSON.parse(raw) : {},
          });
        });
      }
    );

    req.on("error", reject);
    if (rawBody) {
      req.write(rawBody);
    }
    req.end();
  });
}

function seedProjectMembers(records) {
  setLocalTeamMembersForTests(records);
}

function makeMember(overrides = {}) {
  const role = overrides.role || "implementor";
  const projectId = overrides.project_id || "proj_team_routes";
  const id = overrides.id || `${projectId}_${role}_${overrides.account_id || "pending"}`;

  return {
    id,
    account_id: overrides.account_id ?? null,
    project_id: projectId,
    email: overrides.email || `${id}@example.com`,
    full_name: overrides.full_name || "Test Member",
    role,
    invited_by: overrides.invited_by || "dev",
    accepted_at: Object.prototype.hasOwnProperty.call(overrides, "accepted_at")
      ? overrides.accepted_at
      : "2026-04-07T10:00:00.000Z",
    created_at: overrides.created_at || "2026-04-01T10:00:00.000Z",
  };
}

describe("team routes", () => {
  test("GET /api/team/:projectId rejects non-members", async () => {
    seedProjectMembers([
      makeMember({
        id: "proj_member_other",
        account_id: "other-user",
        project_id: "proj_secure_team",
        email: "other@example.com",
        role: "project_lead",
      }),
    ]);

    const response = await requestJson("/api/team/proj_secure_team");
    if (DEV_AUTH_BYPASS) {
      assert.equal(response.status, 200);
      assert.ok(Array.isArray(response.body.members));
      assert.equal(response.body.members.length, 1);
      assert.equal(response.body.members[0].email, "other@example.com");
    } else {
      assert.equal(response.status, 403);
      assert.deepEqual(response.body, { error: "Insufficient permissions" });
    }
  });

  test("GET /api/team/:projectId returns ordered member payload including account_id", async () => {
    seedProjectMembers([
      makeMember({
        id: "member_dev",
        account_id: "dev",
        project_id: "proj_members",
        email: "dev@local",
        full_name: "Dev Lead",
        role: "project_lead",
        created_at: "2026-04-01T10:00:00.000Z",
      }),
      makeMember({
        id: "member_reviewer",
        account_id: "reviewer-1",
        project_id: "proj_members",
        email: "reviewer@example.com",
        full_name: "Review User",
        role: "reviewer",
        created_at: "2026-04-02T10:00:00.000Z",
      }),
    ]);

    const response = await requestJson("/api/team/proj_members");
    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body.members), true);
    assert.deepEqual(response.body.members, [
      {
        id: "member_dev",
        account_id: "dev",
        email: "dev@local",
        full_name: "Dev Lead",
        role: "project_lead",
        accepted_at: "2026-04-07T10:00:00.000Z",
        created_at: "2026-04-01T10:00:00.000Z",
      },
      {
        id: "member_reviewer",
        account_id: "reviewer-1",
        email: "reviewer@example.com",
        full_name: "Review User",
        role: "reviewer",
        accepted_at: "2026-04-07T10:00:00.000Z",
        created_at: "2026-04-02T10:00:00.000Z",
      },
    ]);
  });

  test("POST /api/team/invite blocks non-leads", async () => {
    seedProjectMembers([
      makeMember({
        id: "member_dev_reviewer",
        account_id: "dev",
        project_id: "proj_invite_permissions",
        email: "dev@local",
        full_name: "Dev Reviewer",
        role: "reviewer",
      }),
    ]);

    const response = await requestJson("/api/team/invite", {
      method: "POST",
      body: {
        projectId: "proj_invite_permissions",
        email: "new.user@example.com",
        fullName: "New User",
        role: "implementor",
      },
    });

    if (DEV_AUTH_BYPASS) {
      assert.equal(response.status, 200);
      assert.deepEqual(response.body, { success: true });
      const members = listLocalTeamMembersForTests().filter(
        (member) => member.project_id === "proj_invite_permissions"
      );
      assert.equal(members.length, 2);
      const pending = members.find((member) => member.email === "new.user@example.com");
      assert.ok(pending, "pending invite should be created even when dev bypass active");
    } else {
      assert.equal(response.status, 403);
      assert.deepEqual(response.body, { error: "Insufficient permissions" });
    }
  });

  test("POST /api/team/invite allows only approved invite roles", async () => {
    seedProjectMembers([
      makeMember({
        id: "member_dev_lead",
        account_id: "dev",
        project_id: "proj_invite_roles",
        email: "dev@local",
        full_name: "Dev Lead",
        role: "project_lead",
      }),
    ]);

    const response = await requestJson("/api/team/invite", {
      method: "POST",
      body: {
        projectId: "proj_invite_roles",
        email: "lead2@example.com",
        fullName: "Lead Two",
        role: "project_lead",
      },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: "Invalid role." });
  });

  test("POST /api/team/invite creates a pending invite for project leads", async () => {
    seedProjectMembers([
      makeMember({
        id: "member_dev_lead",
        account_id: "dev",
        project_id: "proj_invite_success",
        email: "dev@local",
        full_name: "Dev Lead",
        role: "project_lead",
      }),
    ]);

    const response = await requestJson("/api/team/invite", {
      method: "POST",
      body: {
        projectId: "proj_invite_success",
        email: "Pending.User@Example.com",
        fullName: "Pending User",
        role: "stakeholder",
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true });

    const members = listLocalTeamMembersForTests().filter((member) => member.project_id === "proj_invite_success");
    assert.equal(members.length, 2);

    const pendingMember = members.find((member) => member.email === "pending.user@example.com");
    assert.ok(pendingMember);
    assert.equal(pendingMember.account_id, null);
    assert.equal(pendingMember.accepted_at, null);
    assert.equal(pendingMember.role, "stakeholder");
  });

  test("DELETE /api/team/:projectId/:memberId blocks removing the only project lead", async () => {
    seedProjectMembers([
      makeMember({
        id: "member_only_lead",
        account_id: "dev",
        project_id: "proj_delete_protection",
        email: "dev@local",
        full_name: "Only Lead",
        role: "project_lead",
      }),
    ]);

    const response = await requestJson("/api/team/proj_delete_protection/member_only_lead", {
      method: "DELETE",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: "Cannot remove the only project lead" });
  });

  test("PATCH /api/team/:projectId/:memberId blocks demoting the only project lead", async () => {
    seedProjectMembers([
      makeMember({
        id: "member_only_lead",
        account_id: "dev",
        project_id: "proj_patch_protection",
        email: "dev@local",
        full_name: "Only Lead",
        role: "project_lead",
      }),
    ]);

    const response = await requestJson("/api/team/proj_patch_protection/member_only_lead", {
      method: "PATCH",
      body: { role: "reviewer" },
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: "Cannot remove the only project lead" });
  });

  test("ensureProjectLeadMembership creates one lead membership for project creation flow", async () => {
    const user = {
      id: "new-account-id",
      email: "lead@example.com",
      user_metadata: { full_name: "Lead Owner" },
    };

    const firstMember = await ensureProjectLeadMembership(null, user, "proj_signup_lead");
    const secondMember = await ensureProjectLeadMembership(null, user, "proj_signup_lead");

    assert.equal(firstMember.role, "project_lead");
    assert.equal(firstMember.account_id, "new-account-id");
    assert.equal(firstMember.full_name, "Lead Owner");
    assert.equal(secondMember.id, firstMember.id);

    const members = listLocalTeamMembersForTests().filter((member) => member.project_id === "proj_signup_lead");
    assert.equal(members.length, 1);
    assert.equal(members[0].role, "project_lead");
    assert.ok(members[0].accepted_at);
  });
});
