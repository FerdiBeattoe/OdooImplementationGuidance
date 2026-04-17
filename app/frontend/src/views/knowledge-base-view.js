import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";

const KB_VERSION = "1.0";

const ARTICLES = [
  { id: "sales-1", cat: "Sales", title: "What is the Odoo Sales module?", desc: "Overview of the Sales module and its core features", content: "Odoo Sales manages your entire sales cycle from quotation to invoice. It integrates with CRM, Inventory, and Accounting to give you a complete order-to-cash workflow.\n\n**Key features:** Quotations, Sales Orders, Online Signing, Pricelists, Customer Portal.\n\n**Pro Tip:** Enable the customer portal so clients can view and sign quotes online — it dramatically speeds up the sales cycle." },
  { id: "sales-2", cat: "Sales", title: "Odoo 19 recommended sales setup order", desc: "Step-by-step guide for setting up Sales in the right order", content: "1. Configure Sales Settings (features, policies)\n2. Create Sales Teams\n3. Set up Pricelists and Currencies\n4. Configure Payment Terms\n5. Create Product Catalog\n6. Import Customers\n\n**Common mistake:** Setting up products before configuring the chart of accounts leads to missing tax mapping." },
  { id: "sales-3", cat: "Sales", title: "Common Sales configuration mistakes", desc: "Top mistakes to avoid when setting up Sales", content: "1. **Forgetting to set invoicing policy** — this affects when invoices are generated (on order vs on delivery).\n2. **Not enabling price lists** — if you sell to different customer segments at different prices, you need pricelists from day one.\n3. **Ignoring the sales team structure** — CRM pipeline stages are linked to sales teams. Plan these together.\n\n**Pro Tip:** Start with the simplest configuration and add complexity gradually." },
  { id: "crm-1", cat: "CRM", title: "What is the Odoo CRM module?", desc: "Understanding pipeline management and lead tracking", content: "Odoo CRM helps you track leads, manage your sales pipeline, and forecast revenue. It integrates directly with Sales, Email, and Calendar.\n\n**Key concepts:** Leads, Opportunities, Pipeline Stages, Activities, Lost Reasons." },
  { id: "crm-2", cat: "CRM", title: "CRM pipeline setup best practices", desc: "How to structure pipeline stages for your business", content: "Your pipeline should reflect your actual sales process. Typical stages:\n1. New / Incoming\n2. Qualified\n3. Proposal Sent\n4. Negotiation\n5. Won\n\nEach stage should have a win probability. Use 'Lost' and lost reasons to track why deals fail.\n\n**Pro Tip:** Keep your pipeline short (5-6 stages max). More stages = more admin." },
  { id: "crm-3", cat: "CRM", title: "Lead scoring and qualification in Odoo 19", desc: "Using predictive lead scoring", content: "Odoo 19 includes predictive lead scoring that uses AI to rank leads by likelihood of conversion.\n\n**Setup:** Enable in CRM Settings → Predictive Lead Mining.\n\n**Common mistake:** Not configuring lost reasons — this prevents Odoo from learning which lead types convert." },
  { id: "inv-1", cat: "Inventory", title: "What is the Odoo Inventory module?", desc: "Stock management, warehouses and operations", content: "Odoo Inventory manages your physical stock across one or more warehouses. It handles receipts, deliveries, internal transfers, and manufacturing orders.\n\n**Key concepts:** Warehouses, Locations (hierarchical), Operation Types, Stock Moves, Lot/Serial Numbers." },
  { id: "inv-2", cat: "Inventory", title: "Inventory setup order for Odoo 19", desc: "Correct sequence for setting up inventory", content: "1. Create your warehouse(s) — only one needed for most SMEs\n2. Configure operation types (receipts, deliveries, returns)\n3. Set up routes (Buy, Manufacture, MTO)\n4. Enable lot/serial tracking if needed\n5. Import products\n6. Set initial stock quantities via Inventory Adjustments\n\n**Pro Tip:** Don't create hundreds of locations unless you genuinely need bin-level tracking." },
  { id: "inv-3", cat: "Inventory", title: "Common inventory mistakes", desc: "Pitfalls to avoid in Odoo Inventory", content: "1. **Setting up too many locations** before going live\n2. **Forgetting to set routes on products** — products need Buy or Manufacture route to trigger replenishment\n3. **Not setting up reordering rules** before go-live\n4. **Importing products without UoM** — this causes errors on purchase orders" },
  { id: "acc-1", cat: "Accounting", title: "What is Odoo Accounting?", desc: "Full double-entry accounting in Odoo 19", content: "Odoo Accounting is a full double-entry accounting system. It handles invoicing, bills, bank reconciliation, tax returns, and financial reporting.\n\n**Key concepts:** Journal Entries, Chart of Accounts, Journals (Bank, Cash, Sales, Purchase), Tax Lines, Fiscal Positions." },
  { id: "acc-2", cat: "Accounting", title: "Accounting setup order in Odoo 19", desc: "Correct sequence for Accounting setup", content: "1. Select your country's Chart of Accounts\n2. Configure Journals (Bank accounts, Cash)\n3. Set up Taxes (VAT rates, tax groups)\n4. Configure Fiscal Positions (for international customers)\n5. Set Payment Terms\n6. Enter Opening Balances\n7. Configure Invoice numbering sequences\n\n**Pro Tip:** Install the localisation package for your country — it pre-loads the correct CoA, taxes, and reports." },
  { id: "acc-3", cat: "Accounting", title: "Bank reconciliation workflow", desc: "How to reconcile bank statements in Odoo 19", content: "1. Import bank statement (CSV/OFX) or connect live bank feed\n2. Odoo auto-matches most transactions\n3. Manually match unrecognised transactions\n4. Validate reconciliation\n\n**Common mistake:** Not entering opening bank balances before go-live. This causes your bank balance to be wrong from day one." },
  { id: "hr-1", cat: "HR", title: "What is Odoo HR?", desc: "Human Resources management in Odoo 19", content: "Odoo HR covers employee records, contracts, leave management, attendance tracking, and payroll.\n\n**Key concepts:** Employees, Departments, Job Positions, Contracts, Leave Types, Payroll Structures." },
  { id: "hr-2", cat: "HR", title: "HR module setup order", desc: "How to set up HR correctly from the start", content: "1. Create Departments\n2. Create Job Positions (linked to departments)\n3. Configure Leave Types and allocations\n4. Set up Payroll Structures (salary rules)\n5. Create Employees and link to positions/departments\n6. Create Contracts\n\n**Pro Tip:** Set up payroll structure before creating employees, or you'll need to apply it manually to each." },
  { id: "hr-3", cat: "HR", title: "Common HR setup mistakes", desc: "Avoid these errors in HR configuration", content: "1. **Not setting up departments first** — employees can't be assigned without departments\n2. **Forgetting to set up leave allocations** — employees won't be able to request leave\n3. **Skipping the payroll structure** — required for payslip generation" },
  { id: "mfg-1", cat: "Manufacturing", title: "What is Odoo Manufacturing?", desc: "MRP, BOM and production orders", content: "Odoo Manufacturing handles production planning, Bill of Materials (BOM), work orders, and workcenter management.\n\n**Key concepts:** BOM (Bill of Materials), Manufacturing Orders, Workcenters, Operations, Routings." },
  { id: "mfg-2", cat: "Manufacturing", title: "Manufacturing setup order", desc: "Step-by-step manufacturing configuration", content: "1. Enable Work Orders in settings (if needed)\n2. Create Workcenters with capacity and efficiency\n3. Define Operations (routing steps)\n4. Create Bills of Materials\n5. Configure inventory routes (Manufacture)\n6. Test with a manufacturing order\n\n**Pro Tip:** Start with simple BOMs (2-3 levels max) before introducing complex multi-level structures." },
  { id: "mfg-3", cat: "Manufacturing", title: "BOM types explained", desc: "Manufacture, Kit, Subcontracting", content: "**Manufacture:** Standard MO-based production.\n**Kit:** Components are sold as a bundle but not manufactured (sold as a product set).\n**Subcontracting:** Components sent to a vendor for assembly.\n\n**Common mistake:** Using Kit type when you mean Manufacture — Kits don't create manufacturing orders." },
  { id: "tech-1", cat: "Technical", title: "Odoo 19 JSON-RPC API guide", desc: "How to interact with Odoo's API", content: "Odoo 19 uses JSON-RPC 2.0 for all model operations.\n\n**Authentication:** POST /web/session/authenticate\n**Model operations:** POST /web/dataset/call_kw\n\n**Common fields:**\n- model: 'res.company'\n- method: 'read', 'write', 'create', 'search_read'\n- args: [domain, fields]\n- kwargs: {context: {lang: 'en_US'}}" },
  { id: "tech-2", cat: "Technical", title: "Common Odoo 19 model names", desc: "Reference for Odoo 19 model names", content: "- Company: res.company\n- User: res.users\n- Partner: res.partner\n- Product: product.template\n- Product variant: product.product\n- Sales Order: sale.order\n- Invoice: account.move\n- Bill: account.move (type=in_invoice)\n- Employee: hr.employee\n- Manufacturing Order: mrp.production\n- BOM: mrp.bom\n- Warehouse: stock.warehouse" },
  { id: "tech-3", cat: "Technical", title: "Debugging Odoo API errors", desc: "How to read and handle Odoo error responses", content: "Odoo API errors come in the 'error' field of the JSON-RPC response.\n\n**Common errors:**\n- AccessDenied: Wrong password or insufficient access\n- ValidationError: Field validation failed\n- UserError: Business logic error\n- Warning: Non-blocking warning\n\n**Pro Tip:** Check the 'data.message' field in the error object for the human-readable message." }
];

