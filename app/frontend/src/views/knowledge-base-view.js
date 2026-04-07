import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";

const ARTICLES = [
  // Sales
  { id: "sales-1", cat: "Sales", title: "What is the Odoo Sales module?", desc: "Overview of the Sales module and its core features", content: "Odoo Sales manages your entire sales cycle from quotation to invoice. It integrates with CRM, Inventory, and Accounting to give you a complete order-to-cash workflow.\n\n**Key features:** Quotations, Sales Orders, Online Signing, Pricelists, Customer Portal.\n\n**Pro Tip:** Enable the customer portal so clients can view and sign quotes online — it dramatically speeds up the sales cycle." },
  { id: "sales-2", cat: "Sales", title: "Odoo 19 recommended sales setup order", desc: "Step-by-step guide for setting up Sales in the right order", content: "1. Configure Sales Settings (features, policies)\n2. Create Sales Teams\n3. Set up Pricelists and Currencies\n4. Configure Payment Terms\n5. Create Product Catalog\n6. Import Customers\n\n**Common mistake:** Setting up products before configuring the chart of accounts leads to missing tax mapping." },
  { id: "sales-3", cat: "Sales", title: "Common Sales configuration mistakes", desc: "Top mistakes to avoid when setting up Sales", content: "1. **Forgetting to set invoicing policy** — this affects when invoices are generated (on order vs on delivery).\n2. **Not enabling price lists** — if you sell to different customer segments at different prices, you need pricelists from day one.\n3. **Ignoring the sales team structure** — CRM pipeline stages are linked to sales teams. Plan these together.\n\n**Pro Tip:** Start with the simplest configuration and add complexity gradually." },
  // CRM
  { id: "crm-1", cat: "CRM", title: "What is the Odoo CRM module?", desc: "Understanding pipeline management and lead tracking", content: "Odoo CRM helps you track leads, manage your sales pipeline, and forecast revenue. It integrates directly with Sales, Email, and Calendar.\n\n**Key concepts:** Leads, Opportunities, Pipeline Stages, Activities, Lost Reasons." },
  { id: "crm-2", cat: "CRM", title: "CRM pipeline setup best practices", desc: "How to structure pipeline stages for your business", content: "Your pipeline should reflect your actual sales process. Typical stages:\n1. New / Incoming\n2. Qualified\n3. Proposal Sent\n4. Negotiation\n5. Won\n\nEach stage should have a win probability. Use 'Lost' and lost reasons to track why deals fail.\n\n**Pro Tip:** Keep your pipeline short (5-6 stages max). More stages = more admin." },
  { id: "crm-3", cat: "CRM", title: "Lead scoring and qualification in Odoo 19", desc: "Using predictive lead scoring", content: "Odoo 19 includes predictive lead scoring that uses AI to rank leads by likelihood of conversion.\n\n**Setup:** Enable in CRM Settings → Predictive Lead Mining.\n\n**Common mistake:** Not configuring lost reasons — this prevents Odoo from learning which lead types convert." },
  // Inventory
  { id: "inv-1", cat: "Inventory", title: "What is the Odoo Inventory module?", desc: "Stock management, warehouses and operations", content: "Odoo Inventory manages your physical stock across one or more warehouses. It handles receipts, deliveries, internal transfers, and manufacturing orders.\n\n**Key concepts:** Warehouses, Locations (hierarchical), Operation Types, Stock Moves, Lot/Serial Numbers." },
  { id: "inv-2", cat: "Inventory", title: "Inventory setup order for Odoo 19", desc: "Correct sequence for setting up inventory", content: "1. Create your warehouse(s) — only one needed for most SMEs\n2. Configure operation types (receipts, deliveries, returns)\n3. Set up routes (Buy, Manufacture, MTO)\n4. Enable lot/serial tracking if needed\n5. Import products\n6. Set initial stock quantities via Inventory Adjustments\n\n**Pro Tip:** Don't create hundreds of locations unless you genuinely need bin-level tracking." },
  { id: "inv-3", cat: "Inventory", title: "Common inventory mistakes", desc: "Pitfalls to avoid in Odoo Inventory", content: "1. **Setting up too many locations** before going live\n2. **Forgetting to set routes on products** — products need Buy or Manufacture route to trigger replenishment\n3. **Not setting up reordering rules** before go-live\n4. **Importing products without UoM** — this causes errors on purchase orders" },
  // Accounting
  { id: "acc-1", cat: "Accounting", title: "What is Odoo Accounting?", desc: "Full double-entry accounting in Odoo 19", content: "Odoo Accounting is a full double-entry accounting system. It handles invoicing, bills, bank reconciliation, tax returns, and financial reporting.\n\n**Key concepts:** Journal Entries, Chart of Accounts, Journals (Bank, Cash, Sales, Purchase), Tax Lines, Fiscal Positions." },
  { id: "acc-2", cat: "Accounting", title: "Accounting setup order in Odoo 19", desc: "Correct sequence for Accounting setup", content: "1. Select your country's Chart of Accounts\n2. Configure Journals (Bank accounts, Cash)\n3. Set up Taxes (VAT rates, tax groups)\n4. Configure Fiscal Positions (for international customers)\n5. Set Payment Terms\n6. Enter Opening Balances\n7. Configure Invoice numbering sequences\n\n**Pro Tip:** Install the localisation package for your country — it pre-loads the correct CoA, taxes, and reports." },
  { id: "acc-3", cat: "Accounting", title: "Bank reconciliation workflow", desc: "How to reconcile bank statements in Odoo 19", content: "1. Import bank statement (CSV/OFX) or connect live bank feed\n2. Odoo auto-matches most transactions\n3. Manually match unrecognised transactions\n4. Validate reconciliation\n\n**Common mistake:** Not entering opening bank balances before go-live. This causes your bank balance to be wrong from day one." },
  // HR
  { id: "hr-1", cat: "HR", title: "What is Odoo HR?", desc: "Human Resources management in Odoo 19", content: "Odoo HR covers employee records, contracts, leave management, attendance tracking, and payroll.\n\n**Key concepts:** Employees, Departments, Job Positions, Contracts, Leave Types, Payroll Structures." },
  { id: "hr-2", cat: "HR", title: "HR module setup order", desc: "How to set up HR correctly from the start", content: "1. Create Departments\n2. Create Job Positions (linked to departments)\n3. Configure Leave Types and allocations\n4. Set up Payroll Structures (salary rules)\n5. Create Employees and link to positions/departments\n6. Create Contracts\n\n**Pro Tip:** Set up payroll structure before creating employees, or you'll need to apply it manually to each." },
  { id: "hr-3", cat: "HR", title: "Common HR setup mistakes", desc: "Avoid these errors in HR configuration", content: "1. **Not setting up departments first** — employees can't be assigned without departments\n2. **Forgetting to set up leave allocations** — employees won't be able to request leave\n3. **Skipping the payroll structure** — required for payslip generation" },
  // Manufacturing
  { id: "mfg-1", cat: "Manufacturing", title: "What is Odoo Manufacturing?", desc: "MRP, BOM and production orders", content: "Odoo Manufacturing handles production planning, Bill of Materials (BOM), work orders, and workcenter management.\n\n**Key concepts:** BOM (Bill of Materials), Manufacturing Orders, Workcenters, Operations, Routings." },
  { id: "mfg-2", cat: "Manufacturing", title: "Manufacturing setup order", desc: "Step-by-step manufacturing configuration", content: "1. Enable Work Orders in settings (if needed)\n2. Create Workcenters with capacity and efficiency\n3. Define Operations (routing steps)\n4. Create Bills of Materials\n5. Configure inventory routes (Manufacture)\n6. Test with a manufacturing order\n\n**Pro Tip:** Start with simple BOMs (2-3 levels max) before introducing complex multi-level structures." },
  { id: "mfg-3", cat: "Manufacturing", title: "BOM types explained", desc: "Manufacture, Kit, Subcontracting", content: "**Manufacture:** Standard MO-based production.\n**Kit:** Components are sold as a bundle but not manufactured (sold as a product set).\n**Subcontracting:** Components sent to a vendor for assembly.\n\n**Common mistake:** Using Kit type when you mean Manufacture — Kits don't create manufacturing orders." },
  // Technical
  { id: "tech-1", cat: "Technical", title: "Odoo 19 JSON-RPC API guide", desc: "How to interact with Odoo's API", content: "Odoo 19 uses JSON-RPC 2.0 for all model operations.\n\n**Authentication:** POST /web/session/authenticate\n**Model operations:** POST /web/dataset/call_kw\n\n**Common fields:**\n- model: 'res.company'\n- method: 'read', 'write', 'create', 'search_read'\n- args: [domain, fields]\n- kwargs: {context: {lang: 'en_US'}}" },
  { id: "tech-2", cat: "Technical", title: "Common Odoo 19 model names", desc: "Reference for Odoo 19 model names", content: "- Company: res.company\n- User: res.users\n- Partner: res.partner\n- Product: product.template\n- Product variant: product.product\n- Sales Order: sale.order\n- Invoice: account.move\n- Bill: account.move (type=in_invoice)\n- Employee: hr.employee\n- Manufacturing Order: mrp.production\n- BOM: mrp.bom\n- Warehouse: stock.warehouse" },
  { id: "tech-3", cat: "Technical", title: "Debugging Odoo API errors", desc: "How to read and handle Odoo error responses", content: "Odoo API errors come in the 'error' field of the JSON-RPC response.\n\n**Common errors:**\n- AccessDenied: Wrong password or insufficient access\n- ValidationError: Field validation failed\n- UserError: Business logic error\n- Warning: Non-blocking warning\n\n**Pro Tip:** Check the 'data.message' field in the error object for the human-readable message." }
];

