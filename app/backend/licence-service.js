import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_DIR = path.resolve(__dirname, "data");
const DEFAULT_CONFIG = Object.freeze({
  currency: "USD",
  duration_days: 183,
  early_adopter_price: 249.5,
  standard_price: 499.0,
  early_adopter_limit: 20,
  early_adopter_count: 0,
});

export const FOUNDATION_DOMAINS = Object.freeze([
  "foundation",
  "users_roles",
  "master_data",
]);

const CHECKPOINT_PREFIX_DOMAIN_MAP = Object.freeze({
  FND: "foundation",
  USR: "users_roles",
  MAS: "master_data",
  CRM: "crm",
  SAL: "sales",
  PUR: "purchase",
  INV: "inventory",
  MRP: "manufacturing",
  PLM: "plm",
  ACCT: "accounting",
  POS: "pos",
  WEB: "website_ecommerce",
  PRJ: "projects",
  HR: "hr",
  QUA: "quality",
  MNT: "maintenance",
  REP: "repairs",
  DOC: "documents",
  SGN: "sign",
  APR: "approvals",
  SUB: "subscriptions",
  RNT: "rental",
  FSV: "field_service",
});

function getDataDir() {
  const customDataDir = process.env.LICENCE_DATA_DIR;
  return customDataDir ? path.resolve(customDataDir) : DEFAULT_DATA_DIR;
}

function getConfigPath() {
  const customConfigPath = process.env.LICENCE_CONFIG_PATH;
  return customConfigPath
    ? path.resolve(customConfigPath)
    : path.resolve(getDataDir(), "licence-config.json");
}

function getLicenceStoreDir() {
  const customStoreDir = process.env.LICENCE_STORE_DIR;
  return customStoreDir
    ? path.resolve(customStoreDir)
    : path.resolve(getDataDir(), "licences");
}

function normalizeDomainId(domainId) {
  if (typeof domainId !== "string") {
    return null;
  }

  const normalized = domainId.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "" ? null : normalized;
}

function normalizeConfig(config) {
  const candidate = config && typeof config === "object" && !Array.isArray(config)
    ? config
    : {};

  return {
    currency: typeof candidate.currency === "string" && candidate.currency.trim() !== ""
      ? candidate.currency.trim().toUpperCase()
      : DEFAULT_CONFIG.currency,
    duration_days: normalizeNumber(candidate.duration_days, DEFAULT_CONFIG.duration_days),
    early_adopter_price: normalizeNumber(candidate.early_adopter_price, DEFAULT_CONFIG.early_adopter_price),
    standard_price: normalizeNumber(candidate.standard_price, DEFAULT_CONFIG.standard_price),
    early_adopter_limit: Math.max(0, Math.trunc(normalizeNumber(candidate.early_adopter_limit, DEFAULT_CONFIG.early_adopter_limit))),
    early_adopter_count: Math.max(0, Math.trunc(normalizeNumber(candidate.early_adopter_count, DEFAULT_CONFIG.early_adopter_count))),
  };
}

function normalizeNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function sanitizeProjectId(projectId) {
  if (typeof projectId !== "string") {
    return null;
  }

  const trimmed = projectId.trim();
  return trimmed === "" ? null : trimmed;
}

function buildLicencePath(projectId) {
  const safeProjectId = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
  return path.resolve(getLicenceStoreDir(), `${safeProjectId}.json`);
}

async function ensureLicenceStorage() {
  const configPath = getConfigPath();
  await mkdir(path.dirname(configPath), { recursive: true });
  await mkdir(getLicenceStoreDir(), { recursive: true });

  try {
    await readFile(configPath, "utf8");
  } catch {
    await writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
  }
}

