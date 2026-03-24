import { createRollbackEngine, OPERATION_TYPES } from "./RollbackEngine.js";

const BATCH_STATES = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  FAILED: "failed",
  ROLLING_BACK: "rolling_back"
};

const EXECUTION_STRATEGIES = {
  SEQUENTIAL: "sequential",
  PARALLEL: "parallel",
  CHUNKED: "chunked"
};

class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function createTransactionManager(options = {}) {
  const {
    maxConcurrent = 3,
    chunkSize = 10,
    retryAttempts = 3,
    retryDelay = 1000,
    operationTimeout = 30000, // 30 seconds default
    onBatchStart = () => {},
    onBatchComplete = () => {},
    onBatchError = () => {},
    onOperationComplete = () => {},
    onRollbackStart = () => {},
    onRollbackComplete = () => {}
  } = options;

  const rollbackEngine = createRollbackEngine({
    maxSnapshots: 100,
    onSnapshotCreate: (snapshot) => {
      console.log(`[TransactionManager] Snapshot created: ${snapshot.id}`);
    },
    onRollback: (info) => {
      console.log(`[TransactionManager] Rollback executed: ${JSON.stringify(info)}`);
    }
  });

  let batchState = BATCH_STATES.IDLE;
  let currentBatch = null;
  let operationQueue = [];
  let completedOperations = [];
  let failedOperations = [];
  let operationCallbacks = new Map();

  async function executeBatch(operations, options = {}) {
    const {
      strategy = EXECUTION_STRATEGIES.SEQUENTIAL,
      continueOnError = false,
      autoRollbackOnError = false,
      description = "Batch operation",
      metadata = {}
    } = options;

    if (batchState === BATCH_STATES.RUNNING) {
      throw new Error("Another batch is already running. Wait for completion or cancel it.");
    }

    batchState = BATCH_STATES.RUNNING;
    operationQueue = [...operations];
    completedOperations = [];
    failedOperations = [];

    const transactionId = rollbackEngine.beginTransaction(description, metadata);

    currentBatch = {
      transactionId,
      strategy,
      continueOnError,
      autoRollbackOnError,
      totalOperations: operations.length,
      startTime: Date.now(),
      metadata
    };

    onBatchStart({
      transactionId,
      totalOperations: operations.length,
      strategy
    });

    try {
      let results;

      switch (strategy) {
        case EXECUTION_STRATEGIES.SEQUENTIAL:
          results = await executeSequential(operations, continueOnError);
          break;
        case EXECUTION_STRATEGIES.PARALLEL:
          results = await executeParallel(operations, continueOnError);
          break;
        case EXECUTION_STRATEGIES.CHUNKED:
          results = await executeChunked(operations, continueOnError, chunkSize);
          break;
        default:
          throw new Error(`Unknown execution strategy: ${strategy}`);
      }

      const allSucceeded = results.every(r => r.success);
      const hasFailures = results.some(r => !r.success);

      if (hasFailures && autoRollbackOnError) {
        batchState = BATCH_STATES.ROLLING_BACK;
        onRollbackStart({ transactionId, failedCount: failedOperations.length });

        const rollbackResult = await rollbackEngine.rollbackTransaction(transactionId);

        onRollbackComplete({
          transactionId,
          success: rollbackResult.success,
          rolledBack: rollbackResult.rolledBack,
          failed: rollbackResult.failed
        });

        batchState = BATCH_STATES.FAILED;

        onBatchError({
          transactionId,
          error: "Batch failed with auto-rollback",
          results,
          rollbackResult
        });

        return {
          success: false,
          transactionId,
          results,
          rollbackResult,
          summary: generateSummary(results)
        };
      }

      if (allSucceeded) {
        await rollbackEngine.commitTransaction();
        batchState = BATCH_STATES.COMPLETED;
      } else if (continueOnError) {
        await rollbackEngine.commitTransaction();
        batchState = BATCH_STATES.COMPLETED;
      } else {
        batchState = BATCH_STATES.FAILED;
      }

      const summary = generateSummary(results);

      onBatchComplete({
        transactionId,
        success: allSucceeded || (continueOnError && completedOperations.length > 0),
        results,
        summary
      });

      return {
        success: allSucceeded || (continueOnError && completedOperations.length > 0),
        transactionId,
        results,
        summary
      };

    } catch (error) {
      batchState = BATCH_STATES.FAILED;

      onBatchError({
        transactionId,
        error: error.message,
        stack: error.stack
      });

      if (autoRollbackOnError) {
        await rollbackEngine.rollbackTransaction(transactionId);
      }

      throw error;
    }
  }

