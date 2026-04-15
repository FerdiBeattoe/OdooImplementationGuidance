import { createGovernedWizardView } from "./shared.js";

export function renderAttendanceWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "attendance-setup",
    domainId: "attendance",
    title: "Attendance Setup",
    subtitleDomain: "attendance",
    onCancel,
    fields: [
      {
        name: "tracking_mode",
        label: "Attendance tracking mode",
        type: "select",
        required: true,
        options: [
          { value: "kiosk_badge", label: "Kiosk / badge scan" },
          { value: "mobile_app", label: "Mobile app" },
          { value: "manual_entry", label: "Manual entry by supervisor" },
        ],
        helpText: "Mixing modes makes overtime and payroll reconciliation unreliable — pick one.",
      },
      {
        name: "kiosk_manager_pin_required",
        label: "Kiosk manager PIN required",
        type: "checkbox",
        checkboxLabel: "Require a manager PIN to prevent buddy-punching",
      },
      {
        name: "overtime_threshold_hours",
        label: "Overtime threshold per day (hours)",
        type: "number",
        required: true,
        min: "0",
        step: "0.25",
        placeholder: "8",
      },
      {
        name: "tolerance_minutes",
        label: "Tolerance before lateness flag (minutes)",
        type: "number",
        required: true,
        min: "0",
        step: "1",
        placeholder: "5",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.overtime_threshold_hours))) {
        errors.overtime_threshold_hours = "Overtime threshold must be a valid number.";
      }
      if (!Number.isFinite(Number(values.tolerance_minutes))) {
        errors.tolerance_minutes = "Tolerance must be a valid number.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        tracking_mode: values.tracking_mode,
        kiosk_manager_pin_required: values.kiosk_manager_pin_required,
        overtime_threshold_hours: values.overtime_threshold_hours,
        tolerance_minutes: values.tolerance_minutes,
      };
    },
  });
}