async function writeConfig(config) {
  const normalized = normalizeConfig(config);
  await ensureLicenceStorage();
  await writeFile(getConfigPath(), JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

async function writeLicence(projectId, licence) {
  await ensureLicenceStorage();
  await writeFile(buildLicencePath(projectId), JSON.stringify(licence, null, 2), "utf8");
  return licence;
}

function calculateExpiryDate(durationDays) {
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

export function getDomainIdFromCheckpointId(checkpointId) {
  if (typeof checkpointId !== "string" || checkpointId.trim() === "") {
    return null;
  }

  const prefix = checkpointId.trim().split("-")[0]?.toUpperCase();
  return CHECKPOINT_PREFIX_DOMAIN_MAP[prefix] ?? null;
}

export async function getLicenceConfig() {
  await ensureLicenceStorage();
  try {
    const raw = await readFile(getConfigPath(), "utf8");
    return normalizeConfig(JSON.parse(raw));
  } catch {
    const resetConfig = await writeConfig(DEFAULT_CONFIG);
    return resetConfig;
  }
}

export async function getPrice() {
  const config = await getLicenceConfig();
  return config.standard_price;
}

export async function isEarlyAdopter() {
  const config = await getLicenceConfig();
  return config.early_adopter_count < config.early_adopter_limit;
}

export async function getRemainingEarlyAdopterSlots() {
  const config = await getLicenceConfig();
  return Math.max(0, config.early_adopter_limit - config.early_adopter_count);
}

export async function createLicence(projectId, paymentIntentId) {
  const normalizedProjectId = sanitizeProjectId(projectId);
  if (!normalizedProjectId) {
    throw new Error("projectId is required.");
  }

  const normalizedPaymentIntentId = typeof paymentIntentId === "string" && paymentIntentId.trim() !== ""
    ? paymentIntentId.trim()
    : null;
  if (!normalizedPaymentIntentId) {
    throw new Error("paymentIntentId is required.");
  }

  const existingLicence = await getLicence(normalizedProjectId);
  if (existingLicence?.payment_intent_id === normalizedPaymentIntentId) {
    return existingLicence;
  }

  const config = await getLicenceConfig();
  const currentPrice = existingLicence?.price_paid ?? await getPrice();

  let earlyAdopter = false;
  let earlyAdopterSlot = null;
  let nextEarlyAdopterCount = config.early_adopter_count;

  if (existingLicence) {
    earlyAdopter = existingLicence.early_adopter === true;
    earlyAdopterSlot = Number.isInteger(existingLicence.early_adopter_slot)
      ? existingLicence.early_adopter_slot
      : null;
  } else if (config.early_adopter_count < config.early_adopter_limit) {
    earlyAdopter = true;
    earlyAdopterSlot = config.early_adopter_count + 1;
    nextEarlyAdopterCount = earlyAdopterSlot;
  }

  const now = new Date().toISOString();
  const licence = {
    project_id: normalizedProjectId,
    licence_id: randomUUID(),
    created_at: now,
    expires_at: calculateExpiryDate(config.duration_days),
    price_paid: currentPrice,
    early_adopter: earlyAdopter,
    early_adopter_slot: earlyAdopterSlot,
    payment_intent_id: normalizedPaymentIntentId,
    payment_status: "paid",
    tier: "paid",
    domains_unlocked: "all",
  };

  await writeLicence(normalizedProjectId, licence);

  if (!existingLicence && earlyAdopter) {
    await writeConfig({
      ...config,
      early_adopter_count: nextEarlyAdopterCount,
    });
  }

  return licence;
}

export async function getLicence(projectId) {
  const normalizedProjectId = sanitizeProjectId(projectId);
  if (!normalizedProjectId) {
    return null;
  }

  try {
    const raw = await readFile(buildLicencePath(normalizedProjectId), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function isLicenceActive(projectId) {
  const licence = await getLicence(projectId);
  if (!licence || typeof licence.expires_at !== "string") {
    return false;
  }

  return Date.parse(licence.expires_at) > Date.now();
}

export async function isDomainUnlocked(projectId, domainId) {
  const normalizedDomainId = normalizeDomainId(domainId);
  if (!normalizedDomainId) {
    return true;
  }

  if (FOUNDATION_DOMAINS.includes(normalizedDomainId)) {
    return true;
  }

  return isLicenceActive(projectId);
}

export async function getLicenceStatus(projectId) {
  const licence = await getLicence(projectId);
  const active = await isLicenceActive(projectId);

  return {
    active,
    tier: licence?.tier ?? "free",
    expires_at: licence?.expires_at ?? null,
    price_paid: licence?.price_paid ?? null,
    early_adopter: licence?.early_adopter === true,
    domains_unlocked: active ? licence?.domains_unlocked ?? "all" : [...FOUNDATION_DOMAINS],
  };
}
