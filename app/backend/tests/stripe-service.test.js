"use strict";

import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { confirmPayment, createPaymentIntent } from "../stripe-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_ROOT = path.resolve(__dirname, "tmp", `stripe_service_${Date.now()}`);
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
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await resetStorage();
});

after(async () => {
  delete process.env.LICENCE_DATA_DIR;
  delete process.env.LICENCE_CONFIG_PATH;
  delete process.env.LICENCE_STORE_DIR;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await rm(TEST_ROOT, { recursive: true, force: true });
});

beforeEach(async () => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await resetStorage();
});

async function resetStorage() {
  await rm(TEST_ROOT, { recursive: true, force: true });
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(CLEAN_CONFIG, null, 2), "utf8");
}

describe("stripe-service mock mode", () => {
  test("createPaymentIntent returns a mock response without STRIPE_SECRET_KEY", async () => {
    const result = await createPaymentIntent("mock-project");

    assert.strictEqual(result.client_secret, "mock_secret_test");
    assert.strictEqual(result.price, 499);
    assert.strictEqual(result.early_adopter, true);
    assert.strictEqual(result.remaining_slots, 20);
    assert.strictEqual(result.mock, true);
  });

  test("confirmPayment returns succeeded without STRIPE_SECRET_KEY", async () => {
    const result = await confirmPayment("mock_pi_123");

    assert.strictEqual(result.id, "mock_pi_123");
    assert.strictEqual(result.status, "succeeded");
    assert.strictEqual(result.mock, true);
  });
});
