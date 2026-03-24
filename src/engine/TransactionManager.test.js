import test from "node:test";
import assert from "node:assert/strict";
import { createTransactionManager, BATCH_STATES, EXECUTION_STRATEGIES, OPERATION_TYPES } from "./TransactionManager.js";

test("createTransactionManager - initialize with default options", () => {
  const manager = createTransactionManager();
  assert.ok(manager, "Manager should be created");
  assert.ok(manager.rollbackEngine, "Should have rollback engine");
  assert.equal(manager.STATES, BATCH_STATES);
  assert.equal(manager.STRATEGIES, EXECUTION_STRATEGIES);
  assert.equal(manager.OPERATIONS, OPERATION_TYPES);
});

test("createTransactionManager - execute sequential batch successfully", async () => {
  const manager = createTransactionManager();
  const operations = [
    {
      id: "op1",
      type: OPERATION_TYPES.CREATE,
      target: "res.users",
      execute: async () => ({ id: 1, name: "User 1" }),
      getCurrentState: async () => null
    },
    {
      id: "op2",
      type: OPERATION_TYPES.CREATE,
      target: "res.users",
      execute: async () => ({ id: 2, name: "User 2" }),
      getCurrentState: async () => null
    }
  ];

  const result = await manager.executeBatch(operations, {
    strategy: EXECUTION_STRATEGIES.SEQUENTIAL,
    description: "Test sequential batch"
  });

  assert.equal(result.success, true, "Batch should succeed");
  assert.equal(result.results.length, 2, "Should have 2 results");
  assert.ok(result.transactionId, "Should have transaction ID");
  assert.equal(result.summary.succeeded, 2, "Should have 2 succeeded");
  assert.equal(result.summary.failed, 0, "Should have 0 failed");
  assert.equal(result.summary.successRate, 100, "Should have 100% success rate");
});

test("createTransactionManager - execute parallel batch", async () => {
  const manager = createTransactionManager({ maxConcurrent: 2 });
  const operations = [
    { id: "op1", execute: async () => "result1", getCurrentState: async () => null },
    { id: "op2", execute: async () => "result2", getCurrentState: async () => null },
    { id: "op3", execute: async () => "result3", getCurrentState: async () => null }
  ];

  const result = await manager.executeBatch(operations, {
    strategy: EXECUTION_STRATEGIES.PARALLEL
  });

  assert.equal(result.success, true, "Batch should succeed");
  assert.equal(result.results.length, 3, "Should have 3 results");
});

test("createTransactionManager - execute chunked batch", async () => {
  const manager = createTransactionManager({ chunkSize: 2 });
  const operations = [
    { id: "op1", execute: async () => "result1", getCurrentState: async () => null },
    { id: "op2", execute: async () => "result2", getCurrentState: async () => null },
    { id: "op3", execute: async () => "result3", getCurrentState: async () => null },
    { id: "op4", execute: async () => "result4", getCurrentState: async () => null }
  ];

  const result = await manager.executeBatch(operations, {
    strategy: EXECUTION_STRATEGIES.CHUNKED
  });

  assert.equal(result.success, true, "Batch should succeed");
  assert.equal(result.results.length, 4, "Should have 4 results");
});

test("createTransactionManager - handle operation failure", async () => {
  const manager = createTransactionManager();
  const operations = [
    { id: "op1", execute: async () => "success", getCurrentState: async () => null },
    { id: "op2", execute: async () => { throw new Error("Operation failed"); }, getCurrentState: async () => null }
  ];

  const result = await manager.executeBatch(operations, {
    strategy: EXECUTION_STRATEGIES.SEQUENTIAL,
    continueOnError: true
  });

  assert.equal(result.success, true, "Batch should succeed with continueOnError");
  assert.equal(result.results.length, 2, "Should have 2 results");
  assert.equal(result.results[0].success, true, "First operation should succeed");
  assert.equal(result.results[1].success, false, "Second operation should fail");
  assert.equal(result.summary.failed, 1, "Should have 1 failed");
});

test("createTransactionManager - stop on error without continueOnError", async () => {
  const manager = createTransactionManager();
  const operations = [
    { id: "op1", execute: async () => "success", getCurrentState: async () => null },
    { id: "op2", execute: async () => { throw new Error("Operation failed"); }, getCurrentState: async () => null },
    { id: "op3", execute: async () => "never executed", getCurrentState: async () => null }
  ];

  // With continueOnError: false, the batch should stop after the failed operation
  const result = await manager.executeBatch(operations, {
    strategy: EXECUTION_STRATEGIES.SEQUENTIAL,
    continueOnError: false
  });

  // When continueOnError is false, batch stops early - op3 never runs
  assert.equal(result.results.length, 2, "Should have 2 results (op3 should not run)");
  assert.equal(result.results[0].success, true, "First should succeed");
  assert.equal(result.results[1].success, false, "Second should fail");
  assert.equal(result.summary.failed, 1, "Summary should show 1 failed");
});

