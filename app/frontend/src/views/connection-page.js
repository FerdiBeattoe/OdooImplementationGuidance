import {
  DEPLOYMENTS,
  EDITIONS,
  ODOO_VERSION,
  PROJECT_MODES,
  getCombinationError
} from "/shared/index.js";
import { el } from "../lib/dom.js";

/**
 * Full-page non-technical connection / project setup screen.
 * Designed for users with no Odoo technical background.
 * Bypasses the layout shell — renders directly into the app root.
 */
export function renderConnectionPage(project, onIdentityChange, onEnvironmentChange, onBegin) {
  const combinationError = getCombinationError(project.projectIdentity);

  // ── Left panel ────────────────────────────────────────────────────────
  const leftPanel = el("aside", { 
    style: "width: 50%; min-height: 100vh; background: var(--color-inverse-surface); color: var(--color-inverse-on-surface); padding: 48px; display: flex; flex-direction: column;" 
  }, [
    el("div", { style: "flex: 1;" }, [
      // Badge
      el("span", { 
        style: "display: inline-block; font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-widest); padding: 6px 12px; background: rgba(255, 215, 241, 0.15); color: var(--color-primary-fixed-dim); margin-bottom: 24px;",
        text: "ODOO 19 SETUP GUIDE" 
      }),
      
      // Title
      el("h1", { style: "font-family: var(--font-headline); font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2; margin-bottom: 16px; letter-spacing: var(--ls-snug);", text: "Your free Odoo 19 setup guide" }),
      
      // Subtitle
      el("p", { style: "font-family: var(--font-body); font-size: 16px; color: rgba(255, 255, 255, 0.6); line-height: 1.6; margin-bottom: 32px;", text: "We walk you through every step in plain English — no IT background needed." }),
      
      // Features
      el("ul", { style: "list-style: none; padding: 0; margin: 0 0 32px 0; display: flex; flex-direction: column; gap: 12px;" }, [
        featureBullet("check", "Built specifically for Odoo 19"),
        featureBullet("check", "Tells you exactly what to set up and in what order"),
        featureBullet("check", "Explains why each decision matters for your business"),
        featureBullet("check", "Save your progress and come back whenever you like"),
        featureBullet("check", "Live connection is optional and stays bounded when enabled")
      ]),
      
      // Editions
      el("div", { style: "margin-bottom: 32px;" }, [
        el("p", { style: "font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); color: rgba(255, 255, 255, 0.4); margin-bottom: 8px;", text: "Works with" }),
        el("div", { style: "display: flex; gap: 8px;" }, [
          el("span", { style: "font-family: var(--font-label); font-size: 12px; font-weight: 600; padding: 4px 10px; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8);", text: "Community" }),
          el("span", { style: "font-family: var(--font-label); font-size: 12px; font-weight: 600; padding: 4px 10px; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8);", text: "Enterprise" })
        ])
      ])
    ]),
    
    // Quote
    el("blockquote", { style: "border-left: 3px solid var(--color-primary); padding-left: 16px; margin: 0;" }, [
      el("p", { style: "font-family: var(--font-body); font-size: 14px; font-style: italic; color: rgba(255, 255, 255, 0.6); line-height: 1.6; margin: 0 0 8px 0;", text: '"I had no idea where to start. This guide felt like having a knowledgeable friend sitting next to me the whole time."' }),
      el("footer", { style: "font-family: var(--font-body); font-size: 12px; color: rgba(255, 255, 255, 0.4);", text: "— Small business owner, implemented Odoo 19 in 6 weeks" })
    ])
  ]);

  // ── Right panel ───────────────────────────────────────────────────────
  const editionSelect = connSelect(
    "conn-edition",
    "Which version of Odoo do you have?",
    "Your Odoo account page will tell you — it says Community or Enterprise near your subscription.",
    EDITIONS,
    project.projectIdentity.edition,
    (value) => onIdentityChange({ edition: value })
  );

  const deploymentSelect = connSelect(
    "conn-deployment",
    "Where is your Odoo running?",
    "Not sure? If you log in at yourname.odoo.com it's Odoo Online. If your IT team hosts it, choose On-Premise.",
    DEPLOYMENTS,
    project.projectIdentity.deployment,
    (value) => onIdentityChange({ deployment: value })
  );

  const modeSelect = connSelect(
    "conn-mode",
    "What are you trying to do?",
    "Most people choosing this for the first time should pick 'New implementation'.",
    PROJECT_MODES,
    project.projectIdentity.projectMode,
    (value) => onIdentityChange({ projectMode: value })
  );

  const nameInput = connInput(
    "conn-name",
    "What shall we call this project?",
    "e.g. My Business Odoo Setup",
    "Give it any name you like — it's just for your records.",
    project.projectIdentity.projectName,
    (value) => onIdentityChange({ projectName: value })
  );

  const orgInput = connInput(
    "conn-org",
    "Your business name",
    "e.g. The Old Manor Gift Shop",
    "This appears on your setup progress so you know which business it belongs to.",
    project.projectIdentity.organizationName,
    (value) => onIdentityChange({ organizationName: value })
  );

  const ownerInput = connInput(
    "conn-owner",
    "Your name",
    "e.g. Margaret Hartley",
    "The person leading this setup — usually you!",
    project.projectIdentity.projectOwner,
    (value) => onIdentityChange({ projectOwner: value })
  );

  const beginDisabled = !!combinationError;
  const beginBtn = el("button", {
    style: `width: 100%; height: 48px; font-family: var(--font-headline); font-size: 15px; font-weight: 600; background: ${beginDisabled ? "var(--color-outline)" : "var(--color-primary)"}; color: ${beginDisabled ? "var(--color-on-surface-variant)" : "var(--color-on-primary)"}; border: none; cursor: ${beginDisabled ? "not-allowed" : "pointer"}; opacity: ${beginDisabled ? "0.5" : "1"};`,
    disabled: beginDisabled ? "disabled" : undefined,
    onclick: beginDisabled ? null : () => onBegin(),
    title: beginDisabled ? combinationError : "Start your guided Odoo 19 setup"
  }, [
    el("span", { text: "Begin my setup →" })
  ]);

  const errorNote = combinationError
    ? el("div", { style: "display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--color-error-container); margin-bottom: 16px;" }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px; color: var(--color-error);", text: "warning" }),
        el("span", { style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-error-container);", text: combinationError })
      ])
    : null;

  const helpLink = el("p", { style: "text-align: center; margin-top: 16px;" }, [
    el("a", {
      href: "https://www.odoo.com/pricing",
      target: "_blank",
      rel: "noopener noreferrer",
      style: "font-family: var(--font-body); font-size: 13px; color: var(--color-secondary); text-decoration: none;",
      onmouseenter: (e) => e.target.style.textDecoration = "underline",
      onmouseleave: (e) => e.target.style.textDecoration = "none",
      text: "Don't have Odoo yet? Compare plans on odoo.com →"
    })
  ]);

  const rightPanel = el("main", {
    style: "width: 50%; min-height: 100vh; background: var(--color-surface); padding: 48px; display: flex; flex-direction: column; justify-content: center;"
  }, [
    el("div", { style: "max-width: 400px; margin: 0 auto; width: 100%;" }, [
      el("p", { style: "font-family: var(--font-label); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: var(--ls-wide); color: var(--color-on-surface-variant); margin-bottom: 8px;", text: "Step 1 of 2 — Tell us about your Odoo" }),
      el("h2", { style: "font-family: var(--font-headline); font-size: 24px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug); margin-bottom: 8px;", text: "Let's get your Odoo 19 guide ready" }),
      el("p", { style: "font-family: var(--font-body); font-size: 14px; color: var(--color-on-surface-variant); margin-bottom: 24px;", text: "Answer a few quick questions and we'll tailor the guide to your exact setup. It takes about 2 minutes." }),

      el("div", { style: "display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px;" }, [
        editionSelect,
        deploymentSelect,
        modeSelect,
        el("div", { style: "height: 1px; background: var(--color-surface-container-high); margin: 8px 0;" }),
        el("p", { style: "font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); color: var(--color-on-surface-variant); margin: 0;", text: "A little about you (optional but helpful)" }),
        orgInput,
        ownerInput,
        nameInput
      ]),

      errorNote,
      beginBtn,
      helpLink
    ])
  ]);

  return el("div", {
    style: "display: flex; min-height: 100vh;"
  }, [leftPanel, rightPanel]);
}