const CATEGORIES = ["All", "Sales", "CRM", "Inventory", "Accounting", "HR", "Manufacturing", "Technical"];

// ── Token-based style constants ───────────────────────────────

const CANVAS_STYLE =
  "min-height: 100vh; background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), var(--color-canvas-base), var(--surface-texture); padding: var(--space-8) var(--space-5) var(--space-12); font-family: var(--font-body); color: var(--color-ink); box-sizing: border-box;";

const TWO_COL_STYLE =
  "max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 260px 1fr; gap: var(--space-7);";

const SINGLE_COL_STYLE =
  "max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; padding: 4px 12px; border: 1px solid var(--color-line); border-radius: var(--radius-pill); background: var(--color-surface); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);";

const HERO_H1 =
  "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600; letter-spacing: var(--track-tight); line-height: var(--lh-snug); color: var(--color-ink); margin: 0;";

const HERO_SUB =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0;";

const LEFT_NAV_STYLE =
  "position: sticky; top: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); align-self: start;";

const NAV_ROW_BASE =
  "display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: 8px var(--space-3); font-family: var(--font-body); font-size: var(--fs-body); border: none; border-radius: var(--radius-input); background: none; cursor: pointer; text-align: left; transition: all var(--dur-fast) var(--ease);";

const CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5); cursor: pointer; transition: all var(--dur-base) var(--ease); display: flex; flex-direction: column;";

