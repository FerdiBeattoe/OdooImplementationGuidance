/**
 * Odoo Implementation Platform - Phase 9-12 Components
 * UX, Safety Systems, and Polish Features
 */

export {
  createVisualProgressTracker,
  createMobileProgressTracker,
  createDomainProgressTracker,
  createWizardProgressTracker,
  ICONS,
  STEP_STATES
} from "./components/VisualProgressTracker.js";

export {
  createVideoEmbed,
  createVideoPlaylist,
  createHelpVideo,
  extractVideoId,
  detectVideoProvider,
  buildEmbedUrl,
  VIDEO_PROVIDERS
} from "./components/VideoEmbed.js";

export {
  createWizardShell,
  WIZARD_STATES,
  WIZARD_DIRECTIONS
} from "./components/WizardShell.js";

export {
  createRollbackEngine,
  TRANSACTION_STATES,
  OPERATION_TYPES
} from "./engine/RollbackEngine.js";

export {
  createTransactionManager,
  BATCH_STATES,
  EXECUTION_STRATEGIES
} from "./engine/TransactionManager.js";

export {
  createAutoDetector,
  DEPLOYMENT_TYPES,
  ODOO_VERSIONS,
  MODULE_PATTERNS
} from "./utils/AutoDetect.js";

export {
  createPdfExporter,
  PDF_SECTIONS,
  PDF_STYLES
} from "./export/PdfExporter.js";
