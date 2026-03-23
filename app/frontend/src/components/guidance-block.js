import { getGuidanceDecisionMessage, getGuidanceStatusLabel, isGuidanceDecisionBlocked } from "/shared/index.js";
import { el } from "../lib/dom.js";

function renderList(items) {
  if (!items.length) {
    return el("p", { className: "guidance-block__empty", text: "None recorded." });
  }

  return el(
    "ul",
    { className: "guidance-block__list" },
    items.map((item) => el("li", { text: item }))
  );
}

export function renderGuidanceBlock(block) {
  const blocked = isGuidanceDecisionBlocked(block);

  return el("article", { className: "guidance-block" }, [
    el("header", { className: "guidance-block__header" }, [
      el("div", {}, [
        el("h3", { text: block.title }),
        el("p", { className: "guidance-block__status", text: getGuidanceStatusLabel(block) })
      ])
    ]),
    section("What this is", block.whatThisIs),
    section("Why it matters", block.whyItMatters),
    section("Downstream impact", renderList(block.downstreamImpact)),
    section("Common mistakes", renderList(block.commonMistakes)),
    el("div", { className: "guidance-block__meta" }, [
      section("Reversibility", block.reversibility),
      section("Decision owner", block.decisionOwner),
      section("Training should be offered", block.trainingOffer),
      section("Checkpoint blocker", block.checkpointBlocker ? "Yes" : "No")
    ]),
    el("section", { className: `guidance-decision-notice ${blocked ? "guidance-decision-notice--blocked" : ""}` }, [
      el("h4", { text: blocked ? "Decision required" : "Decision status" }),
      el("p", { text: getGuidanceDecisionMessage(block) }),
      blocked
        ? el("p", {
            className: "guidance-decision-notice__warning",
            text: "Do not apply a guessed default. The named decision owner must resolve this decision."
          })
        : null
    ])
  ]);
}

function section(title, content) {
  return el("section", { className: "guidance-block__section" }, [
    el("h4", { text: title }),
    typeof content === "string" ? el("p", { text: content }) : content
  ]);
}
