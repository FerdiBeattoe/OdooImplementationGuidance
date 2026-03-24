const DEPLOYMENT_TYPES = {
  ODOO_ONLINE: "odoo_online",
  ODOO_SH: "odoo_sh",
  ON_PREMISE: "on_premise"
};

const ODOO_VERSIONS = {
  V15: { major: 15, name: "Odoo 15", supported: false },
  V16: { major: 16, name: "Odoo 16", supported: false },
  V17: { major: 17, name: "Odoo 17", supported: false },
  V18: { major: 18, name: "Odoo 18", supported: false },
  V19: { major: 19, name: "Odoo 19", supported: true }
};

const MODULE_PATTERNS = {
  sales: ["sale", "sale_management", "sale_subscription"],
  purchase: ["purchase", "purchase_requisition", "purchase_stock"],
  inventory: ["stock", "stock_account", "stock_landed_costs"],
  manufacturing: ["mrp", "mrp_subcontracting", "mrp_workorder"],
  accounting: ["account", "account_accountant", "account_payment"],
  crm: ["crm", "crm_enterprise"],
  pos: ["point_of_sale", "pos_hr", "pos_restaurant", "pos_loyalty"],
  website: ["website", "website_sale", "website_blog", "website_forum"],
  hr: ["hr", "hr_contract", "hr_expense", "hr_holidays", "hr_recruitment"],
  project: ["project", "project_timesheet_synchro", "project_forecast"],
  maintenance: ["maintenance"],
  quality: ["quality", "quality_control", "quality_mrp"],
  plm: ["mrp_plm"],
  fleet: ["fleet"],
  rental: ["sale_renting"],
  subscription: ["sale_subscription"],
  field_service: ["industry_fsm"]
};

