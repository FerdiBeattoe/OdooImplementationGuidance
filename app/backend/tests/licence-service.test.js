"use strict";

import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  createLicence,
  getLicence,
  getLicenceConfig,
  getPrice,
  getRemainingEarlyAdopterSlots,
  isDomainUnlocked,
  isEarlyAdopter,
  isLicenceActive,
} from "../licence-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_ROOT = path.resolve(__dirname, "tmp", `licence_service_${Date.now()}`);
const DATA_DIR = path.resolve(TEST_ROOT, "data");
const CONFIG_PATH = path.resolve(DATA_DIR, "licence-config.json");
const STORE_DIR = path.resolve(DATA_DIR, "licences");

const CLEAN_CONFIG = Object.freeze({
  currency: "USD",
  duration_days: 365,
  early_adopter_price: 249.5,
  standard_price: 499,
  early_adopter_limit: 20,
  early_adopter_count: 0,
});

before(async () => {
  process.env.LICENCE_DATA_DIR = DATA_DIR;
  process.env.LICENCE_CONFIG_PATH = CONFIG_PATH;
  process.env.LICENCE_STORE_DIR = STORE_DIR;
  await resetStorage();
});

after(async () => {
  delete process.env.LICENCE_DATA_DIR;
  delete process.env.LICENCE_CONFIG_PATH;
  delete process.env.LICENCE_STORE_DIR;
  await rm(TEST_ROOT, { recursive: true, force: true });
});

beforeEach(async () => {
  await resetStorage();
});

async function resetStorage(overrides = {}) {
  await rm(TEST_ROOT, { recursive: true, force: true });
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(
    CONFIG_PATH,
    JSON.stringify({ ...CLEAN_CONFIG, ...overrides }, null, 2),
    "utf8"
  );
}

async function seedLicence(projectId, licence) {
  await mkdir(STORE_DIR, { recursive: true });
  const safeProjectId = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
  await writeFile(
    path.resolve(STORE_DIR, `${safeProjectId}.json`),
    JSON.stringify(licence, null, 2),
    "utf8"
  );
}

async function readConfigFile() {
  return JSON.parse(await readFile(CONFIG_PATH, "utf8"));
}

describe("licence-service", () => {
  test("getLicenceConfig returns the expected structure", async () => {
    assert.deepStrictEqual(await getLicenceConfig(), CLEAN_CONFIG);
  });

  test("getPrice always returns standard_price regardless of early adopter count", async () => {
    await resetStorage({ early_adopter_count: 19 });
    assert.strictEqual(await getPrice(), 499);
  });

  test("getPrice returns 499.00 when count >= 20", async () => {
    await resetStorage({ early_adopter_count: 20 });
    assert.strictEqual(await getPrice(), 499);
  });

  test("isEarlyAdopter returns the correct boolean", async () => {
    await resetStorage({ early_adopter_count: 19 });
    assert.strictEqual(await isEarlyAdopter(), true);

    await resetStorage({ early_adopter_count: 20 });
    assert.strictEqual(await isEarlyAdopter(), false);
  });

  test("getRemainingEarlyAdopterSlots returns 20 minus count", async () => {
    await resetStorage({ early_adopter_count: 6 });
    assert.strictEqual(await getRemainingEarlyAdopterSlots(), 14);
  });

  test("createLicence increments the early adopter counter correctly", async () => {
    const licence = await createLicence("test236", "stripe_pi_test236");
    const config = await readConfigFile();

    assert.strictEqual(licence.project_id, "test236");
    assert.strictEqual(licence.price_paid, 499);
    assert.strictEqual(licence.early_adopter, true);
    assert.strictEqual(licence.early_adopter_slot, 1);
    assert.strictEqual(config.early_adopter_count, 1);
    assert.deepStrictEqual(await getLicence("test236"), licence);
  });

  test("isLicenceActive returns false for an expired licence", async () => {
    await seedLicence("expired-proj", {
      project_id: "expired-proj",
      licence_id: "expired-licence-id",
      created_at: "2026-01-01T00:00:00.000Z",
      expires_at: "2026-01-02T00:00:00.000Z",
      price_paid: 249.5,
      early_adopter: true,
      early_adopter_slot: 1,
      payment_intent_id: "stripe_pi_expired",
      payment_status: "paid",
      tier: "paid",
      domains_unlocked: "all",
    });

    assert.strictEqual(await isLicenceActive("expired-proj"), false);
  });

  test("isDomainUnlocked returns true for foundation domains always", async () => {
    assert.strictEqual(await isDomainUnlocked("no-licence-project", "foundation"), true);
    assert.strictEqual(await isDomainUnlocked("no-licence-project", "users_roles"), true);
    assert.strictEqual(await isDomainUnlocked("no-licence-project", "master_data"), true);
  });

  test("isDomainUnlocked returns false for CRM without a licence", async () => {
    assert.strictEqual(await isDomainUnlocked("no-licence-project", "crm"), false);
  });
});
