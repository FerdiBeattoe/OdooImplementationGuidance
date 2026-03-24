import test from "node:test";
import assert from "node:assert/strict";
import { createRollbackEngine, TRANSACTION_STATES, OPERATION_TYPES } from "./RollbackEngine.js";

test("createRollbackEngine - snapshot creation", () => {
  const engine = createRollbackEngine();
  const data = { users: [{ id: 1, name: "Test" }] };
  const snapshot = engine.createSnapshot(data, { description: "Test snapshot" });

  assert.ok(snapshot.id, "Snapshot should have an ID");
  assert.ok(snapshot.id.startsWith("snap_"), "ID should start with snap_");
  assert.deepEqual(snapshot.data, data, "Data should match");
  assert.ok(snapshot.timestamp, "Timestamp should exist");
  assert.equal(snapshot.metadata.description, "Test snapshot", "Description should match");
});

test("createRollbackEngine - retrieve snapshot by ID", () => {
  const engine = createRollbackEngine();
  const data = { config: { setting: "value" } };
  const snapshot = engine.createSnapshot(data);

  const retrieved = engine.getSnapshotById(snapshot.id);
  assert.deepEqual(retrieved, snapshot, "Retrieved snapshot should match");
});

test("createRollbackEngine - return null for non-existent snapshot", () => {
  const engine = createRollbackEngine();
  const retrieved = engine.getSnapshotById("snap_nonexistent");
  assert.equal(retrieved, null, "Should return null for non-existent snapshot");
});

test("createRollbackEngine - get latest snapshot", () => {
  const engine = createRollbackEngine();
  engine.createSnapshot({ version: 1 });
  engine.createSnapshot({ version: 2 });
  const latest = engine.createSnapshot({ version: 3 });

  assert.deepEqual(engine.getLatestSnapshot(), latest, "Should return latest snapshot");
});

test("createRollbackEngine - limit snapshots to maxSnapshots", async () => {
  const engine = createRollbackEngine({ maxSnapshots: 3 });

  engine.createSnapshot({ id: 1 });
  await new Promise(r => setTimeout(r, 5));
  engine.createSnapshot({ id: 2 });
  await new Promise(r => setTimeout(r, 5));
  engine.createSnapshot({ id: 3 });
  await new Promise(r => setTimeout(r, 5));
  engine.createSnapshot({ id: 4 });

  const snapshots = engine.getSnapshots();
  assert.equal(snapshots.length, 3, "Should limit to 3 snapshots");
  // After clearing old ones, we keep the 3 most recent: 2, 3, 4
  // But since we're at capacity, oldest (1) is removed when we add 4
  const ids = snapshots.map(s => s.data.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [2, 3, 4], "Should keep the 3 most recent");
});

test("createRollbackEngine - filter snapshots by tag", () => {
  const engine = createRollbackEngine();
  engine.createSnapshot({ data: 1 }, { tags: ["pre-config"] });
  engine.createSnapshot({ data: 2 }, { tags: ["post-config"] });
  engine.createSnapshot({ data: 3 }, { tags: ["pre-config"] });

  const preConfig = engine.getSnapshots({ tag: "pre-config" });
  assert.equal(preConfig.length, 2, "Should have 2 pre-config snapshots");
});

test("createRollbackEngine - begin transaction", () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test transaction");
  assert.ok(txnId.startsWith("txn_"), "Transaction ID should start with txn_");
});

test("createRollbackEngine - throw if starting transaction when one is active", () => {
  const engine = createRollbackEngine();
  engine.beginTransaction("First");
  assert.throws(() => engine.beginTransaction("Second"), /Transaction already in progress/);
});

test("createRollbackEngine - register operations within transaction", () => {
  const engine = createRollbackEngine();
  engine.beginTransaction("Test");
  const opId = engine.registerOperation({
    type: OPERATION_TYPES.CREATE,
    target: "res.users",
    previousState: null,
    newState: { id: 1, name: "New User" }
  });

  assert.ok(opId.startsWith("op_"), "Operation ID should start with op_");
});

test("createRollbackEngine - throw if registering operation without active transaction", () => {
  const engine = createRollbackEngine();
  assert.throws(() => engine.registerOperation({
    type: OPERATION_TYPES.CREATE,
    target: "test"
  }), /No active transaction/);
});

