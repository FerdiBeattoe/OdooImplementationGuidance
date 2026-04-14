import { createGovernedWizardView } from "./shared.js";

export function renderUsersRolesWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "users-access",
    domainId: "users-roles",
    title: "Users & Roles Setup",
    subtitleDomain: "users and roles",
    onCancel,
    fields: [
      {
        name: "admin_user_email",
        label: "Admin user email",
        type: "email",
        required: true,
        placeholder: "admin@example.com",
      },
      {
        name: "admin_user_name",
        label: "Admin user name",
        type: "text",
        required: true,
        placeholder: "System Administrator",
      },
      {
        name: "create_sales_manager_role",
        label: "Whether to create separate sales manager role",
        type: "checkbox",
        checkboxLabel: "Create a separate sales manager role",
      },
      {
        name: "create_purchase_manager_role",
        label: "Whether to create separate purchase manager role",
        type: "checkbox",
        checkboxLabel: "Create a separate purchase manager role",
      },
    ],
    getCapture(values) {
      return {
        admin_user_email: values.admin_user_email,
        admin_user_name: values.admin_user_name,
        create_sales_manager_role: values.create_sales_manager_role,
        create_purchase_manager_role: values.create_purchase_manager_role,
      };
    },
  });
}
