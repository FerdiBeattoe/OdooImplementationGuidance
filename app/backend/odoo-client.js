export class OdooRpcError extends Error {
  constructor(message, code = "") {
    super(message);
    this.code = code;
  }
}

export class OdooClient {
  constructor({ baseUrl, database, sessionId = "", uid = 0, fetchImpl = fetch }) {
    const cleanBase = String(baseUrl || "").trim().replace(/\/+$/, "");
    if (!cleanBase || cleanBase === "undefined") {
      throw new Error(`OdooClient: baseUrl is required but received: ${JSON.stringify(baseUrl)}`);
    }
    // Ensure it has a protocol so new URL() works everywhere
    this.baseUrl = (cleanBase.startsWith("https://") || cleanBase.startsWith("http://")) ? cleanBase : `https://${cleanBase}`;
    this.database = database || "";
    this.sessionId = sessionId || "";
    this.uid = uid || 0;
    this.fetchImpl = fetchImpl;
  }

  async authenticate(username, password) {
    const authUrl = new URL("/web/session/authenticate", this.baseUrl).toString();
    console.log('[OdooClient] authenticate URL:', authUrl);
    const response = await this.fetchImpl(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        id: 1,
        params: {
          db: this.database,
          login: username,
          password
        }
      })
    });

    const body = await response.json();
    if (!response.ok || body.error) {
      throw new OdooRpcError(body?.error?.data?.message || body?.error?.message || "Authentication failed.");
    }

    const uid = Number(body?.result?.uid || 0);
    if (!uid) {
      throw new OdooRpcError("Authentication failed.");
    }

    this.uid = uid;
    this.sessionId = extractSessionCookie(response);
    return uid;
  }

  async getVersionInfo() {
    return this._post("/web/webclient/version_info", {});
  }

  async executeKw(model, method, args = [], kwargs = {}) {
    return this._post("/web/dataset/call_kw", {
      model,
      method,
      args,
      kwargs
    });
  }

  async searchRead(model, domain, fields, options = {}) {
    return this.executeKw(model, "search_read", [domain], {
      fields,
      limit: options.limit ?? 80,
      offset: options.offset ?? 0,
      order: options.order || ""
    });
  }

  async searchCount(model, domain) {
    return Number((await this.executeKw(model, "search_count", [domain])) || 0);
  }

  async create(model, values) {
    return this.executeKw(model, "create", [values]);
  }

  async write(model, ids, values) {
    return this.executeKw(model, "write", [ids, values]);
  }

  async fieldsGet(model, attributes = ["string", "type", "required", "selection", "relation"]) {
    return this.executeKw(model, "fields_get", [], { attributes });
  }

  async _post(endpoint, params) {
    const response = await this.fetchImpl(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.sessionId ? { Cookie: `session_id=${this.sessionId}` } : {})
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        id: 1,
        params
      })
    });

    const body = await response.json();
    if (!response.ok || body.error) {
      throw new OdooRpcError(body?.error?.data?.message || body?.error?.message || "Odoo request failed.");
    }

    return body.result;
  }
}

export async function detectInstalledModules(client, moduleNames = []) {
  if (!moduleNames.length) {
    return [];
  }

  const rows = await client.searchRead(
    "ir.module.module",
    [["name", "in", moduleNames]],
    ["name", "state"],
    { limit: Math.max(moduleNames.length, 20) }
  );

  const stateByName = new Map(rows.map((row) => [row.name, row.state]));
  return moduleNames.map((module) => ({
    module,
    state: stateByName.get(module) || "missing"
  }));
}

export async function detectVersion(client) {
  const versionInfo = await client.getVersionInfo();
  return {
    serverVersion: String(versionInfo?.server_version || "unknown"),
    serverSerie: String(versionInfo?.server_serie || "unknown"),
    edition: String(versionInfo?.server_version_info?.slice?.(-1)?.[0] || versionInfo?.edition || "unknown")
  };
}

function extractSessionCookie(response) {
  const cookieHeader = response.headers.get("set-cookie") || "";
  const match = cookieHeader.match(/session_id=([^;]+)/i);
  return match?.[1] || "";
}
