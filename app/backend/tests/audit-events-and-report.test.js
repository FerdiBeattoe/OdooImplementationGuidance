import { before, after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile, writeFile, unlink } from 'node:fs/promises';

import { saveRuntimeState } from '../runtime-state-persistence-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const helperScript = path.resolve(__dirname, 'helpers', 'audit-test-server-runner.js');
const runtimeStateDir = path.resolve(repoRoot, 'app', 'backend', 'data', 'runtime-states');
const connectionsPath = path.resolve(repoRoot, 'app', 'backend', 'data', 'connections.json');
const AUTH_HEADERS = { Authorization: 'Bearer valid-token' };

class AuditTestServerController {
  constructor(scriptPath) {
    this.scriptPath = scriptPath;
    this.child = null;
    this.port = null;
    this.pending = new Map();
    this.lastMessageId = 0;
    this.readyResolve = null;
    this.readyReject = null;
    this.stopping = false;
  }

  async start() {
    if (this.child) return;
    this.child = fork(this.scriptPath, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
    this.child.on('message', (msg) => this.handleMessage(msg));
    this.child.on('exit', (code) => {
      if (this.stopping) return;
      const error = new Error(`audit test server exited unexpectedly (code ${code ?? 'unknown'})`);
      this.rejectAll(error);
      if (this.readyReject) {
        this.readyReject(error);
        this.readyReject = null;
      }
    });

    await new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
  }

  async stop() {
    if (!this.child) return;
    this.stopping = true;
    try {
      await this.request('shutdown');
    } catch (error) {
      // ignore errors on shutdown
    }
    await new Promise((resolve) => {
      this.child?.once('exit', () => resolve());
      this.child = null;
    });
    this.pending.clear();
  }

  async setTeamMembers(projectId, members) {
    await this.request('setTeamMembers', { projectId, members });
  }

  async setAuditRows(rows) {
    await this.request('setAuditRows', rows);
  }

  async clearAuditEvents() {
    await this.request('clearAuditEvents');
  }

  async getAuditEvents() {
    return await this.request('getAuditEvents');
  }

  handleMessage(msg) {
    if (!msg || typeof msg !== 'object') {
      return;
    }
    if (msg.type === 'ready') {
      this.port = msg.port;
      if (this.readyResolve) {
        this.readyResolve();
        this.readyResolve = null;
        this.readyReject = null;
      }
      return;
    }
    if (msg.type === 'response') {
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) {
        entry.reject(new Error(msg.error.message));
      } else {
        entry.resolve(msg.result);
      }
    }
  }

  rejectAll(error) {
    for (const entry of this.pending.values()) {
      entry.reject(error);
    }
    this.pending.clear();
  }

  request(type, payload = null) {
    if (!this.child) {
      return Promise.reject(new Error('audit test server is not running'));
    }
    const id = ++this.lastMessageId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.send({ type, id, payload });
    });
  }
}

const controller = new AuditTestServerController(helperScript);
const runtimeStateFiles = new Set();
let originalConnections = null;