const CATEGORIES = ["All", "Sales", "CRM", "Inventory", "Accounting", "HR", "Manufacturing", "Technical"];

const CATEGORY_COLORS = {
  "Sales": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
  "CRM": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
  "Inventory": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
  "Accounting": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
  "HR": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
  "Manufacturing": { bg: "rgba(245,158,11,0.08)", color: "#92400e" },
  "Technical": { bg: "rgba(12,26,48,0.06)", color: "#0c1a30" }
};

export function renderKnowledgeBaseView() {
  let activeCategory = "All";
  let searchQuery = "";
  let activeArticle = null;

  const container = el("div", { style: "max-width: 1000px; margin: 0 auto; padding: 32px;" });

  function filteredArticles() {
    return ARTICLES.filter(a => {
      const matchesCat = activeCategory === "All" || a.cat === activeCategory;
      const matchesSearch = !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);

    if (activeArticle) {
      container.append(buildArticleDetail(activeArticle, () => { activeArticle = null; render(); }));
      return;
    }

    container.append(buildListView());
  }

  function buildListView() {
    const articles = filteredArticles();

    return el("div", { style: "display: flex; flex-direction: column; gap: 24px;" }, [
      // Header
      el("div", {}, [
        el("p", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px;", text: "HELP & GUIDES" }),
        el("h2", { style: "font-family: var(--font-headline); font-size: 28px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug);", text: "Knowledge Base" })
      ]),
      
      // Search bar
      el("div", { style: "position: relative;" }, [
        (() => { const ic = lucideIcon("search", 20); ic.style.cssText = "position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"; return ic; })(),
        el("input", {
          type: "search",
          style: "width: 100%; height: 44px; padding: 0 16px 0 44px; font-family: var(--font-body); font-size: 14px; background: var(--color-surface); border: 1px solid #e2e8f0; border-radius: 6px;",
          placeholder: "Search articles...",
          value: searchQuery,
          onInput: (e) => { searchQuery = e.target.value; render(); }
        })
      ]),
      
      // Category tabs
      el("div", { style: "display: flex; gap: 4px; overflow-x: auto; padding-bottom: 4px;" },
        CATEGORIES.map(cat => {
          const isActive = cat === activeCategory;
          return el("button", {
            style: `flex-shrink: 0; padding: 8px 16px; font-family: var(--font-label); font-size: 13px; cursor: pointer; transition: all 150ms ease; border: none; border-bottom: 2px solid ${isActive ? "#f59e0b" : "transparent"}; color: ${isActive ? "#0c1a30" : "#64748b"}; font-weight: ${isActive ? "600" : "500"}; background: ${isActive ? "transparent" : "transparent"};`,
            onmouseenter: (e) => { if (!isActive) e.target.style.background = "var(--color-surface-container-low)"; },
            onmouseleave: (e) => { if (!isActive) e.target.style.background = "transparent"; },
            onclick: () => { activeCategory = cat; render(); }
          }, [el("span", { text: cat })])
        })
      ),
      
      // Article grid
      articles.length === 0
        ? el("div", { style: "text-align: center; padding: 48px; color: var(--color-on-surface-variant);" }, [
            (() => { const ic = lucideIcon("search-x", 48); ic.style.cssText = "display: block; margin: 0 auto 16px; opacity: 0.3;"; return ic; })(),
            el("p", { style: "font-family: var(--font-body); font-size: 14px;", text: "No articles found. Try a different search or category." })
          ])
        : el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;" },
            articles.map(article => buildArticleCard(article, () => { activeArticle = article; render(); }))
          )
    ]);
  }

  function buildArticleCard(article, onRead) {
    const colors = CATEGORY_COLORS[article.cat] || CATEGORY_COLORS["Technical"];
    
    return el("div", {
      style: "background: var(--color-surface); border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; cursor: pointer; transition: all 150ms ease; display: flex; flex-direction: column;",
      onmouseenter: (e) => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.background = "var(--color-surface-container-low)"; },
      onmouseleave: (e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "var(--color-surface)"; },
      onclick: onRead
    }, [
      // Category badge
      el("span", { 
        style: `display: inline-block; font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); padding: 2px 8px; margin-bottom: 12px; background: ${colors.bg}; color: ${colors.color}; border: 1px solid rgba(245,158,11,0.2); border-radius: 6px;`,
        text: article.cat
      }),
      // Title
      el("h4", { style: "font-family: var(--font-headline); font-size: 15px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 8px; flex: 1;", text: article.title }),
      // Description
      el("p", { style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-surface-variant); margin-bottom: 16px; line-height: 1.5;", text: article.desc }),
      // Read link
      el("button", {
        style: "align-self: flex-start; font-family: var(--font-label); font-size: 12px; font-weight: 600; color: #92400e; background: none; border: none; cursor: pointer; padding: 0; text-decoration: none;",
        onmouseenter: (e) => e.target.style.textDecoration = "underline",
        onmouseleave: (e) => e.target.style.textDecoration = "none",
        onclick: (e) => { e.stopPropagation(); onRead(); }
      }, [el("span", { text: "Read →" })])
    ]);
  }

  function buildArticleDetail(article, onBack) {
    const related = ARTICLES.filter(a => a.cat === article.cat && a.id !== article.id).slice(0, 3);
    const contentParagraphs = article.content.split("\n").filter(Boolean);
    const colors = CATEGORY_COLORS[article.cat] || CATEGORY_COLORS["Technical"];

    return el("div", { style: "max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;" }, [
      // Back button
      el("button", {
        style: "display: flex; align-items: center; gap: 8px; font-family: var(--font-label); font-size: 13px; font-weight: 500; color: var(--color-on-surface-variant); background: none; border: none; cursor: pointer; padding: 0;",
        onmouseenter: (e) => e.target.style.color = "var(--color-primary)",
        onmouseleave: (e) => e.target.style.color = "var(--color-on-surface-variant)",
        onclick: onBack
      }, [
        lucideIcon("arrow-left", 18),
        el("span", { text: "Back to Knowledge Base" })
      ]),
      
      // Article card
      el("div", { style: "background: var(--color-surface); box-shadow: var(--shadow-card); overflow: hidden;" }, [
        // Header
        el("div", { style: "padding: 24px 32px; border-bottom: 1px solid var(--color-surface-container-low);" }, [
          el("span", { 
            style: `display: inline-block; font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); padding: 2px 8px; margin-bottom: 12px; background: ${colors.bg}; color: ${colors.color};`,
            text: article.cat 
          }),
          el("h2", { style: "font-family: var(--font-headline); font-size: 24px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug); margin-bottom: 8px;", text: article.title }),
          el("p", { style: "font-family: var(--font-body); font-size: 14px; color: var(--color-on-surface-variant);", text: article.desc })
        ]),
        
        // Content
        el("div", { style: "padding: 24px 32px; display: flex; flex-direction: column; gap: 16px;" },
          contentParagraphs.map(para => {
            if (para.startsWith("**Pro Tip:**")) {
              return el("div", { style: "background: var(--color-primary-subtle); border-left: 3px solid var(--color-primary); padding: 16px 20px;" }, [
                el("p", { style: "font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-on-surface); margin: 0;", text: para })
              ]);
            }
            if (para.startsWith("**Common mistake:**") || para.startsWith("**Common error:**")) {
              return el("div", { style: "background: var(--color-error-container); border-left: 3px solid var(--color-error); padding: 16px 20px;" }, [
                el("p", { style: "font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-on-error-container); margin: 0;", text: para })
              ]);
            }
            if (para.match(/^\d+\./)) {
              return el("p", { style: "font-family: var(--font-body); font-size: 14px; color: var(--color-on-surface); line-height: 1.6; margin: 0; padding-left: 16px; position: relative;", text: para });
            }
            return el("p", { style: "font-family: var(--font-body); font-size: 14px; color: var(--color-on-surface); line-height: 1.6; margin: 0;", text: para });
          })
        )
      ]),
      
      // Related articles
      related.length > 0
        ? el("div", { style: "display: flex; flex-direction: column; gap: 12px;" }, [
            el("h4", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 700; color: var(--color-on-surface-variant); text-transform: uppercase; letter-spacing: var(--ls-widest);", text: "Related Articles" }),
            el("div", { style: "display: flex; flex-direction: column; gap: 8px;" },
              related.map(r => el("div", {
                style: "background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 150ms ease;",
                onmouseenter: (e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.background = "var(--color-surface-container-low)"; },
                onmouseleave: (e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.background = "var(--color-surface)"; },
                onclick: () => { activeArticle = r; render(); }
              }, [
                el("span", { style: "font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--color-on-surface);", text: r.title }),
                (() => { const ic = lucideIcon("chevron-right", 20); ic.style.color = "#64748b"; return ic; })()
              ]))
            )
          ])
        : null
    ]);
  }

  render();
  return container;
}
