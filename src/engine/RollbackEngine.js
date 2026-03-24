const TRANSACTION_STATES = {
  PENDING: "pending",
  COMMITTED: "committed",
  ROLLED_BACK: "rolled_back",
  FAILED: "failed"
};

const OPERATION_TYPES = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  CONFIGURE: "configure",
  ENABLE_MODULE: "enable_module",
  DISABLE_MODULE: "disable_module",
  SET_PERMISSION: "set_permission",
  SET_CONFIGURATION: "set_configuration"
};

export function createRollbackEngine(options = {}) {
  const {
    maxSnapshots = 50,
    onSnapshotCreate = () => {},
    onRollback = () => {},
    onOperation = () => {}
  } = options;

  let snapshots = [];
  let currentTransaction = null;
  let operationLog = [];

  function generateSnapshotId() {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function createSnapshot(data, metadata = {}) {
    const snapshot = {
      id: generateSnapshotId(),
      timestamp: Date.now(),
      data: deepClone(data),
      metadata: {
        description: metadata.description || "",
        triggeredBy: metadata.triggeredBy || "system",
        transactionId: metadata.transactionId || null,
        tags: metadata.tags || []
      }
    };

    snapshots.push(snapshot);

    if (snapshots.length > maxSnapshots) {
      snapshots.shift();
    }

    onSnapshotCreate(snapshot);
    return snapshot;
  }

  function getSnapshots(options = {}) {
    const { tag, after, before, limit } = options;

    let filtered = [...snapshots];

    if (tag) {
      filtered = filtered.filter(s => s.metadata.tags?.includes(tag));
    }

    if (after) {
      filtered = filtered.filter(s => s.timestamp > after);
    }

    if (before) {
      filtered = filtered.filter(s => s.timestamp < before);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  function getSnapshotById(id) {
    return snapshots.find(s => s.id === id) || null;
  }

  function getLatestSnapshot() {
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }

  function beginTransaction(description = "", metadata = {}) {
    if (currentTransaction) {
      throw new Error("Transaction already in progress. Commit or rollback before starting a new one.");
    }

    currentTransaction = {
      id: generateTransactionId(),
      description,
      state: TRANSACTION_STATES.PENDING,
      startTime: Date.now(),
      operations: [],
      snapshots: [],
      metadata
    };

    return currentTransaction.id;
  }

  function registerOperation(operation) {
    if (!currentTransaction) {
      throw new Error("No active transaction. Call beginTransaction() first.");
    }

    const op = {
      id: generateOperationId(),
      transactionId: currentTransaction.id,
      timestamp: Date.now(),
      type: operation.type,
      target: operation.target,
      previousState: deepClone(operation.previousState),
      newState: deepClone(operation.newState),
      metadata: operation.metadata || {},
      rolledBack: false
    };

    currentTransaction.operations.push(op);
    operationLog.push(op);

    onOperation(op);
    return op.id;
  }

  async function executeWithRollback(operation, executor) {
    if (!currentTransaction) {
      beginTransaction("Auto-transaction");
    }

    const previousState = await operation.getCurrentState();

    try {
      const result = await executor();

      registerOperation({
        type: operation.type,
        target: operation.target,
        previousState,
        newState: result,
        metadata: operation.metadata
      });

      return { success: true, result, operationId: currentTransaction.operations[currentTransaction.operations.length - 1].id };
    } catch (error) {
      return { success: false, error, previousState };
    }
  }

  async function commitTransaction() {
    if (!currentTransaction) {
      throw new Error("No active transaction to commit.");
    }

    currentTransaction.state = TRANSACTION_STATES.COMMITTED;
    currentTransaction.endTime = Date.now();

    const transaction = { ...currentTransaction };
    currentTransaction = null;

    return transaction;
  }

  async function rollbackTransaction(transactionId = null) {
    let targetTransaction = null;
    if (transactionId) {
      // Check operationLog first, then currentTransaction
      const fromLog = operationLog.find(op => op.transactionId === transactionId)?.transactionId;
      if (fromLog) {
        targetTransaction = fromLog;
      } else if (currentTransaction?.id === transactionId) {
        targetTransaction = currentTransaction.id;
      }
    } else {
      targetTransaction = currentTransaction?.id;
    }

    if (!targetTransaction) {
      throw new Error("No transaction found to rollback.");
    }

    const opsToRollback = operationLog.filter(op =>
      op.transactionId === targetTransaction && !op.rolledBack
    ).sort((a, b) => b.timestamp - a.timestamp);

    const rollbackResults = [];
    const errors = [];

    for (const op of opsToRollback) {
      try {
        const result = await rollbackOperation(op);
        rollbackResults.push({ operationId: op.id, success: true, result });
        op.rolledBack = true;
      } catch (error) {
        errors.push({ operationId: op.id, error: error.message });
        rollbackResults.push({ operationId: op.id, success: false, error: error.message });
      }
    }

    if (currentTransaction && currentTransaction.id === targetTransaction) {
      currentTransaction.state = TRANSACTION_STATES.ROLLED_BACK;
      currentTransaction.endTime = Date.now();
      currentTransaction = null;
    }

    onRollback({
      transactionId: targetTransaction,
      operationsRolledBack: rollbackResults.length,
      errors
    });

    return {
      success: errors.length === 0,
      rolledBack: rollbackResults.filter(r => r.success).length,
      failed: errors.length,
      details: rollbackResults,
      errors
    };
  }

  async function rollbackOperation(operation) {
    switch (operation.type) {
      case OPERATION_TYPES.CREATE:
        return { action: "delete", target: operation.target };

      case OPERATION_TYPES.UPDATE:
      case OPERATION_TYPES.CONFIGURE:
      case OPERATION_TYPES.SET_CONFIGURATION:
        return {
          action: "restore",
          target: operation.target,
          restoredState: operation.previousState
        };

      case OPERATION_TYPES.DELETE:
        return {
          action: "recreate",
          target: operation.target,
          restoredState: operation.previousState
        };

      case OPERATION_TYPES.ENABLE_MODULE:
        return { action: "disable_module", target: operation.target };

      case OPERATION_TYPES.DISABLE_MODULE:
        return { action: "enable_module", target: operation.target };

      case OPERATION_TYPES.SET_PERMISSION:
        return {
          action: "restore_permissions",
          target: operation.target,
          restoredState: operation.previousState
        };

      default:
        return { action: "unknown", target: operation.target };
    }
  }

  async function rollbackToSnapshot(snapshotId, restoreFn) {
    const snapshot = getSnapshotById(snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found.`);
    }

    try {
      const result = await restoreFn(snapshot.data);

      onRollback({
        type: "snapshot",
        snapshotId,
        timestamp: Date.now()
      });

      return { success: true, snapshot, result };
    } catch (error) {
      return { success: false, error: error.message, snapshot };
    }
  }

  function getTransactionStatus(transactionId) {
    const transaction = operationLog.find(op => op.transactionId === transactionId);
    if (!transaction) return null;

    const ops = operationLog.filter(op => op.transactionId === transactionId);
    const allRolledBack = ops.every(op => op.rolledBack);
    const someRolledBack = ops.some(op => op.rolledBack);

    return {
      transactionId,
      totalOperations: ops.length,
      rolledBackOperations: ops.filter(op => op.rolledBack).length,
      status: allRolledBack ? "fully_rolled_back" : someRolledBack ? "partially_rolled_back" : "committed"
    };
  }

  function getOperationLog(options = {}) {
    const { transactionId, type, target, limit, after } = options;

    let filtered = [...operationLog];

    if (transactionId) {
      filtered = filtered.filter(op => op.transactionId === transactionId);
    }

    if (type) {
      filtered = filtered.filter(op => op.type === type);
    }

    if (target) {
      filtered = filtered.filter(op => op.target === target);
    }

    if (after) {
      filtered = filtered.filter(op => op.timestamp > after);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  function canRollback(operationId) {
    const op = operationLog.find(o => o.id === operationId);
    return op ? !op.rolledBack : false;
  }

  function getRollbackInstructions(operationId) {
    const op = operationLog.find(o => o.id === operationId);
    if (!op) return null;

    return {
      operationId,
      type: op.type,
      target: op.target,
      rollbackAction: getRollbackActionDescription(op.type),
      previousStateAvailable: !!op.previousState,
      alreadyRolledBack: op.rolledBack
    };
  }

  function getRollbackActionDescription(type) {
    const descriptions = {
      [OPERATION_TYPES.CREATE]: "Delete the created record",
      [OPERATION_TYPES.UPDATE]: "Restore previous values",
      [OPERATION_TYPES.DELETE]: "Recreate the deleted record",
      [OPERATION_TYPES.CONFIGURE]: "Revert configuration changes",
      [OPERATION_TYPES.ENABLE_MODULE]: "Disable the module",
      [OPERATION_TYPES.DISABLE_MODULE]: "Enable the module",
      [OPERATION_TYPES.SET_PERMISSION]: "Restore previous permissions"
    };
    return descriptions[type] || "Unknown rollback action";
  }

  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(deepClone);
    if (typeof obj === "object") {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }

  function clearHistory(keepLast = 0) {
    if (keepLast > 0) {
      snapshots = snapshots.slice(-keepLast);
      const recentSnapshotIds = new Set(snapshots.map(s => s.id));
      operationLog = operationLog.filter(op => recentSnapshotIds.has(op.metadata?.snapshotId));
    } else {
      snapshots = [];
      operationLog = [];
    }
  }

  return {
    createSnapshot,
    getSnapshots,
    getSnapshotById,
    getLatestSnapshot,
    beginTransaction,
    registerOperation,
    executeWithRollback,
    commitTransaction,
    rollbackTransaction,
    rollbackToSnapshot,
    getTransactionStatus,
    getOperationLog,
    canRollback,
    getRollbackInstructions,
    clearHistory,
    STATES: TRANSACTION_STATES,
    OPERATIONS: OPERATION_TYPES
  };
}

export { TRANSACTION_STATES, OPERATION_TYPES };
