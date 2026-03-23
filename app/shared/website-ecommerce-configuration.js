export const WEBSITE_ECOMMERCE_CONFIGURATION_SECTIONS = [
  {
    id: "storefrontCapture",
    label: "Storefront policy capture",
    description: "Capture website scope and storefront policy assumptions for implementation planning only. This is not live-system proof.",
    checkpointId: "checkpoint-website-catalog-publication"
  },
  {
    id: "checkoutCapture",
    label: "Checkout baseline capture",
    description: "Capture checkout policy and payment assumptions for bounded implementation planning only.",
    checkpointId: "checkpoint-website-checkout-baseline"
  },
  {
    id: "deliveryHandoffCapture",
    label: "Delivery handoff capture",
    description: "Capture downstream delivery assumption context without expanding into cross-domain execution behavior.",
    checkpointId: "checkpoint-website-delivery-handoff"
  }
];

export function createWebsiteEcommerceConfigurationState() {
  return {
    storefrontCapture: [],
    checkoutCapture: [],
    deliveryHandoffCapture: []
  };
}

export function normalizeWebsiteEcommerceConfigurationState(state = {}) {
  return {
    storefrontCapture: normalizeWebsiteRecords("storefrontCapture", state?.storefrontCapture),
    checkoutCapture: normalizeWebsiteRecords("checkoutCapture", state?.checkoutCapture),
    deliveryHandoffCapture: normalizeWebsiteRecords("deliveryHandoffCapture", state?.deliveryHandoffCapture)
  };
}

export function addWebsiteEcommerceConfigurationRecord(state, sectionId) {
  const nextState = structuredClone(state);
  const configuration = normalizeWebsiteEcommerceConfigurationState(nextState.websiteEcommerceConfiguration);
  const record = createWebsiteEcommerceConfigurationRecord(sectionId);

  configuration[sectionId] = [...(configuration[sectionId] || []), record];
  nextState.websiteEcommerceConfiguration = configuration;
  return nextState;
}

export function updateWebsiteEcommerceConfigurationRecord(state, sectionId, recordKey, patch) {
  const nextState = structuredClone(state);
  const configuration = normalizeWebsiteEcommerceConfigurationState(nextState.websiteEcommerceConfiguration);
  const records = configuration[sectionId] || [];
  const index = records.findIndex((record) => record.key === recordKey);

  if (index < 0) {
    nextState.websiteEcommerceConfiguration = configuration;
    return nextState;
  }

  records[index] = normalizeWebsiteEcommerceConfigurationRecord(sectionId, {
    ...records[index],
    ...patch
  });

  configuration[sectionId] = records;
  nextState.websiteEcommerceConfiguration = configuration;
  return nextState;
}

export function getWebsiteEcommerceConfigurationSections(project) {
  const configuration = normalizeWebsiteEcommerceConfigurationState(project.websiteEcommerceConfiguration);

  return WEBSITE_ECOMMERCE_CONFIGURATION_SECTIONS.map((section) => {
    const checkpoint = (project.checkpoints || []).find((item) => item.id === section.checkpointId) || null;
    const records = configuration[section.id] || [];

    return {
      ...section,
      checkpoint,
      records,
      summary: {
        totalRecords: records.length,
        inScopeRecords: records.filter((record) => record.inScope).length,
        linkedRecords: getWebsiteLinkedRecordCount(section.id, records)
      }
    };
  });
}

function createWebsiteEcommerceConfigurationRecord(sectionId) {
  const key = `${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (sectionId) {
    case "storefrontCapture":
      return normalizeWebsiteEcommerceConfigurationRecord(sectionId, {
        key,
        publicationScopeLabel: "",
        catalogBoundaryNotes: "",
        accessModelNotes: "",
        inScope: true
      });
    case "checkoutCapture":
      return normalizeWebsiteEcommerceConfigurationRecord(sectionId, {
        key,
        checkoutFlowLabel: "",
        paymentProviderNotes: "",
        orderConfirmationNotes: "",
        inScope: true
      });
    case "deliveryHandoffCapture":
      return normalizeWebsiteEcommerceConfigurationRecord(sectionId, {
        key,
        handoffType: "",
        downstreamHandoffNote: "",
        dependencyNote: "",
        inScope: true
      });
    default:
      return { key, inScope: true };
  }
}

function normalizeWebsiteRecords(sectionId, records) {
  return Array.isArray(records)
    ? records.map((record, index) =>
        normalizeWebsiteEcommerceConfigurationRecord(sectionId, {
          key: record?.key || `${sectionId}-${index + 1}`,
          ...record
        })
      )
    : [];
}

function normalizeWebsiteEcommerceConfigurationRecord(sectionId, record) {
  switch (sectionId) {
    case "storefrontCapture":
      return {
        key: normalizeString(record.key),
        publicationScopeLabel: normalizeString(record.publicationScopeLabel),
        catalogBoundaryNotes: normalizeString(record.catalogBoundaryNotes),
        accessModelNotes: normalizeString(record.accessModelNotes),
        inScope: Boolean(record.inScope)
      };
    case "checkoutCapture":
      return {
        key: normalizeString(record.key),
        checkoutFlowLabel: normalizeString(record.checkoutFlowLabel),
        paymentProviderNotes: normalizeString(record.paymentProviderNotes),
        orderConfirmationNotes: normalizeString(record.orderConfirmationNotes),
        inScope: Boolean(record.inScope)
      };
    case "deliveryHandoffCapture":
      return {
        key: normalizeString(record.key),
        handoffType: normalizeString(record.handoffType),
        downstreamHandoffNote: normalizeString(record.downstreamHandoffNote),
        dependencyNote: normalizeString(record.dependencyNote),
        inScope: Boolean(record.inScope)
      };
    default:
      return {
        key: normalizeString(record.key),
        inScope: Boolean(record.inScope)
      };
  }
}

function getWebsiteLinkedRecordCount(sectionId, records) {
  switch (sectionId) {
    case "checkoutCapture":
      return records.filter((record) => record.checkoutFlowLabel || record.paymentProviderNotes).length;
    default:
      return records.filter((record) => record.inScope).length;
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