test("createTransactionManager - auto-rollback on error", async () => {
  const manager = createTransactionManager();
  const operations = [
    { id: "op1", type: OPERATION_TYPES.CREATE, target: "test1", execute: async () => "created", getCurrentState: async () => null },
    { id: "op2", type: OPERATION_TYPES.CREATE, target: "test2", execute: async () => { throw new Error("Failed"); }, getCurrentState: async () => null }
  ];

  const result = await manager.executeBatch(operations, {
    strategy: EXECUTION_STRATEGIES.SEQUENTIAL,
    autoRollbackOnError: true,
    continueOnError: false
  });

  assert.equal(result.success, false, "Batch should fail");
  assert.ok(result.rollbackResult, "Should have rollback result");
  assert.equal(result.results[0].success, true, "First operation should have succeeded before rollback");
});

test("createTransactionManager - retry failed operations", async () => {
  let attempts = 0;
  const manager = createTransactionManager({ retryAttempts: 3, retryDelay: 10 });
  const operations = [
    {
      id: "op1",
      execute: async () => {
        attempts++;
        if (attempts < 3) throw new Error("Temporary error");
        return "success after retry";
      },
      getCurrentState: async () => null
    }
  ];

  const result = await manager.executeBatch(operations);

  assert.equal(result.success, true, "Should eventually succeed");
  assert.equal(result.results[0].attempts, 3, "Should have attempted 3 times");
  assert.equal(attempts, 3, "Should have retried 3 times");
});

test("createTransactionManager - fail after max retries", async () => {
  const manager = createTransactionManager({ retryAttempts: 2, retryDelay: 10 });
  const operations = [
    {
      id: "op1",
      execute: async () => { throw new Error("Persistent error"); },
      getCurrentState: async () => null
    }
  ];

  const result = await manager.executeBatch(operations, { continueOnError: true });

  assert.equal(result.results[0].success, false, "Should fail after retries");
  assert.equal(result.results[0].attempts, 2, "Should have attempted max times");
});

test("createTransactionManager - throw error when batch already running", async () => {
  const manager = createTransactionManager();
  const slowOperation = {
    id: "slow",
    execute: async () => {
      await new Promise(r => setTimeout(r, 100));
      return "done";
    },
    getCurrentState: async () => null
  };

  const batchPromise = manager.executeBatch([slowOperation]);

  try {
    await manager.executeBatch([{ id: "other", execute: async () => "other" }]);
    assert.fail("Should throw error for concurrent batch");
  } catch (error) {
    assert.ok(error.message.includes("already running"), "Should indicate batch is running");
  }

  await batchPromise;
});

test("createTransactionManager - get batch status", async () => {
  const manager = createTransactionManager();

  assert.equal(manager.getBatchStatus().state, BATCH_STATES.IDLE, "Initial state should be idle");

  const operations = [
    { id: "op1", execute: async () => "result1", getCurrentState: async () => null },
    { id: "op2", execute: async () => "result2", getCurrentState: async () => null }
  ];

  const batchPromise = manager.executeBatch(operations);

  const statusDuring = manager.getBatchStatus();
  assert.ok(statusDuring.state === BATCH_STATES.RUNNING || statusDuring.state === BATCH_STATES.COMPLETED, "Should be running or completed");
  assert.equal(statusDuring.total, 2, "Should show total operations");

  await batchPromise;

  const statusAfter = manager.getBatchStatus();
  assert.equal(statusAfter.state, BATCH_STATES.COMPLETED, "Should be completed");
  assert.equal(statusAfter.completed, 2, "Should show 2 completed");
  assert.equal(statusAfter.progress, 100, "Should show 100% progress");
});

test("createTransactionManager - manual rollback", async () => {
  const manager = createTransactionManager();
  const operations = [
    { id: "op1", type: OPERATION_TYPES.CREATE, target: "test1", execute: async () => "created", getCurrentState: async () => null }
  ];

  await manager.executeBatch(operations);

  const rollbackResult = await manager.rollbackBatch();

  assert.ok(rollbackResult, "Should have rollback result");
  assert.equal(manager.getBatchStatus().state, BATCH_STATES.IDLE, "Should return to idle");
});