  async function executeSequential(operations, continueOnError) {
    const results = [];

    for (let i = 0; i < operations.length; i++) {
      if (batchState === BATCH_STATES.PAUSED) {
        await waitForResume();
      }

      const operation = operations[i];
      const result = await executeSingleOperation(operation, i);
      results.push(result);

      if (!result.success && !continueOnError) {
        break;
      }
    }

    return results;
  }

  async function executeParallel(operations, continueOnError) {
    const results = [];
    const chunks = [];

    for (let i = 0; i < operations.length; i += maxConcurrent) {
      chunks.push(operations.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      if (batchState === BATCH_STATES.PAUSED) {
        await waitForResume();
      }

      const chunkResults = await Promise.all(
        chunk.map((op, idx) => executeSingleOperation(op, results.length + idx))
      );

      results.push(...chunkResults);

      if (!continueOnError && chunkResults.some(r => !r.success)) {
        break;
      }
    }

    return results;
  }

  async function executeChunked(operations, continueOnError, size) {
    const results = [];

    for (let i = 0; i < operations.length; i += size) {
      if (batchState === BATCH_STATES.PAUSED) {
        await waitForResume();
      }

      const chunk = operations.slice(i, i + size);
      const chunkResults = await executeSequential(chunk, continueOnError);
      results.push(...chunkResults);

      if (!continueOnError && chunkResults.some(r => !r.success)) {
        break;
      }
    }

    return results;
  }

  async function executeSingleOperation(operation, index) {
    const operationId = `op_${Date.now()}_${index}`;
    const startTime = Date.now();

    const context = {
      operationId,
      index,
      batchId: currentBatch?.transactionId,
      previousResults: completedOperations,
      getData: (key) => operationQueue.find(op => op.id === key)?.data
    };

    let attempt = 0;
    let lastError = null;

    while (attempt < retryAttempts) {
      try {
        const previousState = await capturePreviousState(operation);

        let result;
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new TimeoutError(`Operation timed out after ${operationTimeout}ms`)), operationTimeout);
        });
        try {
          result = await Promise.race([operation.execute(context), timeoutPromise]);
        } finally {
          clearTimeout(timeoutHandle);
        }

        rollbackEngine.registerOperation({
          type: operation.type || OPERATION_TYPES.UPDATE,
          target: operation.target || operationId,
          previousState,
          newState: result,
          metadata: {
            operationId,
            attempt: attempt + 1,
            duration: Date.now() - startTime
          }
        });

        const successResult = {
          success: true,
          operationId,
          index,
          result,
          duration: Date.now() - startTime,
          attempts: attempt + 1
        };

        completedOperations.push(successResult);

        onOperationComplete({
          operationId,
          index,
          success: true,
          duration: Date.now() - startTime
        });

