/**
 * Project Odoo - Phase 9-12: UX & Safety Systems
 * 
 * This module exports all the visual progress tracking, rollback safety,
 * auto-detection, and PDF export functionality.
 */

// Visual Progress Components
export {
  createVisualProgressTracker,
  createMobileProgressTracker,
  createDomainProgressTracker,
  createWizardProgressTracker,
  ICONS,
  STEP_STATES
} from "./components/VisualProgressTracker.js";

// Video Embedding
export {
  createVideoEmbed,
  createVideoPlaylist,
  createHelpVideo,
  createErrorEmbed,
  extractVideoId,
  detectVideoProvider,
  buildEmbedUrl,
  VIDEO_PROVIDERS
} from "./components/VideoEmbed.js";

// Wizard Shell
export {
  createWizardShell,
  WIZARD_STATES,
  WIZARD_DIRECTIONS
} from "./components/WizardShell.js";

// Rollback Safety Engine
export {
  createRollbackEngine,
  TRANSACTION_STATES,
  OPERATION_TYPES
} from "./engine/RollbackEngine.js";

// Transaction Manager
export {
  createTransactionManager,
  BATCH_STATES,
  EXECUTION_STRATEGIES
} from "./engine/TransactionManager.js";

// Auto-Detection
export {
  createAutoDetector,
  DEPLOYMENT_TYPES,
  ODOO_VERSIONS,
  MODULE_PATTERNS
} from "./utils/AutoDetect.js";

// PDF Export
export {
  createPdfExporter,
  PDF_SECTIONS,
  PDF_STYLES
} from "./export/PdfExporter.js";

// Version info
export const VERSION = "1.0.0";
export const BUILD_DATE = "2026-03-24";
export const PHASE = "9-12";

// Convenience factory function
export function createImplementationPlatform(config = {}) {
  return {
    progress: createVisualProgressTracker(config.progress),
    video: {
      embed: createVideoEmbed,
      playlist: createVideoPlaylist,
      help: createHelpVideo
    },
    wizard: createWizardShell(config.wizard),
    safety: {
      rollback: createRollbackEngine(config.rollback),
      transactions: createTransactionManager(config.transactions)
    },
    detection: createAutoDetector(config.detection),
    export: createPdfExporter(config.export)
  };
}