describe('Audit events and go-live reporting', () => {
  before(async () => {
    originalConnections = await readFile(connectionsPath, 'utf8').catch(() => null);
    await controller.start();
  });

  after(async () => {
    await controller.stop();
    if (originalConnections !== null) {
      await writeFile(connectionsPath, originalConnections, 'utf8');
    }
    for (const filePath of runtimeStateFiles) {
      await unlink(filePath).catch(() => {});
    }
  });

  beforeEach(async () => {
    await controller.clearAuditEvents();
    await controller.setAuditRows([]);
  });

  test('governed_write_succeeded audit event fires when pipeline apply succeeds', async () => {
    const projectId = 'proj-apply-success';
    await controller.setTeamMembers(projectId, [buildTeamMember(projectId)]);
    await registerConnection(projectId);

    const runtimeState = makeRuntimeState(projectId);
    const payload = {
      approval_id: 'approval-success-001',
      runtime_state: runtimeState,
      operation: {
        model: 'res.company',
        method: 'write',
        ids: [1],
        values: { name: 'Project Odoo' },
      },
      connection_context: { project_id: projectId },
    };

    const response = await postJson('/api/pipeline/apply', payload, { headers: AUTH_HEADERS });
    assert.equal(
      response.status,
      200,
      `apply success status ${response.status}: ${JSON.stringify(response.body)}`
    );
    assert.equal(response.body.ok, true);

    const events = await controller.getAuditEvents();
    const succeeded = events.filter(
      (entry) => entry.project_id === projectId && entry.action === 'governed_write_succeeded'
    );
    assert.ok(succeeded.length >= 1, 'expected governed_write_succeeded entry');
    assert.equal(succeeded[0].details.approval_id, 'approval-success-001');
  });

  test('governed_write_failed audit event fires when pipeline apply fails', async () => {
    const projectId = 'proj-apply-failure';
    await controller.setTeamMembers(projectId, [buildTeamMember(projectId)]);
    await registerConnection(projectId);

    const runtimeState = makeRuntimeState(projectId);
    const payload = {
      approval_id: 'approval-failure-001',
      runtime_state: runtimeState,
      operation: {
        model: 'res.company',
        method: 'write',
        // ids intentionally omitted to trigger validation failure
        values: { name: 'Incomplete' },
      },
      connection_context: { project_id: projectId },
    };

    const response = await postJson('/api/pipeline/apply', payload, { headers: AUTH_HEADERS });
    assert.equal(response.status, 400);
    assert.equal(response.body.ok, false);

    const events = await controller.getAuditEvents();
    const failed = events.filter(
      (entry) => entry.project_id === projectId && entry.action === 'governed_write_failed'
    );
    assert.ok(failed.length >= 1, 'expected governed_write_failed entry');
    assert.equal(failed[0].details.approval_id, 'approval-failure-001');
  });

  test('wizard_completed audit event fires when wizard capture saves data', async () => {
    const projectId = 'proj-wizard-capture';
    await controller.setTeamMembers(projectId, [buildTeamMember(projectId)]);
    await seedRuntimeState(projectId);

    const response = await postJson(
      '/api/pipeline/wizard-capture',
      {
        project_id: projectId,
        domain: 'inventory',
        wizard_data: {
          picking_strategy: 'wave',
          enable_batch_picking: true,
        },
      },
      { headers: AUTH_HEADERS }
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);

    const events = await controller.getAuditEvents();
    const wizardCompleted = events.filter(
      (entry) => entry.project_id === projectId && entry.action === 'wizard_completed'
    );
    assert.ok(wizardCompleted.length >= 1, 'expected wizard_completed entry');
    assert.equal(wizardCompleted[0].details.domain, 'inventory');
  });

  test('discovery_answers_submitted audit event fires when pipeline run receives answers', async () => {
    const projectId = 'proj-pipeline-run';
    await controller.setTeamMembers(projectId, [buildTeamMember(projectId)]);

    const response = await postJson(
      '/api/pipeline/run',
      {
        project_identity: { project_id: projectId },
        discovery_answers: {
          framework_version: '1.0',
          answers: {
            'BM-01': 'Services only',
            'OP-01': false,
            'SC-04': 'Discount approvals required',
          },
        },
      },
      { headers: AUTH_HEADERS }
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    runtimeStateFiles.add(getRuntimeStatePath(projectId));

    const events = await controller.getAuditEvents();
    const submitted = events.filter(
      (entry) => entry.project_id === projectId && entry.action === 'discovery_answers_submitted'
    );
    assert.ok(submitted.length >= 1, 'expected discovery_answers_submitted entry');
    assert.ok(submitted[0].details.answer_count > 0);
  });

  test('GET /api/report/go-live returns PDF when authorized', async () => {
    const projectId = 'proj-go-live';
    await controller.setTeamMembers(projectId, [buildTeamMember(projectId)]);
    await seedRuntimeState(projectId, {
      checkpoints: [
        { checkpoint_id: 'FND-0001', domain: 'foundation' },
      ],
      checkpoint_statuses: { 'FND-0001': 'Complete' },
      checkpoint_confirmations: {
        'FND-0001': { confirmed_at: new Date().toISOString() },
      },
      activated_domains: {
        domains: [
          { domain_id: 'foundation', activated: true },
        ],
      },
    });

    await controller.setAuditRows([
      {
        project_id: projectId,
        created_at: new Date().toISOString(),
        action: 'governed_write_succeeded',
        checkpoint_id: 'FND-0001',
        details: {
          checkpoint_id: 'FND-0001',
          operation_model: 'res.company',
          operation_method: 'write',
        },
      },
    ]);

    const response = await getBuffer(`/api/report/go-live?project_id=${projectId}`, {
      headers: AUTH_HEADERS,
    });

    assert.equal(response.status, 200);
    assert.match(String(response.headers['content-type'] || ''), /application\/pdf/);
    assert.ok(response.body.length > 0, 'expected non-empty PDF buffer');
  });

  test('GET /api/report/go-live returns 401 when Authorization header is missing', async () => {
    const projectId = 'proj-go-live-unauthorized';
    const response = await getJson(`/api/report/go-live?project_id=${projectId}`);
    assert.equal(response.status, 401);
    assert.ok(response.body.error || response.body.message);
  });
});

async function registerConnection(projectId) {
  const payload = {
    project_id: projectId,
    credentials: {
      url: 'https://stub-odoo.local',
      database: 'stub-db',
      username: 'stub-user',
      password: 'stub-pass',
    },
  };
  const response = await postJson('/api/pipeline/connection/register', payload, { headers: AUTH_HEADERS });
  assert.equal(
    response.status,
    200,
    `connection register status ${response.status}: ${JSON.stringify(response.body)}`
  );
  assert.equal(response.body.ok, true, 'connection register ok');
}

function makeRuntimeState(projectId) {
  return {
    previews: [
      {
        preview_id: 'preview-001',
        checkpoint_id: 'FND-0001',
        target_model: 'res.company',
        target_operation: 'write',
        executable: true,
        safety_class: 'safe',
      },
    ],
    executions: [],
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [
      {
        approval_id: 'approval-success-001',
        preview_id: 'preview-001',
        checkpoint_id: 'FND-0001',
        candidate_id: 'candidate-001',
        execution_occurred: false,
        safety_class: 'safe',
      },
        ],
      },
      execution_eligibility: {
        execution_candidates: [
          {
            candidate_id: 'candidate-001',
            preview_id: 'preview-001',
            checkpoint_id: 'FND-0001',
            safety_class: 'safe',
          },
        ],
      },
    },
    project_identity: { project_id: projectId },
  };
}

