import { renderSiteFooter } from "../../components/site-footer.js";
import { renderSiteNav } from "../../components/site-nav.js";
import { el } from "../../lib/dom.js";

function syncDocument(title) {
  document.title = title;
  if (typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
}

function renderSection(title, content) {
  return el("section", {}, [
    el("h2", {}, title),
    ...content,
  ]);
}

export function renderPrivacyPage({ setCurrentView }) {
  syncDocument("Project Odoo | Privacy Policy");

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),
    el("main", { className: "mkt-reading" }, [
      el("article", { className: "mkt-reading__stack" }, [
        el("p", { className: "mkt-meta" }, "Last Updated: April 2026"),
        el("h1", {}, "Privacy Policy"),
        el("p", {}, "This Privacy Policy explains how Project ERP (PTY) LTD (registration pending), South Africa, collects, uses, stores, and protects personal information when you use Project Odoo. The policy is designed to align with the Protection of Personal Information Act, 2013 (POPIA), and is drafted with GDPR-aware handling for international users."),

        renderSection("1. Who We Are", [
          el("p", {}, "Project ERP (PTY) LTD (registration pending) is the operator of Project Odoo. If you have questions about privacy or want to exercise your rights, you can contact us at privacy@projecterp.co.za."),
        ]),

        renderSection("2. What Personal Information We Collect", [
          el("p", {}, "We collect account data such as your name, email address, and company name when you register or sign in. We collect implementation state data, including Odoo configuration answers, checkpoint results, approvals, and execution records generated through your use of the governed implementation workflow."),
          el("p", {}, "Payment data is processed entirely by Paddle. We do not store card details, bank-card numbers, or payment instrument data. We also collect usage data such as pipeline runs, checkpoint completions, and go-live readiness status. Technical data such as IP address may be processed transiently for rate limiting and service protection, but it is not retained as a stored analytics profile. Session tokens are processed to authenticate access."),
        ]),

        renderSection("3. Why We Collect It (Lawful Basis)", [
          el("p", {}, "We process personal information where necessary to perform our contract with you, including account creation, service delivery, implementation-state persistence, and audit-trail continuity. We process limited technical and security data for legitimate interests such as fraud prevention, abuse prevention, and platform security. We may also process information where required to comply with legal obligations."),
        ]),

        renderSection("4. How We Store It", [
          el("p", {}, "Project Odoo stores implementation state and related account records in Supabase infrastructure hosted in the EU region and encrypted at rest. Session tokens expire when you sign out or when the applicable authentication lifecycle ends. We do not use third-party analytics platforms, advertising trackers, or behavioural profiling systems."),
        ]),

        renderSection("5. Who We Share It With", [
          el("p", {}, "We share limited information with Paddle solely for payment processing and merchant-of-record functions, and with Supabase solely as infrastructure supporting account, session, and application-state storage. We do not sell personal information. We do not share personal information with third parties for marketing purposes."),
        ]),

        renderSection("6. Your Rights (POPIA and GDPR)", [
          el("p", {}, "Subject to applicable law, you may request access to your personal information, correction of inaccurate information, deletion of information that we are not required to retain, portability of qualifying data, and objection to certain processing activities. You may exercise these rights by emailing privacy@projecterp.co.za. We may need to verify your identity before acting on a request."),
        ]),

        renderSection("7. Cookies", [
          el("p", {}, "Project Odoo uses session cookies only, for authentication and secure continuity of access. We do not use tracking cookies, advertising cookies, or third-party analytics cookies."),
        ]),

        renderSection("8. Data Retention", [
          el("p", {}, "Account data is retained for the duration of the active licence and for up to 12 months thereafter unless a longer retention period is legally required. Implementation state is retained for the duration of the licence and for up to 12 months thereafter, after which it may be deleted on request where lawful. Audit-trail records may be retained for three years for legal compliance, dispute handling, and service-integrity purposes."),
        ]),

        renderSection("9. International Transfers", [
          el("p", {}, "Project Odoo stores service data in the EU through Supabase-hosted infrastructure. We rely on GDPR-aligned protection standards for that hosting environment. For South African data subjects, we aim to ensure that cross-border processing remains POPIA-compliant and that reasonable safeguards are maintained."),
        ]),

        renderSection("10. Changes to This Policy", [
          el("p", {}, "We may update this Privacy Policy from time to time. Material changes will be notified by email or through the platform. Continued use of the service after a material update takes effect will constitute acceptance of the revised policy."),
        ]),

        renderSection("11. Contact", [
          el("p", {}, "Privacy requests and questions may be sent to privacy@projecterp.co.za."),
        ]),
      ]),
    ]),
    renderSiteFooter({ setCurrentView }),
  ]);
}
