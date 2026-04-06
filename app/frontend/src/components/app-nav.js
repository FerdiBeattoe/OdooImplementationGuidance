import { el } from "../lib/dom.js";

export function renderAppNav({ setCurrentView, showBackLink = true }) {
  return el("nav", { className: "site-nav" }, [
    el("div", { className: "site-nav__inner" }, [
      el("img", {
        src: "/assets/logo-project-odoo.png",
        alt: "Project ERP \u2014 Project Odoo",
        className: "site-nav__logo",
        onclick: () => setCurrentView("home"),
        style: "cursor:pointer;",
      }),
      showBackLink ? el("button", {
        className: "site-nav__back-link",
        type: "button",
        onclick: () => setCurrentView("home"),
      }, "\u2190 projecterp.com") : null,
    ]),
  ]);
}
