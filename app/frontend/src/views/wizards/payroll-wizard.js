import { createGovernedWizardView } from "./shared.js";

export function renderPayrollWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "payroll-setup",
    domainId: "payroll",
    title: "Payroll Setup",
    subtitleDomain: "payroll",
    onCancel,
    fields: [
      {
        name: "country_localisation",
        label: "Payroll localisation (country)",
        type: "text",
        required: true,
        placeholder: "e.g. United Kingdom",
        helpText: "Drives statutory rules, deductions, and payslip format.",
      },
      {
        name: "pay_frequency",
        label: "Pay frequency",
        type: "select",
        required: true,
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "semi_monthly", label: "Semi-monthly (twice per month)" },
          { value: "biweekly", label: "Biweekly (every two weeks)" },
          { value: "weekly", label: "Weekly" },
        ],
      },
      {
        name: "default_salary_structure",
        label: "Default salary structure name",
        type: "text",
        required: true,
        placeholder: "Standard Employee",
      },
      {
        name: "parallel_run_period",
        label: "Parallel run period (against current system)",
        type: "text",
        required: true,
        placeholder: "e.g. 2026-03 pay period",
        helpText: "Run one full period in parallel and match line-by-line before cutover.",
      },
      {
        name: "attendance_integration",
        label: "Feed hours from Attendance / Timesheets",
        type: "checkbox",
        checkboxLabel: "Use Work Entries to pull paid hours from Attendance and Timesheets",
      },
      {
        name: "finance_sign_off_obtained",
        label: "Written sign-off from finance and HR obtained before cutover",
        type: "checkbox",
        checkboxLabel: "Both finance and HR have confirmed the parallel run matches",
      },
    ],
    getCapture(values) {
      return {
        country_localisation: values.country_localisation,
        pay_frequency: values.pay_frequency,
        default_salary_structure: values.default_salary_structure,
        parallel_run_period: values.parallel_run_period,
        attendance_integration: values.attendance_integration,
        finance_sign_off_obtained: values.finance_sign_off_obtained,
      };
    },
  });
}