        return successResult;

      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt < retryAttempts) {
          await delay(retryDelay * attempt);
        }
      }
    }

    const failureResult = {
      success: false,
      operationId,
      index,
      error: lastError?.message || "Unknown error",
      duration: Date.now() - startTime,
      attempts: attempt
    };

    failedOperations.push(failureResult);

    onOperationComplete({
      operationId,
      index,
      success: false,
      error: lastError?.message
    });

    return failureResult;
  }

  async function capturePreviousState(operation) {
    if (operation.getCurrentState && typeof operation.getCurrentState === "function") {
      try {
        return await operation.getCurrentState();
      } catch (e) {
        console.warn(`[TransactionManager] Failed to capture previous state: ${e.message}`);
        return null;
      }
    }
    return null;
  }

  async function rollbackBatch() {
    if (!currentBatch) {
      throw new Error("No active batch to rollback.");
    }

    batchState = BATCH_STATES.ROLLING_BACK;
    onRollbackStart({ transactionId: currentBatch.transactionId });

    const result = await rollbackEngine.rollbackTransaction(currentBatch.transactionId);

    onRollbackComplete({
      transactionId: currentBatch.transactionId,
      success: result.success,
      details: result
    });

    batchState = result.success ? BATCH_STATES.IDLE : BATCH_STATES.FAILED;

    return result;
  }

  function pauseBatch() {
    if (batchState === BATCH_STATES.RUNNING) {
      batchState = BATCH_STATES.PAUSED;
      return true;
    }
    return false;
  }

  function resumeBatch() {
    if (batchState === BATCH_STATES.PAUSED) {
      batchState = BATCH_STATES.RUNNING;
      operationCallbacks.forEach((resolve, id) => {
        if (id.startsWith("resume_")) {
          resolve();
          operationCallbacks.delete(id);
        }
      });
      return true;
    }
    return false;
  }

  function waitForResume() {
    return new Promise((resolve) => {
      const id = `resume_${Date.now()}`;
      operationCallbacks.set(id, resolve);
    });
  }

  function cancelBatch() {
    if (currentBatch && batchState !== BATCH_STATES.IDLE) {
      batchState = BATCH_STATES.IDLE;
      operationCallbacks.clear();
      currentBatch = null;
      operationQueue = [];
      return true;
    }
    return false;
  }

  function getBatchStatus() {
    if (!currentBatch) {
      return { state: BATCH_STATES.IDLE };
    }

    const total = currentBatch.totalOperations;
    const completed = completedOperations.length;
    const failed = failedOperations.length;
    const pending = total - completed - failed;
    const progress = Math.round((completed / total) * 100);

    return {
      state: batchState,
      transactionId: currentBatch.transactionId,
      progress,
      total,
      completed,
      failed,
      pending,
      elapsedTime: Date.now() - currentBatch.startTime,
      strategy: currentBatch.strategy
    };
  }

  function generateSummary(results) {
    const total = results.length;
    const succeeded = results.filter(r => r.success).length;
    const failed = total - succeeded;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    return {
      total,
      succeeded,
      failed,
      successRate: total > 0 ? Math.round((succeeded / total) * 100) : 0,
      totalDuration,
      avgDuration,
      fastest: results.length > 0 ? Math.min(...results.map(r => r.duration)) : 0,
      slowest: results.length > 0 ? Math.max(...results.map(r => r.duration)) : 0
    };
  }

  function createOperation(config) {
    const {
      id,
      type = OPERATION_TYPES.UPDATE,
      target,
      execute,
      getCurrentState,
      validate,
      metadata = {}
    } = config;

    return {
      id: id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      target,
      execute,
      getCurrentState,
      validate,
      metadata
    };
  }

  function createBatchFromConfig(configs, options = {}) {
    const operations = configs.map((config, index) =>
      createOperation({
        ...config,
        id: config.id || `batch_op_${Date.now()}_${index}`
      })
    );

    return { operations, options };
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return {
    executeBatch,
    rollbackBatch,
    pauseBatch,
    resumeBatch,
    cancelBatch,
    getBatchStatus,
    createOperation,
    createBatchFromConfig,
    rollbackEngine,
    STATES: BATCH_STATES,
    STRATEGIES: EXECUTION_STRATEGIES,
    OPERATIONS: OPERATION_TYPES
  };
}

export { BATCH_STATES, EXECUTION_STRATEGIES, OPERATION_TYPES, TimeoutError };
