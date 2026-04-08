export const DOMAINS = [
  "Foundation / Company / Localization",
  "Users / Roles / Security",
  "Master Data",
  "CRM",
  "Sales",
  "Purchase",
  "Inventory",
  "Manufacturing (MRP)",
  "PLM",
  "Accounting",
  "POS",
  "Website / eCommerce",
  "Projects",
  "HR",
  "Quality",
  "Documents",
  "Sign",
  "Approvals"
]
  .map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label }))
  .concat([
    { id: "field-service", label: "Field Service" },
    { id: "maintenance", label: "Maintenance" },
    { id: "rental", label: "Rental" },
    { id: "repairs", label: "Repairs" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "timesheets", label: "Timesheets" },
    { id: "expenses", label: "Expenses" },
    { id: "attendance", label: "Attendance" },
    { id: "recruitment", label: "Recruitment" },
    { id: "fleet", label: "Fleet" },
    { id: "events", label: "Events" },
    { id: "email-marketing", label: "Email Marketing" },
    { id: "helpdesk", label: "Helpdesk" },
    { id: "payroll", label: "Payroll" },
    { id: "planning", label: "Planning" },
    { id: "knowledge", label: "Knowledge" }
  ]);