test("createRollbackEngine - commit transaction", async () => {
  const engine = createRollbackEngine();
  engine.beginTransaction("Test");
  engine.registerOperation({
    type: OPERATION_TYPES.UPDATE,
    target: "res.company",
    previousState: { name: "Old" },
    newState: { name: "New" }
  });

  const committed = await engine.commitTransaction();
  assert.equal(committed.state, TRANSACTION_STATES.COMMITTED, "Should be committed");
  assert.equal(committed.operations.length, 1, "Should have 1 operation");
});

test("createRollbackEngine - rollback CREATE operation", async () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test");
  engine.registerOperation({
    type: OPERATION_TYPES.CREATE,
    target: "res.users,1",
    previousState: null,
    newState: { id: 1, name: "Test" }
  });
  await engine.commitTransaction();

  const result = await engine.rollbackTransaction(txnId);
  assert.equal(result.success, true, "Rollback should succeed");
  assert.equal(result.rolledBack, 1, "Should rollback 1 operation");
});

test("createRollbackEngine - rollback UPDATE operation", async () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test");
  engine.registerOperation({
    type: OPERATION_TYPES.UPDATE,
    target: "res.company,1",
    previousState: { name: "Old Name" },
    newState: { name: "New Name" }
  });
  await engine.commitTransaction();

  const result = await engine.rollbackTransaction(txnId);
  assert.equal(result.success, true, "Rollback should succeed");
});

test("createRollbackEngine - rollback DELETE operation", async () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test");
  engine.registerOperation({
    type: OPERATION_TYPES.DELETE,
    target: "res.users,5",
    previousState: { id: 5, name: "Deleted User" },
    newState: null
  });
  await engine.commitTransaction();

  const result = await engine.rollbackTransaction(txnId);
  assert.equal(result.success, true, "Rollback should succeed");
});

test("createRollbackEngine - rollback ENABLE_MODULE operation", async () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test");
  engine.registerOperation({
    type: OPERATION_TYPES.ENABLE_MODULE,
    target: "sale_management",
    previousState: { state: "uninstalled" },
    newState: { state: "installed" }
  });
  await engine.commitTransaction();

  const result = await engine.rollbackTransaction(txnId);
  assert.equal(result.success, true, "Rollback should succeed");
});

test("createRollbackEngine - rollback to specific snapshot", async () => {
  const engine = createRollbackEngine();
  const originalData = { company: { name: "Original" } };
  const snapshot = engine.createSnapshot(originalData);

  const restoreFn = async (data) => {
    assert.deepEqual(data, originalData, "Should restore original data");
    return true;
  };
  const result = await engine.rollbackToSnapshot(snapshot.id, restoreFn);

  assert.equal(result.success, true, "Rollback should succeed");
});

test("createRollbackEngine - fail rollback for non-existent snapshot", async () => {
  const engine = createRollbackEngine();
  const restoreFn = async () => true;

  await assert.rejects(
    engine.rollbackToSnapshot("snap_nonexistent", restoreFn),
    /not found/
  );
});

test("createRollbackEngine - get transaction status", async () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test");
  engine.registerOperation({ type: OPERATION_TYPES.CREATE, target: "test" });
  await engine.commitTransaction();

  const status = engine.getTransactionStatus(txnId);
  assert.notEqual(status, null, "Status should not be null");
  assert.equal(status.transactionId, txnId, "Transaction ID should match");
  assert.equal(status.totalOperations, 1, "Should have 1 operation");
});

test("createRollbackEngine - get operation log with filters", () => {
  const engine = createRollbackEngine();
  engine.beginTransaction("Txn1");
  engine.registerOperation({ type: OPERATION_TYPES.CREATE, target: "users" });
  engine.registerOperation({ type: OPERATION_TYPES.UPDATE, target: "company" });
  engine.commitTransaction();

  const allOps = engine.getOperationLog();
  assert.equal(allOps.length, 2, "Should have 2 operations");

  const createOps = engine.getOperationLog({ type: OPERATION_TYPES.CREATE });
  assert.equal(createOps.length, 1, "Should have 1 CREATE operation");
});

