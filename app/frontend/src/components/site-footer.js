import { el } from "../lib/dom.js";

function renderFooterLink(label, view, setCurrentView) {
  return el("button", {
    className: "site-footer__link",
    type: "button",
    onclick: () => setCurrentView(view),
  }, label);
}

export function renderSiteFooter({ setCurrentView }) {
  return el("footer", { className: "site-footer" }, [
    el("div", { className: "site-footer__inner" }, [
      el("div", { className: "site-footer__column" }, [
        el("p", { className: "site-footer__brand" }, "Project ERP"),
        el("p", { className: "site-footer__meta" }, "Project ERP (PTY) LTD  Registration pending"),
      ]),
      el("div", { className: "site-footer__links" }, [
        renderFooterLink("Terms of Service", "terms", setCurrentView),
        renderFooterLink("Privacy Policy", "privacy", setCurrentView),
        renderFooterLink("How it works", "how-it-works", setCurrentView),
      ]),
      el("div", { className: "site-footer__column site-footer__column--end" }, [
        el("p", { className: "site-footer__meta" }, " 2026 Project ERP (PTY) LTD. All rights reserved."),
      ]),
    ]),
  ]);
}