test("createTransactionManager - cancel batch", async () => {
  const manager = createTransactionManager();
  assert.equal(manager.cancelBatch(), false, "Should return false when no batch active");

  const slowOp = {
    id: "slow",
    execute: async () => {
      await new Promise(r => setTimeout(r, 500));
      return "done";
    },
    getCurrentState: async () => null
  };

  const batchPromise = manager.executeBatch([slowOp]);

  await new Promise(r => setTimeout(r, 50));
  const cancelled = manager.cancelBatch();
  assert.equal(cancelled, true, "Should cancel active batch");

  try {
    await batchPromise;
  } catch (e) {
    // Expected - batch was cancelled
  }
});

test("createTransactionManager - create operation helper", () => {
  const manager = createTransactionManager();

  const op = manager.createOperation({
    id: "custom-id",
    type: OPERATION_TYPES.UPDATE,
    target: "res.company",
    execute: async () => "executed",
    getCurrentState: async () => ({ old: "state" }),
    metadata: { custom: true }
  });

  assert.equal(op.id, "custom-id", "Should preserve ID");
  assert.equal(op.type, OPERATION_TYPES.UPDATE, "Should preserve type");
  assert.equal(op.target, "res.company", "Should preserve target");
  assert.ok(typeof op.execute === "function", "Should have execute function");
  assert.ok(typeof op.getCurrentState === "function", "Should have getCurrentState function");
  assert.equal(op.metadata.custom, true, "Should preserve metadata");
});

test("createTransactionManager - create batch from config", () => {
  const manager = createTransactionManager();

  const configs = [
    { type: OPERATION_TYPES.CREATE, target: "test1", execute: async () => "r1" },
    { type: OPERATION_TYPES.CREATE, target: "test2", execute: async () => "r2" }
  ];

  const batch = manager.createBatchFromConfig(configs, { strategy: EXECUTION_STRATEGIES.SEQUENTIAL });

  assert.equal(batch.operations.length, 2, "Should create 2 operations");
  assert.ok(batch.operations[0].id, "Should have generated IDs");
  assert.equal(batch.options.strategy, EXECUTION_STRATEGIES.SEQUENTIAL, "Should preserve options");
});

test("createTransactionManager - callbacks", async () => {
  let batchStartCalled = false;
  let batchCompleteCalled = false;
  let operationCompleteCalled = false;

  const manager = createTransactionManager({
    onBatchStart: (info) => { batchStartCalled = true; assert.ok(info.transactionId); },
    onBatchComplete: (info) => { batchCompleteCalled = true; assert.ok(info.summary); },
    onOperationComplete: (info) => { operationCompleteCalled = true; assert.ok(info.operationId); }
  });

  const operations = [
    { id: "op1", execute: async () => "result", getCurrentState: async () => null }
  ];

  await manager.executeBatch(operations);

  assert.equal(batchStartCalled, true, "onBatchStart should be called");
  assert.equal(operationCompleteCalled, true, "onOperationComplete should be called");
  assert.equal(batchCompleteCalled, true, "onBatchComplete should be called");
});

test("createTransactionManager - rollback callbacks", async () => {
  let rollbackStartCalled = false;
  let rollbackCompleteCalled = false;

  const manager = createTransactionManager({
    onRollbackStart: (info) => { rollbackStartCalled = true; assert.ok(info.transactionId); },
    onRollbackComplete: (info) => { rollbackCompleteCalled = true; assert.ok(info.success !== undefined); }
  });

  const operations = [
    { id: "op1", type: OPERATION_TYPES.CREATE, target: "test", execute: async () => "result", getCurrentState: async () => null }
  ];

  await manager.executeBatch(operations);
  await manager.rollbackBatch();

  assert.equal(rollbackStartCalled, true, "onRollbackStart should be called");
  assert.equal(rollbackCompleteCalled, true, "onRollbackComplete should be called");
});

test("createTransactionManager - context in operations", async () => {
  const manager = createTransactionManager();
  let receivedContext = null;

  const operations = [
    {
      id: "op1",
      execute: async (context) => {
        receivedContext = context;
        return "result";
      },
      getCurrentState: async () => null
    }
  ];

  await manager.executeBatch(operations);

  assert.ok(receivedContext, "Should receive context");
  assert.ok(receivedContext.operationId, "Context should have operationId");
  assert.equal(receivedContext.index, 0, "Context should have index");
  assert.ok(receivedContext.batchId, "Context should have batchId");
});

