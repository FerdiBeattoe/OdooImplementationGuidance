import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://stub.supabase.local';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'stub-service-role';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const VALID_TOKEN = 'valid-token';
const recordedAuditEvents = [];
const teamMembersByProject = new Map();
let goLiveAuditRows = [];

const { default: supabase } = await import('../../supabase-client.js');
setupSupabaseStub();

const pdfPrinterModule = require('pdfmake/js/Printer.js');
patchPdfPrinter(pdfPrinterModule);

const { OdooClient } = await import('../../odoo-client.js');
patchOdooClient(OdooClient);

const { createAppServer } = await import('../../server.js');

const server = createAppServer({ rateLimitMaxRequests: Infinity });
const serverPort = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    resolve(address.port);
  });
});

if (process.send) {
  process.send({ type: 'ready', port: serverPort });
}

process.on('message', async (msg) => {
  if (!msg || typeof msg !== 'object') {
    return;
  }

  const { type, id, payload } = msg;
  try {
    switch (type) {
      case 'getAuditEvents': {
        const events = recordedAuditEvents.map((row) => structuredClone(row));
        return respond(id, events);
      }
      case 'clearAuditEvents': {
        recordedAuditEvents.length = 0;
        return respond(id, { ok: true });
      }
      case 'setAuditRows': {
        goLiveAuditRows = Array.isArray(payload) ? payload.map((row) => ({ ...row })) : [];
        return respond(id, { ok: true });
      }
      case 'setTeamMembers': {
        const { projectId, members } = payload || {};
        if (!projectId) {
          throw new Error('projectId is required for setTeamMembers');
        }
        const normalized = Array.isArray(members) && members.length
          ? members.map(normalizeMember)
          : [buildDefaultMember(projectId)];
        teamMembersByProject.set(projectId, normalized);
        return respond(id, { ok: true });
      }
      case 'shutdown': {
        server.close(() => {
          respond(id, { ok: true });
          process.exit(0);
        });
        return;
      }
      default:
        throw new Error(`Unknown command: ${type}`);
    }
  } catch (error) {
    respond(id, null, error);
  }
});

function respond(id, result, error = null) {
  if (!process.send) return;
  process.send({ type: 'response', id, result, error: error ? { message: error.message } : null });
}

function setupSupabaseStub() {
  if (!supabase) {
    throw new Error('Supabase client not initialised; cannot run audit test server');
  }

  supabase.auth = {
    async getUser(token) {
      if (token === VALID_TOKEN) {
        return {
          data: {
            user: {
              id: 'user-test',
              email: 'lead@example.com',
              user_metadata: { full_name: 'Test Lead' },
            },
          },
          error: null,
        };
      }
      return {
        data: { user: null },
        error: { message: 'Invalid token' },
      };
    },
  };

  supabase.from = (table) => {
    if (table === 'audit_log') {
      return createAuditLogQuery();
    }
    if (table === 'team_members') {
      return createTeamMembersQuery();
    }
    return {
      insert: () => Promise.resolve({ data: null, error: null }),
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    };
  };
}

function createAuditLogQuery() {
  return {
    insert(payload) {
      const rows = Array.isArray(payload) ? payload : [payload];
      for (const row of rows) {
        recordedAuditEvents.push(structuredClone(row));
      }
      return Promise.resolve({ data: rows, error: null });
    },
    select() {
      return {
        eq(field, value) {
          const filtered = goLiveAuditRows.filter((row) => row[field] === value);
          return {
            order() {
              const sorted = [...filtered].sort((a, b) => {
                const aTime = Date.parse(a?.created_at || '');
                const bTime = Date.parse(b?.created_at || '');
                if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
                  return 0;
                }
                return aTime - bTime;
              });
              return Promise.resolve({ data: sorted, error: null });
            },
          };
        },
      };
    },
  };
}

function createTeamMembersQuery() {
  let projectFilter = null;
  let accountFilter = null;
  let idFilter = null;

  const builder = {
    select() {
      return builder;
    },
    eq(field, value) {
      if (field === 'project_id') {
        projectFilter = value;
      }
      if (field === 'account_id') {
        accountFilter = value;
      }
      if (field === 'id') {
        idFilter = value;
      }
      return builder;
    },
    order() {
      const data = filterMembers();
      return Promise.resolve({ data, error: null });
    },
    maybeSingle() {
      const data = filterMembers();
      return Promise.resolve({ data: data[0] || null, error: null });
    },
  };

  function filterMembers() {
    let members = teamMembersByProject.get(projectFilter) || [buildDefaultMember(projectFilter)];
    if (accountFilter) {
      members = members.filter((entry) => entry.account_id === accountFilter);
    }
    if (idFilter) {
      members = members.filter((entry) => entry.id === idFilter);
    }
    return members.map((entry) => ({ ...entry }));
  }

  return builder;
}

function buildDefaultMember(projectId) {
  return {
    id: randomUUID(),
    project_id: projectId,
    account_id: 'user-test',
    email: 'lead@example.com',
    full_name: 'Test Lead',
    role: 'project_lead',
    accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

function normalizeMember(member) {
  return {
    id: member.id || randomUUID(),
    project_id: member.project_id,
    account_id: member.account_id || 'user-test',
    email: member.email || 'lead@example.com',
    full_name: member.full_name || 'Test Lead',
    role: member.role || 'project_lead',
    accepted_at: member.accepted_at || new Date().toISOString(),
    created_at: member.created_at || new Date().toISOString(),
  };
}

function patchOdooClient(OdooClient) {
  if (!OdooClient) {
    return;
  }
  OdooClient.prototype.authenticate = async function mockAuthenticate() {
    this.uid = 999;
    this.sessionId = 'stub-session';
    return this.uid;
  };
  OdooClient.prototype.write = async function mockWrite() {
    return true;
  };
  OdooClient.prototype.create = async function mockCreate() {
    return 1;
  };
  // Permissive live-field map — the audit server tests the governance
  // write path, not Odoo schema correctness. Any key the caller supplies
  // is treated as a valid live field so S13 validation passes through.
  OdooClient.prototype.fieldsGet = async function mockFieldsGet() {
    return new Proxy({ __live: { type: 'char' } }, { has: () => true });
  };
  OdooClient.prototype.getVersionInfo = async function mockGetVersionInfo() {
    return {
      server_version: '19.0',
      server_serie: '19.0',
      server_version_info: ['19', '0', '0', 'final', 'Community'],
      edition: 'Community',
    };
  };
}

function patchPdfPrinter(pdfPrinterModule) {
  const PdfPrinter = pdfPrinterModule?.default || pdfPrinterModule;
  if (!PdfPrinter) {
    return;
  }
  class FakePdfDoc extends EventEmitter {
    constructor() {
      super();
      process.nextTick(() => {
        this.emit('data', Buffer.from('PDF'));
        this.emit('end');
      });
    }
    end() {}
  }
  PdfPrinter.prototype.createPdfKitDocument = function mockCreatePdf() {
    return new FakePdfDoc();
  };
}