const CHIP_STYLE =
  "display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); background: var(--color-chip-bg); color: var(--color-chip-fg); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow); margin-bottom: var(--space-3);";

export function renderKnowledgeBaseView() {
  let activeCategory = "All";
  let searchQuery = "";
  let activeArticle = null;

  const canvas = el("div", { style: CANVAS_STYLE });

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
    while (canvas.firstChild) canvas.removeChild(canvas.firstChild);

    if (activeArticle) {
      const single = el("div", { style: SINGLE_COL_STYLE });
      single.append(buildArticleDetail(activeArticle, () => { activeArticle = null; render(); }));
      canvas.append(single);
      return;
    }

    canvas.append(buildListView());
  }

  function buildNav() {
    const counts = {};
    CATEGORIES.forEach(c => { counts[c] = 0; });
    ARTICLES.forEach(a => {
      counts[a.cat] = (counts[a.cat] || 0) + 1;
      counts["All"] = counts["All"] + 1;
    });

    const searchInput = el("input", {
      type: "search",
      style: "width: 100%; height: 36px; padding: 0 var(--space-3); font-family: var(--font-body); font-size: var(--fs-small); background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-input); color: var(--color-ink); outline: none; box-sizing: border-box; margin-bottom: var(--space-3);",
      placeholder: "Search articles…",
      value: searchQuery,
      oninput: (e) => { searchQuery = e.target.value; render(); }
    });

    const navRows = CATEGORIES.map(cat => {
      const isActive = cat === activeCategory;
      const rowStyle = isActive
        ? `${NAV_ROW_BASE} background: var(--color-line-soft); color: var(--color-ink); font-weight: 500;`
        : `${NAV_ROW_BASE} color: var(--color-body);`;
      return el("button", {
        style: rowStyle,
        onclick: () => { activeCategory = cat; render(); }
      }, [
        el("span", { text: cat }),
        el("span", {
          style: "font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted);",
          text: String(counts[cat] || 0)
        })
      ]);
    });

    return el("nav", { style: LEFT_NAV_STYLE }, [
      el("div", { style: "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle); margin-bottom: var(--space-2);", text: "BROWSE" }),
      searchInput,
      ...navRows
    ]);
  }

  function buildListView() {
    const articles = filteredArticles();

    const hero = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-5);" }, [
      el("span", { style: EYEBROW_STYLE, text: `KNOWLEDGE · v${KB_VERSION}` }),
      el("h1", { style: HERO_H1 }, [
        el("span", { text: "Knowledge " }),
        el("span", { style: "color: var(--color-muted);", text: "base" })
      ]),
      el("p", { style: HERO_SUB, text: `${ARTICLES.length} articles across ${CATEGORIES.length - 1} categories.` })
    ]);

    const grid = articles.length === 0
      ? el("div", { style: "text-align: center; padding: var(--space-12); color: var(--color-muted);" }, [
          (() => { const ic = lucideIcon("search-x", 48); ic.style.cssText = "display: block; margin: 0 auto var(--space-3); opacity: 0.3;"; return ic; })(),
          el("p", { style: "font-family: var(--font-body); font-size: var(--fs-body);", text: "No articles found. Try a different search or category." })
        ])
      : el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4);" },
          articles.map(article => buildArticleCard(article, () => { activeArticle = article; render(); }))
        );

    return el("div", { style: TWO_COL_STYLE }, [
      buildNav(),
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-5);" }, [
        hero,
        grid
      ])
    ]);
  }

  function buildArticleCard(article, onRead) {
    const card = el("div", {
      style: CARD_STYLE,
      onclick: onRead
    }, [
      el("span", { style: CHIP_STYLE, text: article.cat }),
      el("h4", { style: "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 500; color: var(--color-ink); margin: 0 0 var(--space-2); letter-spacing: var(--track-tight); line-height: var(--lh-snug); flex: 1;", text: article.title }),
      el("p", { style: "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-body); margin: 0 0 var(--space-4); line-height: var(--lh-body);", text: article.desc }),
      el("button", {
        style: "align-self: flex-start; font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; color: var(--color-ink); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px;",
        onclick: (e) => { e.stopPropagation(); onRead(); }
      }, [el("span", { text: "Read →" })])
    ]);
    card.onmouseenter = () => { card.style.borderColor = "var(--color-ink)"; card.style.boxShadow = "var(--shadow-raised)"; };
    card.onmouseleave = () => { card.style.borderColor = "var(--color-line)"; card.style.boxShadow = "none"; };
    return card;
  }

  function buildArticleDetail(article, onBack) {
    const related = ARTICLES.filter(a => a.cat === article.cat && a.id !== article.id).slice(0, 3);
    const contentParagraphs = article.content.split("\n").filter(Boolean);

    return el("div", { style: "display: flex; flex-direction: column; gap: var(--space-6);" }, [
      el("button", {
        style: "align-self: flex-start; display: flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; color: var(--color-muted); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px;",
        onclick: onBack
      }, [
        lucideIcon("arrow-left", 16),
        el("span", { text: "Back to Knowledge Base" })
      ]),

      el("article", {}, [
        el("span", { style: CHIP_STYLE, text: article.cat }),
        el("h1", { style: "font-family: var(--font-display); font-size: var(--fs-display); font-weight: 600; color: var(--color-ink); letter-spacing: var(--track-tight); line-height: var(--lh-tight); margin: 0 0 var(--space-3);", text: article.title }),
        el("p", { style: "font-family: var(--font-body); font-size: var(--fs-h3); color: var(--color-body); line-height: var(--lh-body); margin: 0 0 var(--space-6);", text: article.desc }),

        el("div", { style: "display: flex; flex-direction: column; gap: var(--space-4);" },
          contentParagraphs.map(para => {
            if (para.startsWith("**Pro Tip:**")) {
              return el("div", { style: "background: var(--color-line-soft); border-left: 3px solid var(--color-ink); padding: var(--space-4) var(--space-5); border-radius: 0 var(--radius-panel) var(--radius-panel) 0;" }, [
                el("p", { style: "font-family: var(--font-body); font-size: var(--fs-body); font-weight: 500; color: var(--color-ink); margin: 0; line-height: var(--lh-body);", text: para })
              ]);
            }
            if (para.startsWith("**Common mistake:**") || para.startsWith("**Common error:**")) {
              return el("div", { style: "background: var(--color-chip-review-bg); border-left: 3px solid var(--color-chip-review-fg); padding: var(--space-4) var(--space-5); border-radius: 0 var(--radius-panel) var(--radius-panel) 0;" }, [
                el("p", { style: "font-family: var(--font-body); font-size: var(--fs-body); font-weight: 500; color: var(--color-chip-review-fg); margin: 0; line-height: var(--lh-body);", text: para })
              ]);
            }
            return el("p", { style: "font-family: var(--font-body); font-size: var(--fs-body); color: var(--color-body); line-height: var(--lh-body); margin: 0;", text: para });
          })
        ),

        el("div", { style: "margin-top: var(--space-8); padding-top: var(--space-5); border-top: 1px solid var(--color-line); display: flex; align-items: center; gap: var(--space-3); font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted);" }, [
          el("span", { text: `Article · ${article.cat}` }),
          el("span", { text: "·" }),
          el("span", { text: `KB v${KB_VERSION}` })
        ])
      ]),

      related.length > 0
        ? el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
            el("h4", { style: "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; color: var(--color-subtle); text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); margin: 0;", text: "RELATED ARTICLES" }),
            el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" },
              related.map(r => {
                const row = el("div", {
                  style: "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-3) var(--space-5); display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all var(--dur-fast) var(--ease);",
                  onclick: () => { activeArticle = r; render(); }
                }, [
                  el("span", { style: "font-family: var(--font-body); font-size: var(--fs-body); font-weight: 500; color: var(--color-ink);", text: r.title }),
                  (() => { const ic = lucideIcon("chevron-right", 18); ic.style.color = "var(--color-muted)"; return ic; })()
                ]);
                row.onmouseenter = () => { row.style.borderColor = "var(--color-ink)"; };
                row.onmouseleave = () => { row.style.borderColor = "var(--color-line)"; };
                return row;
              })
            )
          ])
        : null
    ]);
  }

  render();
  return canvas;
}