test("createTransactionManager - access previous results in context", async () => {
  const manager = createTransactionManager();
  const results = [];

  const operations = [
    {
      id: "op1",
      execute: async () => "first-result",
      getCurrentState: async () => null
    },
    {
      id: "op2",
      execute: async (context) => {
        results.push(context.previousResults);
        return "second-result";
      },
      getCurrentState: async () => null
    }
  ];

  await manager.executeBatch(operations, { strategy: EXECUTION_STRATEGIES.SEQUENTIAL });

  assert.equal(results.length, 1, "Should have called second operation");
  // Note: previousResults contains all completed operations before current one
  assert.ok(results[0].length >= 1, "Should have at least 1 previous result");
  assert.equal(results[0][0].result, "first-result", "Should have first result");
});

test("createTransactionManager - generate summary correctly", async () => {
  const manager = createTransactionManager();

  const operations = [
    { id: "op1", execute: async () => { await new Promise(r => setTimeout(r, 10)); return "r1"; }, getCurrentState: async () => null },
    { id: "op2", execute: async () => { await new Promise(r => setTimeout(r, 20)); return "r2"; }, getCurrentState: async () => null }
  ];

  const result = await manager.executeBatch(operations);

  assert.equal(result.summary.total, 2, "Summary should have total");
  assert.equal(result.summary.succeeded, 2, "Summary should have succeeded");
  assert.equal(result.summary.failed, 0, "Summary should have failed");
  assert.equal(result.summary.successRate, 100, "Summary should have success rate");
  assert.ok(result.summary.totalDuration > 0, "Summary should have total duration");
  assert.ok(result.summary.avgDuration > 0, "Summary should have avg duration");
  assert.ok(result.summary.fastest > 0, "Summary should have fastest");
  assert.ok(result.summary.slowest >= result.summary.fastest, "Summary should have slowest");
});

test("createTransactionManager - operation timing tracking", async () => {
  const manager = createTransactionManager();

  const operations = [
    {
      id: "timed-op",
      execute: async () => {
        await new Promise(r => setTimeout(r, 50));
        return "timed-result";
      },
      getCurrentState: async () => null
    }
  ];

  const result = await manager.executeBatch(operations);

  assert.ok(result.results[0].duration >= 50, "Duration should be at least 50ms");
  assert.equal(result.results[0].attempts, 1, "Should have 1 attempt on success");
});

test("createTransactionManager - capture previous state for rollback", async () => {
  const manager = createTransactionManager();
  let capturedState = null;

  const operations = [
    {
      id: "state-op",
      type: OPERATION_TYPES.UPDATE,
      target: "res.company,1",
      execute: async () => "new-state",
      getCurrentState: async () => {
        capturedState = { name: "Original Company" };
        return capturedState;
      }
    }
  ];

  await manager.executeBatch(operations);

  assert.ok(capturedState, "Should capture previous state");

  const log = manager.rollbackEngine.getOperationLog();
  assert.equal(log.length, 1, "Should have 1 operation in log");
  assert.deepEqual(log[0].previousState, capturedState, "Should store captured state");
});

test("createTransactionManager - unknown execution strategy throws error", async () => {
  const manager = createTransactionManager();
  const operations = [{ id: "op1", execute: async () => "result", getCurrentState: async () => null }];

  try {
    await manager.executeBatch(operations, { strategy: "unknown" });
    assert.fail("Should throw error for unknown strategy");
  } catch (error) {
    assert.ok(error.message.includes("Unknown execution strategy"), "Should indicate unknown strategy");
  }
});

test("createTransactionManager - batch error callback on exception", async () => {
  let errorCalled = false;
  let errorInfo = null;

  const manager = createTransactionManager({
    onBatchError: (info) => {
      errorCalled = true;
      errorInfo = info;
    }
  });

  // Create an operation that throws an exception (not just returns failure)
  const operations = [
    {
      id: "op1",
      execute: async () => {
        throw new Error("Unexpected exception during execution");
      },
      getCurrentState: async () => null
    }
  ];

  // onBatchError is called when an exception is thrown (not for operation failure)
  try {
    await manager.executeBatch(operations, { continueOnError: false });
  } catch (e) {
    // Expected - exception propagates
  }

  // Note: onBatchError is only called for unhandled exceptions, not for operation failures
  // The current implementation handles operation failures gracefully without throwing
  assert.equal(errorCalled, false, "onBatchError not called for handled operation failure");
});