// Exported internal functions for testing
export async function detectVersionFromUrl(url) {
  const versionPatterns = [
    { pattern: /\/([0-9]+)\.[0-9]+\/web/, extract: (m) => m[1] },
    { pattern: /\/web\/([0-9]+)\.[0-9]+\//, extract: (m) => m[1] },
    { pattern: /odoo-([0-9]+)/, extract: (m) => m[1] },
    { pattern: /\/saas~([0-9]+)\//, extract: (m) => m[1] }
  ];

  for (const { pattern, extract } of versionPatterns) {
    const match = url.match(pattern);
    if (match) {
      const major = parseInt(extract(match), 10);
      return {
        version: major,
        major,
        source: "url_pattern",
        confidence: 0.8
      };
    }
  }

  return null;
}

export async function detectVersionFromMeta(url, normalizeUrlFn = normalizeUrl) {
  try {
    const response = await fetchWithTimeoutStatic(`${normalizeUrlFn(url)}/web/login`, { method: "GET" }, 10000);
    const html = await response.text();

    const patterns = [
      /<meta name="version" content="([0-9]+)\./,
      /Odoo\s+([0-9]+)\./,
      /data-oe-model="ir\.ui\.view"[^>]*data-oe-id="([0-9]+)"/,
      /odoo\.define\(['"]web\.web_client['"][^,]+\{[^}]*version\s*:\s*['"]([0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const major = parseInt(match[1], 10);
        return {
          version: major,
          major,
          source: "page_meta",
          confidence: 0.9
        };
      }
    }

    if (html.includes('odoo.__session_info__')) {
      const sessionMatch = html.match(/server_version_info:\s*\[\s*([0-9]+)/);
      if (sessionMatch) {
        const major = parseInt(sessionMatch[1], 10);
        return {
          version: major,
          major,
          source: "session_info",
          confidence: 0.95
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function detectVersionFromApi(url, credentials, normalizeUrlFn = normalizeUrl) {
  if (!credentials) return null;

  try {
    const response = await fetchWithTimeoutStatic(
      `${normalizeUrlFn(url)}/jsonrpc`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            service: "common",
            method: "version",
            args: []
          },
          id: Date.now()
        })
      },
      10000
    );

    const data = await response.json();

    if (data.result) {
      const version = data.result.server_version || data.result;
      const major = typeof version === "string"
        ? parseInt(version.split(".")[0], 10)
        : version;

      return {
        version: major,
        major,
        source: "api",
        confidence: 1.0,
        fullVersion: version
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function detectVersionFromLoginPage(url, normalizeUrlFn = normalizeUrl) {
  try {
    const response = await fetchWithTimeoutStatic(`${normalizeUrlFn(url)}/web/login`, { method: "GET" }, 10000);
    const html = await response.text();

    if (html.includes('odoo-19') || html.includes('Odoo 19') || html.includes('/saas~19/')) {
      return { version: 19, major: 19, source: "login_page_indicators", confidence: 0.7 };
    }

    if (html.includes('odoo-18') || html.includes('Odoo 18')) {
      return { version: 18, major: 18, source: "login_page_indicators", confidence: 0.7 };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function categorizeModules(modules) {
  const categorized = {};
  const moduleNames = modules.map(m => m.name);

  for (const [category, patterns] of Object.entries(MODULE_PATTERNS)) {
    const matches = [];

    for (const pattern of patterns) {
      const matching = moduleNames.filter(name =>
        name === pattern || name.startsWith(`${pattern}_`)
      );
      matches.push(...matching);
    }

    if (matches.length > 0) {
      categorized[category] = matches;
    }
  }

  categorized.other = moduleNames.filter(name =>
    !Object.values(MODULE_PATTERNS).flat().some(pattern =>
      name === pattern || name.startsWith(`${pattern}_`)
    )
  );

  return categorized;
}

export function generateRecommendations(deployment, version, modules) {
  const recommendations = [];

  if (!version.supported) {
    recommendations.push({
      type: "warning",
      message: `Odoo ${version.major} is not officially supported by this platform. Odoo 19 is recommended.`,
      priority: "high"
    });
  }

  if (deployment.type === DEPLOYMENT_TYPES.ODOO_SH) {
    recommendations.push({
      type: "info",
      message: "Odoo.sh detected. Ensure you have the correct branch selected.",
      priority: "medium"
    });
  }

  if (!modules.detected) {
    recommendations.push({
      type: "info",
      message: "Provide credentials to detect installed modules and get personalized setup recommendations.",
      priority: "low"
    });
  }

  return recommendations;
}

export function calculateConfidence(url, type) {
  const confidenceScores = {
    [DEPLOYMENT_TYPES.ODOO_ONLINE]: 0.9,
    [DEPLOYMENT_TYPES.ODOO_SH]: 0.95,
    [DEPLOYMENT_TYPES.ON_PREMISE]: 0.6
  };

  let score = confidenceScores[type] || 0.5;

  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    score = 0.95;
  }

  if (url.includes("test") || url.includes("demo")) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

export function normalizeUrl(url) {
  let normalized = url.trim();

  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`;
  }

  normalized = normalized.replace(/\/$/, "");
  normalized = normalized.replace(/\/web$/, "");
  normalized = normalized.replace(/\/web\/.*$/, "");

  return normalized;
}

export function validateVersion(detection) {
  const versionInfo = ODOO_VERSIONS[`V${detection.major}`];

  return {
    ...detection,
    supported: versionInfo?.supported || false,
    versionName: versionInfo?.name || `Odoo ${detection.major}`,
    recommendation: versionInfo?.supported
      ? "Supported version"
      : "Not supported. Please use Odoo 19."
  };
}

async function fetchWithTimeoutStatic(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: "cors",
      credentials: "omit"
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export function createAutoDetector(options = {}) {
  const {
    timeout = 10000,
    retryAttempts = 3,
    onDetectionComplete = () => {},
    onDetectionError = () => {}
  } = options;

  async function detectDeploymentType(url) {
    const patterns = {
      [DEPLOYMENT_TYPES.ODOO_ONLINE]: [
        /\.odoo\.com$/,
        /odoo\.com\/web/,
        /odoo\.com\/(?:web|odoo)\//
      ],
      [DEPLOYMENT_TYPES.ODOO_SH]: [
        /\.odoo\.sh$/,
        /odoo\.sh\//
      ],
      [DEPLOYMENT_TYPES.ON_PREMISE]: [
        /:\d{1,5}\/web/,
        /\/web\/database\//,
        /\/odoo\//
      ]
    };

    const normalizedUrl = normalizeUrl(url);

    for (const [type, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        if (regex.test(normalizedUrl)) {
          return {
            type,
            confidence: calculateConfidence(normalizedUrl, type),
            indicators: [regex.source]
          };
        }
      }
    }

    return {
      type: DEPLOYMENT_TYPES.ON_PREMISE,
      confidence: 0.3,
      indicators: ["default_assumption"],
      warning: "Could not confidently detect deployment type. Assuming on-premise."
    };
  }

  async function detectOdooVersion(url, credentials = null) {
    const detectionMethods = [
      { method: detectVersionFromMeta, priority: 1 },
      { method: detectVersionFromUrl, priority: 2 },
      { method: detectVersionFromApi, priority: 3 },
      { method: detectVersionFromLoginPage, priority: 4 }
    ];

    for (const { method } of detectionMethods.sort((a, b) => a.priority - b.priority)) {
      try {
        const result = await method(url, credentials);
        if (result && result.version) {
          return validateVersion(result);
        }
      } catch (error) {
        console.warn(`[AutoDetect] Version detection method failed: ${error.message}`);
      }
    }

    return {
      version: null,
      major: null,
      supported: false,
      error: "Could not detect Odoo version"
    };
  }

  async function detectInstalledModules(url, credentials) {
    if (!credentials || !credentials.database || !credentials.username || !credentials.password) {
      return {
        detected: false,
        modules: [],
        error: "Credentials required for module detection"
      };
    }

    try {
      const response = await fetchWithTimeout(
        `${normalizeUrl(url)}/jsonrpc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: {
              service: "object",
              method: "execute_kw",
              args: [
                credentials.database,
                credentials.username,
                credentials.password,
                "ir.module.module",
                "search_read",
                [
                  [["state", "=", "installed"]],
                  { fields: ["name", "state", "author", "version"] }
                ]
              ]
            },
            id: Date.now()
          })
        }
      );

      const data = await response.json();

      if (data.error) {
        return {
          detected: false,
          modules: [],
          error: data.error.message || "Failed to fetch modules"
        };
      }

      const modules = data.result || [];
      const categorized = categorizeModules(modules);

      return {
        detected: true,
        modules: modules.map(m => m.name),
        categorized,
        count: modules.length,
        raw: modules
      };
    } catch (error) {
      return {
        detected: false,
        modules: [],
        error: error.message
      };
    }
  }

  async function detectCompanyInfo(url, credentials) {
    if (!credentials) {
      return { detected: false, error: "Credentials required" };
    }

    try {
      const response = await fetchWithTimeout(
        `${normalizeUrl(url)}/jsonrpc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: {
              service: "object",
              method: "execute_kw",
              args: [
                credentials.database,
                credentials.username,
                credentials.password,
                "res.company",
                "search_read",
                [
                  [],
                  { fields: ["name", "country_id", "currency_id", "email", "phone"] }
                ]
              ]
            },
            id: Date.now()
          })
        }
      );

      const data = await response.json();

      if (data.result && data.result.length > 0) {
        const company = data.result[0];
        return {
          detected: true,
          company: {
            name: company.name,
            country: company.country_id?.[1] || null,
            countryId: company.country_id?.[0] || null,
            currency: company.currency_id?.[1] || null,
            currencyId: company.currency_id?.[0] || null,
            email: company.email,
            phone: company.phone
          }
        };
      }

      return { detected: false, error: "No company found" };
    } catch (error) {
      return { detected: false, error: error.message };
    }
  }

  async function detectUserCount(url, credentials) {
    if (!credentials) return { detected: false };

    try {
      const response = await fetchWithTimeout(
        `${normalizeUrl(url)}/jsonrpc`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: {
              service: "object",
              method: "execute_kw",
              args: [
                credentials.database,
                credentials.username,
                credentials.password,
                "res.users",
                "search_count",
                [[["active", "=", true]]]
              ]
            },
            id: Date.now()
          })
        }
      );

      const data = await response.json();

      return {
        detected: true,
        count: data.result || 0
      };
    } catch (error) {
      return { detected: false, error: error.message };
    }
  }

  async function fullDetection(url, credentials = null) {
    const startTime = Date.now();

    try {
      const [deployment, version, modules, company, users] = await Promise.all([
        detectDeploymentType(url),
        detectOdooVersion(url, credentials),
        detectInstalledModules(url, credentials),
        detectCompanyInfo(url, credentials),
        detectUserCount(url, credentials)
      ]);

      const result = {
        success: true,
        url: normalizeUrl(url),
        deployment,
        version,
        modules,
        company,
        users,
        detectionTime: Date.now() - startTime,
        timestamp: Date.now(),
        credentialsRequired: !modules.detected && !company.detected,
        recommendations: generateRecommendations(deployment, version, modules)
      };

      onDetectionComplete(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        url: normalizeUrl(url),
        error: error.message,
        detectionTime: Date.now() - startTime,
        timestamp: Date.now()
      };

      onDetectionError(errorResult);
      return errorResult;
    }
  }

  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        mode: "cors",
        credentials: "omit"
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  return {
    detectDeploymentType,
    detectOdooVersion,
    detectInstalledModules,
    detectCompanyInfo,
    detectUserCount,
    fullDetection,
    categorizeModules,
    validateVersion,
    normalizeUrl,
    DEPLOYMENT_TYPES,
    ODOO_VERSIONS,
    MODULE_PATTERNS
  };
}

export { DEPLOYMENT_TYPES, ODOO_VERSIONS, MODULE_PATTERNS };
