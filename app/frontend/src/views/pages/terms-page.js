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

export function renderTermsPage({ setCurrentView }) {
  syncDocument("Project Odoo | Terms of Service");

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),
    el("main", { className: "mkt-reading" }, [
      el("article", { className: "mkt-reading__stack" }, [
        el("p", { className: "mkt-meta" }, "Last Updated: April 2026"),
        el("h1", {}, "Terms of Service"),
        el("p", {}, "These Terms of Service govern your access to and use of Project Odoo, a governed implementation platform operated by Project ERP (PTY) LTD (registration pending), South Africa. By creating an account, accessing the platform, or using any part of the service, you agree to be bound by these Terms."),

        renderSection("1. Definitions", [
          el("p", {}, "\"Project Odoo\" means the software platform, governed implementation workflow, API endpoints, interface components, and related services provided by Project ERP (PTY) LTD. \"Customer\" means the individual or legal entity that registers for or uses the service. \"Instance\" means a single Odoo database or deployment environment licensed for use with the platform. \"Governed write\" means an approved application-layer configuration action executed through the platform's bounded execution path. \"Audit trail\" means the execution history, checkpoint results, and related implementation records retained by the service."),
        ]),

        renderSection("2. Acceptance of Terms", [
          el("p", {}, "You may use the service only if you have authority to bind the business or project for which the service is being used. If you do not agree to these Terms, you must not access or use the service. Continued use after an update to these Terms constitutes acceptance of the revised Terms once the applicable notice period has passed."),
        ]),

        renderSection("3. The Service", [
          el("p", {}, "Project Odoo provides a governed implementation workflow for Odoo 19 that gathers onboarding answers, activates relevant implementation domains, previews intended configuration actions, requires explicit approval before execution, performs bounded application-layer writes, and records truthful execution outcomes."),
          el("p", {}, "Project Odoo does not replace a consultant, systems integrator, project owner, or business decision-maker. The platform does not provide unrestricted administration, does not perform direct database writes, does not repair historical mistakes, and does not remediate legacy data corruption. It is a forward-only implementation control service intended to structure and govern configuration work."),
        ]),

        renderSection("4. Licence Grant", [
          el("p", {}, "Subject to these Terms and payment of applicable fees, Project ERP (PTY) LTD grants the Customer a limited, non-exclusive, non-transferable, revocable licence to use Project Odoo for the Customer's internal implementation work on the licensed Odoo instance."),
          el("p", {}, "Each licence is issued per Odoo instance. You may not resell the service, sublicense it, provide it as a managed white-label service, or permit unauthorised third parties to access it without prior written agreement. You may not reverse engineer, decompile, disassemble, or attempt to derive the underlying source, workflows, or proprietary implementation logic except to the extent such restriction is prohibited by applicable law."),
        ]),

        renderSection("5. Subscription and Payment", [
          el("p", {}, "Paid access is offered on the billing cycles displayed at the time of purchase. Fees are due in advance for the selected billing period. Paddle.com acts as merchant of record and payment processor for paid subscriptions, and your purchase may therefore be subject to Paddle's payment terms, tax handling, and checkout requirements."),
          el("p", {}, "Unless a plan states otherwise at checkout, subscriptions renew at the end of the active billing period on the same cycle. You are responsible for cancelling before renewal if you do not want the next billing period to begin. No refund is available after the first governed write has been executed on the licensed instance, because meaningful implementation value has then been delivered and recorded against that environment."),
        ]),

        renderSection("6. Free Tier", [
          el("p", {}, "The Foundation domain is always free. No credit card is required to connect an Odoo instance and complete Foundation checkpoints made available under the free tier. Project ERP (PTY) LTD may define the exact scope of free-tier availability, provided that the Foundation domain remains available at no charge."),
        ]),

        renderSection("7. Service Availability", [
          el("p", {}, "The service is provided on a best-effort basis. Project ERP (PTY) LTD does not currently offer an uptime service level agreement. Maintenance windows, infrastructure incidents, upstream platform failures, or third-party outages may affect availability from time to time. Where reasonably practical, scheduled maintenance will be announced in advance."),
        ]),

        renderSection("8. Data Ownership and Privacy", [
          el("p", {}, "The Customer retains ownership of its Odoo instance data and business configuration choices. Project ERP (PTY) LTD stores implementation state, checkpoint results, approvals, and audit-trail records required to operate the platform and provide continuity across sessions. Personal information is handled in accordance with the Privacy Policy, which forms part of these Terms by reference."),
        ]),

        renderSection("9. Intellectual Property", [
          el("p", {}, "All intellectual property rights in the Project Odoo platform, including software, interface design, workflow logic, documentation, branding, and associated materials, remain the property of Project ERP (PTY) LTD or its licensors. Customer data, Customer configuration content, and Customer-controlled Odoo instance information remain the property of the Customer or its licensors."),
        ]),

        renderSection("10. Limitation of Liability", [
          el("p", {}, "Project Odoo assists with governed configuration, but the Customer remains responsible for all business decisions, approvals, operating policy choices, and consequences of configuration selections. Project ERP (PTY) LTD is not liable for Odoo instance outages, customer-side data loss, consultant decisions, third-party integration failures, or downstream configuration consequences arising from customer-approved actions."),
          el("p", {}, "To the maximum extent permitted by law, Project ERP (PTY) LTD's aggregate liability arising out of or in connection with the service, whether in contract, delict, statute, or otherwise, is capped at the total fees paid by the Customer for the service in the three months preceding the event giving rise to the claim."),
        ]),

        renderSection("11. Indemnification", [
          el("p", {}, "The Customer agrees to indemnify and hold harmless Project ERP (PTY) LTD, its directors, officers, contractors, and affiliates against claims, damages, losses, and costs arising from the Customer's misuse of the service, breach of these Terms, infringement of third-party rights, or unlawful use of the platform or connected systems."),
        ]),

        renderSection("12. Termination", [
          el("p", {}, "The Customer may cancel a subscription at any time. Cancellation stops future renewal, but access continues until the end of the paid billing period unless these Terms permit earlier suspension or termination. Project ERP (PTY) LTD may suspend or terminate access for material breach, unlawful use, abuse of the service, or failure to comply with these Terms. Audit and billing records may be retained as required by law or operational necessity."),
        ]),

        renderSection("13. Governing Law", [
          el("p", {}, "These Terms are governed by the laws of South Africa. Any dispute arising from or relating to these Terms or the service will be subject to the exclusive jurisdiction of the courts of the Western Cape, South Africa, unless applicable law requires otherwise."),
        ]),

        renderSection("14. Changes to Terms", [
          el("p", {}, "Project ERP (PTY) LTD may update these Terms from time to time. For material changes, at least 14 days' notice will be provided through the platform, by email, or by another reasonable means. Continued use after the notice period ends constitutes acceptance of the updated Terms."),
        ]),

        renderSection("15. Contact", [
          el("p", {}, "Questions about these Terms may be sent to legal@projecterp.co.za."),
        ]),
      ]),
    ]),
    renderSiteFooter({ setCurrentView }),
  ]);
}