// ── Helpers ──────────────────────────────────────────────────────────────

function featureBullet(icon, text) {
  return el("li", { style: "display: flex; align-items: center; gap: 12px; font-family: var(--font-body); font-size: 14px; color: rgba(255, 255, 255, 0.8);" }, [
    el("span", { className: "material-symbols-outlined", style: "font-size: 18px; color: var(--color-primary-fixed-dim); flex-shrink: 0;", text: icon }),
    el("span", { text })
  ]);
}

function connInput(id, label, placeholder, hint, value, onChange) {
  const input = el("input", {
    type: "text",
    placeholder,
    value,
    autocomplete: "off",
    style: "width: 100%; height: 44px; padding: 0 12px; font-family: var(--font-body); font-size: 14px; background: var(--color-surface-container-low); border: none; border-left: 2px solid transparent; outline: none;",
    onfocus: (e) => { e.target.style.borderLeftColor = "var(--color-primary)"; e.target.style.background = "var(--color-surface-container-highest)"; },
    onblur: (e) => { e.target.style.borderLeftColor = "transparent"; e.target.style.background = "var(--color-surface-container-low)"; },
    oninput: (event) => onChange(event.target.value)
  });

  return el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
    el("label", { for: id, style: "font-family: var(--font-label); font-size: 13px; font-weight: 600; color: var(--color-on-surface);", text: label }),
    input,
    el("p", { style: "font-family: var(--font-body); font-size: 12px; color: var(--color-on-surface-variant); margin: 0;", text: hint })
  ]);
}

function connSelect(id, label, hint, options, selectedValue, onChange) {
  const select = el("select", {
    id,
    style: "width: 100%; height: 44px; padding: 0 12px; font-family: var(--font-body); font-size: 14px; background: var(--color-surface-container-low); border: none; border-left: 2px solid transparent; outline: none; cursor: pointer;",
    onfocus: (e) => { e.target.style.borderLeftColor = "var(--color-primary)"; e.target.style.background = "var(--color-surface-container-highest)"; },
    onblur: (e) => { e.target.style.borderLeftColor = "transparent"; e.target.style.background = "var(--color-surface-container-low)"; },
    onchange: (event) => onChange(event.target.value)
  }, options.map((opt) => {
    const option = el("option", { value: opt, text: opt });
    option.selected = opt === selectedValue;
    return option;
  }));

  return el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
    el("label", { for: id, style: "font-family: var(--font-label); font-size: 13px; font-weight: 600; color: var(--color-on-surface);", text: label }),
    select,
    el("p", { style: "font-family: var(--font-body); font-size: 12px; color: var(--color-on-surface-variant); margin: 0;", text: hint })
  ]);
}
