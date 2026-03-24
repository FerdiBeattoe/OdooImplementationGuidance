import {
  getAccountingEvidenceLabel,
  getAccountingEvidenceSufficiency,
  getCheckpointStatusTone,
  getCrmEvidenceLabel,
  getCrmEvidenceSufficiency,
  getInventoryEvidenceSufficiency,
  getManufacturingEvidenceLabel,
  getManufacturingEvidenceSufficiency,
  getPosEvidenceLabel,
  getPosEvidenceSufficiency,
  getPurchaseEvidenceLabel,
  getPurchaseEvidenceSufficiency,
  getSalesEvidenceLabel,
  getSalesEvidenceSufficiency,
  getWebsiteEcommerceEvidenceLabel,
  getWebsiteEcommerceEvidenceSufficiency
} from "/shared/index.js";
import { el } from "../lib/dom.js";
import { renderStatusBadge } from "./status-badge.js";

export function renderCheckpointPanel(checkpoint, options = {}) {
  const tone = getCheckpointStatusTone(checkpoint);
  const reviewState = getReviewState(checkpoint);
  const downstreamImpactSummary = options.downstreamImpactSummary?.trim() || "";
  const hasInventoryEvidence = Boolean(checkpoint.inventoryEvidence?.mode);
  const hasAccountingEvidence = Boolean(checkpoint.accountingEvidence?.mode);
  const hasPurchaseEvidence = Boolean(checkpoint.purchaseEvidence?.mode);
  const hasSalesEvidence = Boolean(checkpoint.salesEvidence?.mode);
  const hasManufacturingEvidence = Boolean(checkpoint.manufacturingEvidence?.mode);
  const hasCrmEvidence = Boolean(checkpoint.crmEvidence?.mode);
  const hasWebsiteEcommerceEvidence = Boolean(checkpoint.websiteEcommerceEvidence?.mode);
  const hasPosEvidence = Boolean(checkpoint.posEvidence?.mode);
  const details = [
    ["Status", checkpoint.status === "Fail" ? "Not yet started" : checkpoint.status === "Warning" ? "In progress" : "Done"],
    ["Setup area", checkpoint.checkpointGroup || "General"],
    ["Type of step", checkpoint.checkpointClass],
    ["Where to check this", checkpoint.validationSource],
    ["How you work", checkpoint.evidenceStatus === "Pending" ? "We need your context" : "Context provided"],
    ["Risk if guessed", checkpoint.writeSafetyClass],
    ["Leading this step", checkpoint.checkpointOwner || "You"],
    ["Reviewer", checkpoint.reviewer || "Not assigned"],
    ["Review status", reviewState]
  ];

  if (hasInventoryEvidence) {
    details.splice(5, 0,
      ["Your business reality", checkpoint.inventoryEvidence.mode.replaceAll("_", " ")],
      ["Detail level", getInventoryEvidenceSufficiency(checkpoint)]
    );
  } else if (hasAccountingEvidence) {
    details.splice(5, 0,
      ["Your business reality", getAccountingEvidenceLabel(checkpoint.accountingEvidence)],
      ["Detail level", getAccountingEvidenceSufficiency(checkpoint)]
    );
  } else if (hasPurchaseEvidence) {
    details.splice(5, 0,
      ["Your business reality", getPurchaseEvidenceLabel(checkpoint.purchaseEvidence)],
      ["Detail level", getPurchaseEvidenceSufficiency(checkpoint)]
    );
  } else if (hasSalesEvidence) {
    details.splice(5, 0,
      ["Your business reality", getSalesEvidenceLabel(checkpoint.salesEvidence)],
      ["Detail level", getSalesEvidenceSufficiency(checkpoint)]
    );
  } else if (hasManufacturingEvidence) {
    details.splice(5, 0,
      ["Your business reality", getManufacturingEvidenceLabel(checkpoint.manufacturingEvidence)],
      ["Detail level", getManufacturingEvidenceSufficiency(checkpoint)]
    );
  } else if (hasCrmEvidence) {
    details.splice(5, 0,
      ["Your business reality", getCrmEvidenceLabel(checkpoint.crmEvidence)],
      ["Detail level", getCrmEvidenceSufficiency(checkpoint)]
    );
  } else if (hasWebsiteEcommerceEvidence) {
    details.splice(5, 0,
      ["Your business reality", getWebsiteEcommerceEvidenceLabel(checkpoint.websiteEcommerceEvidence)],
      ["Detail level", getWebsiteEcommerceEvidenceSufficiency(checkpoint)]
    );
  } else if (hasPosEvidence) {
    details.splice(5, 0,
      ["Your business reality", getPosEvidenceLabel(checkpoint.posEvidence)],
      ["Detail level", getPosEvidenceSufficiency(checkpoint)]
    );
  } else {
    details.splice(5, 0, ["Notes or links", checkpoint.evidenceReference || "None yet"]);
  }

  const detailGrid = el(
    "div",
    { className: "checkpoint-panel__details" },
    details.map(([label, value]) =>
      el("div", { className: "checkpoint-panel__detail" }, [
        el("strong", { text: label }),
        el("span", { text: value })
      ])
    )
  );

  const warnings = [];

  if (checkpoint.blockerFlag && checkpoint.blockedReason) {
    warnings.push(el("p", { className: "checkpoint-panel__warning", text: `Attention needed: ${checkpoint.blockedReason}` }));
  }

  if (checkpoint.inventoryEvidence?.summary || checkpoint.inventoryEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.inventoryEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Evidence summary: ${checkpoint.inventoryEvidence.summary}`
            })
          : null,
        checkpoint.inventoryEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Evidence source: ${checkpoint.inventoryEvidence.sourceLabel}`
            })
          : null,
        checkpoint.inventoryEvidence.recordedActor || checkpoint.inventoryEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Evidence recorded by ${checkpoint.inventoryEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.inventoryEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.accountingEvidence?.summary || checkpoint.accountingEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.accountingEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Accounting evidence summary: ${checkpoint.accountingEvidence.summary}`
            })
          : null,
        checkpoint.accountingEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Accounting evidence source: ${checkpoint.accountingEvidence.sourceLabel}`
            })
          : null,
        checkpoint.accountingEvidence.recordedActor || checkpoint.accountingEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Accounting evidence recorded by ${checkpoint.accountingEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.accountingEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.purchaseEvidence?.summary || checkpoint.purchaseEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.purchaseEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Purchase evidence summary: ${checkpoint.purchaseEvidence.summary}`
            })
          : null,
        checkpoint.purchaseEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Purchase evidence source: ${checkpoint.purchaseEvidence.sourceLabel}`
            })
          : null,
        checkpoint.purchaseEvidence.recordedActor || checkpoint.purchaseEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Purchase evidence recorded by ${checkpoint.purchaseEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.purchaseEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.salesEvidence?.summary || checkpoint.salesEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.salesEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Sales evidence summary: ${checkpoint.salesEvidence.summary}`
            })
          : null,
        checkpoint.salesEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Sales evidence source: ${checkpoint.salesEvidence.sourceLabel}`
            })
          : null,
        checkpoint.salesEvidence.recordedActor || checkpoint.salesEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Sales evidence recorded by ${checkpoint.salesEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.salesEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.manufacturingEvidence?.summary || checkpoint.manufacturingEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.manufacturingEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Manufacturing evidence summary: ${checkpoint.manufacturingEvidence.summary}`
            })
          : null,
        checkpoint.manufacturingEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Manufacturing evidence source: ${checkpoint.manufacturingEvidence.sourceLabel}`
            })
          : null,
        checkpoint.manufacturingEvidence.recordedActor || checkpoint.manufacturingEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Manufacturing evidence recorded by ${checkpoint.manufacturingEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.manufacturingEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.crmEvidence?.summary || checkpoint.crmEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.crmEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `CRM evidence summary: ${checkpoint.crmEvidence.summary}`
            })
          : null,
        checkpoint.crmEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `CRM evidence source: ${checkpoint.crmEvidence.sourceLabel}`
            })
          : null,
        checkpoint.crmEvidence.recordedActor || checkpoint.crmEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `CRM evidence recorded by ${checkpoint.crmEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.crmEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.websiteEcommerceEvidence?.summary || checkpoint.websiteEcommerceEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.websiteEcommerceEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Website evidence summary: ${checkpoint.websiteEcommerceEvidence.summary}`
            })
          : null,
        checkpoint.websiteEcommerceEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Website evidence source: ${checkpoint.websiteEcommerceEvidence.sourceLabel}`
            })
          : null,
        checkpoint.websiteEcommerceEvidence.recordedActor || checkpoint.websiteEcommerceEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `Website evidence recorded by ${checkpoint.websiteEcommerceEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.websiteEcommerceEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.posEvidence?.summary || checkpoint.posEvidence?.sourceLabel) {
    warnings.push(
      el("div", { className: "checkpoint-panel__evidence" }, [
        checkpoint.posEvidence.summary
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `POS evidence summary: ${checkpoint.posEvidence.summary}`
            })
          : null,
        checkpoint.posEvidence.sourceLabel
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `POS evidence source: ${checkpoint.posEvidence.sourceLabel}`
            })
          : null,
        checkpoint.posEvidence.recordedActor || checkpoint.posEvidence.recordedAt
          ? el("p", {
              className: "checkpoint-panel__dependency",
              text: `POS evidence recorded by ${checkpoint.posEvidence.recordedActor || "unrecorded actor"} at ${checkpoint.posEvidence.recordedAt || "unrecorded time"}`
            })
          : null
      ])
    );
  }

  if (checkpoint.defermentFlag) {
    warnings.push(
      el("div", { className: "checkpoint-panel__deferment" }, [
        el("p", {
          className: "checkpoint-panel__warning",
          text: `Deferred: ${checkpoint.defermentReason || "Deferred under recorded conditions."}`
        }),
        el("p", {
          className: "checkpoint-panel__dependency",
          text: `Constraint: ${checkpoint.defermentConstraint || "Not recorded"}`
        }),
        el("p", {
          className: "checkpoint-panel__dependency",
          text: `Review point: ${checkpoint.reviewPoint || "Not recorded"}`
        }),
        el("p", {
          className: "checkpoint-panel__dependency",
          text: `Recorded by ${checkpoint.lastTransitionBy || "unrecorded actor"} at ${checkpoint.lastTransitionAt || "unrecorded time"}`
        })
      ])
    );
  }

  if (checkpoint.dependencyIds.length) {
    warnings.push(
      el("p", {
        className: "checkpoint-panel__dependency",
        text: `You need to finish these steps first: ${checkpoint.dependencyIds.map(id => id.replace("checkpoint-", "").replace("-", " ")).join(", ")}`
      })
    );
  }

  return el("article", { className: `checkpoint-panel checkpoint-panel--${tone}` }, [
    el("header", { className: "checkpoint-panel__header" }, [
      el("div", {}, [el("h3", { text: checkpoint.title }), el("p", { className: "subtle", text: `Step ID: ${checkpoint.id}` })]),
      renderStatusBadge(
        checkpoint.defermentFlag
          ? "Deferred"
          : checkpoint.status === "Fail"
            ? "Blocked"
            : checkpoint.status === "Warning"
              ? "In Progress"
              : "Ready For Review"
      )
    ]),
    detailGrid,
    downstreamImpactSummary
      ? el("p", {
          className: "checkpoint-panel__dependency",
          text: `Downstream impact: ${downstreamImpactSummary}`
        })
      : null,
    ...warnings
  ]);
}

function getReviewState(checkpoint) {
  if (!checkpoint.defermentFlag) {
    return checkpoint.reviewer ? "Reviewer assigned" : "No review action recorded";
  }

  if (checkpoint.reviewer && checkpoint.lastReviewedAt) {
    return "Reviewed";
  }

  if (checkpoint.reviewer) {
    return "Pending review";
  }

  return "Review not assigned";
}