async function seedRuntimeState(projectId, overrides = {}) {
  const baseState = {
    project_identity: {
      project_id: projectId,
      project_name: 'Test Project',
      company_name: 'Test Co',
    },
    discovery_answers: {
      framework_version: '1.0',
      answers: {
        'BM-01': 'Services only',
      },
    },
    checkpoint_statuses: {},
    checkpoint_confirmations: {},
    checkpoints: [],
    wizard_captures: {},
    target_context: null,
    activated_domains: {
      domains: [],
    },
    ...overrides,
  };

  const result = await saveRuntimeState(baseState);
  if (!result.ok) {
    throw new Error(result.error || 'Failed to persist runtime state');
  }
  runtimeStateFiles.add(getRuntimeStatePath(projectId));
}

function getRuntimeStatePath(projectId) {
  const safeId = projectId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.resolve(runtimeStateDir, `${safeId}.json`);
}

function buildTeamMember(projectId) {
  return {
    id: `member-${projectId}`,
    project_id: projectId,
    account_id: 'user-test',
    email: 'lead@example.com',
    full_name: 'Test Lead',
    role: 'project_lead',
    accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

async function postJson(pathname, body, { headers = {} } = {}) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  const buffer = Buffer.from(payload);
  const baseHeaders = payload
    ? { 'Content-Type': 'application/json', 'Content-Length': buffer.length }
    : {};
  const raw = await httpRequestRaw('POST', pathname, payload ? buffer : null, {
    ...baseHeaders,
    ...headers,
  });
  return {
    status: raw.status,
    headers: raw.headers,
    body: raw.body.length ? JSON.parse(raw.body.toString('utf8')) : {},
  };
}

async function getBuffer(pathname, { headers = {} } = {}) {
  const raw = await httpRequestRaw('GET', pathname, null, headers);
  return raw;
}

async function getJson(pathname, options = {}) {
  const raw = await httpRequestRaw('GET', pathname, null, options.headers || {});
  return {
    status: raw.status,
    headers: raw.headers,
    body: raw.body.length ? JSON.parse(raw.body.toString('utf8')) : {},
  };
}

function httpRequestRaw(method, pathname, bodyBuffer, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: '127.0.0.1',
        port: controller.port,
        path: pathname,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}
