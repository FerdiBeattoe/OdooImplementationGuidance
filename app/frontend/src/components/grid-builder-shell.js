import { classifyActionSafety } from "/shared/index.js";
import { el } from "../lib/dom.js";

export function renderGridBuilderShell(title, rows) {
  const bulkEdit = classifyActionSafety("bulk-edit");
  const bulkComplete = classifyActionSafety("bulk-checkpoint-complete");
  const productionWrite = classifyActionSafety("grid-production-write");

  const body = rows.length
    ? rows.map((row) =>
        el("div", { className: "grid-shell__row" }, [
          el("strong", { text: row.label }),
          el("span", { text: row.value }),
          el("span", { className: "grid-shell__lock", text: "Row edit only" })
        ])
      )
    : [el("p", { text: "No structured rows are available yet for this section." })];

  return el("section", { className: "grid-shell" }, [
    el("header", { className: "grid-shell__header" }, [
      el("h3", { text: title }),
      el("p", { text: "Section-specific grid shell only." })
    ]),
    el("p", { text: `${bulkEdit.safety}: ${bulkEdit.reason}` }),
    el("p", { text: `${bulkComplete.safety}: ${bulkComplete.reason}` }),
    el("p", { text: `${productionWrite.safety}: ${productionWrite.reason}` }),
    ...body
  ]);
}