test("createRollbackEngine - check if operation can be rolled back", async () => {
  const engine = createRollbackEngine();
  const txnId = engine.beginTransaction("Test");
  const op = engine.registerOperation({ type: OPERATION_TYPES.CREATE, target: "test" });
  await engine.commitTransaction();

  assert.equal(engine.canRollback(op), true, "Should be able to rollback");

  await engine.rollbackTransaction(txnId);
  assert.equal(engine.canRollback(op), false, "Should not be able to rollback after rollback");
});

test("createRollbackEngine - get rollback instructions", async () => {
  const engine = createRollbackEngine();
  engine.beginTransaction("Test");
  const op = engine.registerOperation({
    type: OPERATION_TYPES.UPDATE,
    target: "res.company,1"
  });
  await engine.commitTransaction();

  const instructions = engine.getRollbackInstructions(op);
  assert.notEqual(instructions, null, "Instructions should not be null");
  assert.equal(instructions.rollbackAction, "Restore previous values", "Action should match");
});

test("createRollbackEngine - clear all history", () => {
  const engine = createRollbackEngine();
  engine.createSnapshot({ data: 1 });
  engine.beginTransaction("Test");
  engine.registerOperation({ type: OPERATION_TYPES.CREATE, target: "test" });
  engine.commitTransaction();

  engine.clearHistory();

  assert.equal(engine.getSnapshots().length, 0, "Should have no snapshots");
  assert.equal(engine.getOperationLog().length, 0, "Should have no operations");
});

test("createRollbackEngine - keep last N snapshots when clearing", async () => {
  const engine = createRollbackEngine();
  engine.createSnapshot({ id: 1 });
  await new Promise(r => setTimeout(r, 5));
  engine.createSnapshot({ id: 2 });
  await new Promise(r => setTimeout(r, 5));
  engine.createSnapshot({ id: 3 });
  await new Promise(r => setTimeout(r, 5));
  engine.createSnapshot({ id: 4 });

  engine.clearHistory(2);

  const remaining = engine.getSnapshots().map(s => s.data.id).sort((a, b) => a - b);
  assert.equal(remaining.length, 2, "Should keep 2 snapshots");
  assert.deepEqual(remaining, [3, 4], "Should keep the 2 most recent");
});

test("createRollbackEngine - deep clone objects in snapshots", () => {
  const engine = createRollbackEngine();
  const original = { nested: { value: "original" } };
  const snapshot = engine.createSnapshot(original);

  original.nested.value = "modified";

  assert.equal(snapshot.data.nested.value, "original", "Snapshot should not be affected by changes");
});

test("createRollbackEngine - deep clone arrays", () => {
  const engine = createRollbackEngine();
  const original = [{ id: 1 }, { id: 2 }];
  const snapshot = engine.createSnapshot(original);

  original[0].id = 999;

  assert.equal(snapshot.data[0].id, 1, "Array element should not be affected");
});

test("createRollbackEngine - handle Date objects", () => {
  const engine = createRollbackEngine();
  const date = new Date("2024-01-01");
  const snapshot = engine.createSnapshot({ date });

  assert.ok(snapshot.data.date instanceof Date, "Should preserve Date instance");
  assert.equal(snapshot.data.date.getTime(), date.getTime(), "Should preserve timestamp");
});

test("createRollbackEngine - onSnapshotCreate callback", () => {
  let callbackCalled = false;
  let callbackSnapshot = null;

  const engine = createRollbackEngine({
    onSnapshotCreate: (snapshot) => {
      callbackCalled = true;
      callbackSnapshot = snapshot;
    }
  });

  const snapshot = engine.createSnapshot({ test: true });

  assert.equal(callbackCalled, true, "Callback should be called");
  assert.equal(callbackSnapshot.id, snapshot.id, "Callback should receive snapshot");
});

test("createRollbackEngine - onRollback callback", async () => {
  let callbackCalled = false;
  let callbackInfo = null;

  const engine = createRollbackEngine({
    onRollback: (info) => {
      callbackCalled = true;
      callbackInfo = info;
    }
  });

  const txnId = engine.beginTransaction("Test");
  engine.registerOperation({ type: OPERATION_TYPES.CREATE, target: "test" });
  await engine.commitTransaction();
  await engine.rollbackTransaction(txnId);

  assert.equal(callbackCalled, true, "Callback should be called");
  assert.ok(callbackInfo, "Callback should receive info");
});
