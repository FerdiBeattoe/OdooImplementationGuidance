import { createGovernedWizardView } from "./shared.js";

export function renderRecruitmentWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "recruitment-setup",
    domainId: "recruitment",
    title: "Recruitment Setup",
    subtitleDomain: "recruitment",
    onCancel,
    fields: [
      {
        name: "pipeline_stages",
        label: "Recruitment pipeline stages",
        type: "repeater",
        required: true,
        minItems: 3,
        maxItems: 8,
        placeholder: "e.g. Qualified",
        addLabel: "Add stage",
        helpText: "A short opinionated pipeline is better than one no-one uses.",
      },
      {
        name: "first_role_title",
        label: "First open role title",
        type: "text",
        required: true,
        placeholder: "Operations Manager",
      },
      {
        name: "careers_page_published",
        label: "Publish careers page on the website",
        type: "checkbox",
        checkboxLabel: "Enable Website integration for applications",
      },
      {
        name: "jobs_alias_email",
        label: "Jobs email alias",
        type: "text",
        required: true,
        placeholder: "jobs@company.com",
        helpText: "CVs sent here become candidate records with the attachment.",
      },
      {
        name: "interview_template_name",
        label: "Default interview form name",
        type: "text",
        required: true,
        placeholder: "First-round interview – all roles",
      },
    ],
    getCapture(values) {
      return {
        pipeline_stages: values.pipeline_stages,
        first_role_title: values.first_role_title,
        careers_page_published: values.careers_page_published,
        jobs_alias_email: values.jobs_alias_email,
        interview_template_name: values.interview_template_name,
      };
    },
  });
}
