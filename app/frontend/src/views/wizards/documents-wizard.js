import { createGovernedWizardView } from "./shared.js";

export function renderDocumentsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "documents-setup",
    domainId: "documents",
    title: "Documents Setup",
    subtitleDomain: "documents",
    onCancel,
    fields: [
      {
        name: "root_folder_name",
        label: "Root folder name",
        type: "text",
        required: true,
        placeholder: "Company Documents",
      },
      {
        name: "subfolder_names",
        label: "Sub-folder names",
        type: "repeater",
        required: true,
        minItems: 1,
        placeholder: "Folder name",
        addLabel: "Add sub-folder",
      },
    ],
    getCapture(values) {
      return {
        root_folder_name: values.root_folder_name,
        subfolder_names: values.subfolder_names,
      };
    },
  });
}
