// Industry-Specific Odoo 19 Implementation Templates
// Tailored for manufacturing, distribution, and service businesses

export const INDUSTRY_TEMPLATES = {
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing & Production",
    description: "For businesses that make products: composites, components, assemblies",
    icon: "factory",
    applicableTo: ["Allied Fibreglass", "panel manufacturers", "component fabricators"],
    recommendedModules: ["mrp", "purchase", "inventory", "sales", "accounting", "quality"],
    stageOrder: [
      "foundation",
      "master-data", 
      "inventory",
      "purchase",
      "manufacturing-mrp",
      "sales",
      "accounting",
      "quality"
    ],
    defaultCheckpoints: {
      foundation: ["company-setup", "localization", "units-of-measure"],
      masterData: ["raw-materials", "finished-goods", "suppliers", "product-categories"],
      inventory: ["warehouses", "stock-locations", "operation-types"],
      purchase: ["vendor-setup", "procurement-rules", "approval-workflows"],
      manufacturing: ["workcenters", "boms", "routing", "production-scheduling"],
      sales: ["pricelists", "customer-setup", "quotation-templates"],
      accounting: ["chart-of-accounts", "taxes", "bank-accounts", "costing-method"],
      quality: ["quality-points", "inspection-criteria"]
    },
    sampleData: {
      productCategories: [
        { name: "Raw Materials", type: "product" },
        { name: "Composite Panels", type: "product" },
        { name: "Core Materials", type: "product" },
        { name: "Adhesives & Resins", type: "product" },
        { name: "Services", type: "service" }
      ],
      warehouses: [
        { name: "Main Warehouse", code: "WH" },
        { name: "Raw Materials", code: "RM" },
        { name: "Finished Goods", code: "FG" }
      ],
      workcenters: [
        { name: "Cutting Station", code: "CUT" },
        { name: "Assembly Line 1", code: "ASM01" },
        { name: "Quality Control", code: "QC" }
      ],
      unitsOfMeasure: [
        { name: "Square Meter", category: "Area", uom_type: "reference" },
        { name: "Panel", category: "Unit", uom_type: "bigger", factor: 2.88 },
        { name: "Sheet", category: "Unit", uom_type: "bigger", factor: 1.44 }
      ]
    },
    guidanceBlocks: {
      bomSetup: {
        title: "Bill of Materials for Composite Panels",
        whatThisIs: "A recipe listing all raw materials needed to produce one panel",
        whyItMatters: "Correct BOMs ensure accurate costing, stock consumption, and purchasing forecasts",
        downstreamImpact: [
          "Production orders consume correct materials",
          "Cost of goods sold is accurate",
          "Purchase requirements auto-generate"
        ],
        commonMistakes: [
          "Forgetting adhesive quantities per panel",
          "Not accounting for waste/scrap percentage",
          "Mixing units (sheets vs square meters)"
        ],
        reversibility: "BOMs can be versioned — create new versions rather than editing active ones",
        decisionOwner: "Production Manager",
        trainingOffer: "Available: Creating and managing BOMs in Odoo 19"
      }
    }
  },

  retail: {
    id: "retail",
    name: "Retail & POS",
    description: "For shops with physical stores and online sales",
    icon: "shopping-bag",
    applicableTo: ["retail stores", "showrooms", "trade counters"],
    recommendedModules: ["pos", "inventory", "sales", "website", "accounting", "crm"],
    stageOrder: [
      "foundation",
      "master-data",
      "inventory",
      "pos",
      "sales",
      "crm",
      "accounting",
      "website"
    ]
  },

  distribution: {
    id: "distribution",
    name: "Distribution & Wholesale",
    description: "For businesses that buy and sell without manufacturing",
    icon: "truck",
    applicableTo: ["wholesalers", "distributors", "importers/exporters"],
    recommendedModules: ["purchase", "sales", "inventory", "accounting", "crm"],
    stageOrder: [
      "foundation",
      "master-data",
      "inventory",
      "purchase",
      "sales",
      "crm",
      "accounting"
    ]
  },

  services: {
    id: "services",
    name: "Services & Projects",
    description: "For businesses selling time and expertise",
    icon: "users",
    applicableTo: ["consultancies", "installers", "maintenance services"],
    recommendedModules: ["project", "sales", "accounting", "hr", "crm"],
    stageOrder: [
      "foundation",
      "master-data",
      "crm",
      "sales",
      "project",
      "accounting",
      "hr"
    ]
  }
};

export function getIndustryTemplate(templateId) {
  return INDUSTRY_TEMPLATES[templateId] || INDUSTRY_TEMPLATES.manufacturing;
}

export function getAllIndustryTemplates() {
  return Object.values(INDUSTRY_TEMPLATES);
}

export function recommendTemplate(businessDescription) {
  const desc = businessDescription.toLowerCase();
  
  if (desc.includes("manufacture") || desc.includes("make") || desc.includes("produce") || 
      desc.includes("fabricat") || desc.includes("composite") || desc.includes("panel")) {
    return INDUSTRY_TEMPLATES.manufacturing;
  }
  
  if (desc.includes("retail") || desc.includes("shop") || desc.includes("store")) {
    return INDUSTRY_TEMPLATES.retail;
  }
  
  if (desc.includes("distribute") || desc.includes("wholesale") || desc.includes("import")) {
    return INDUSTRY_TEMPLATES.distribution;
  }
  
  if (desc.includes("service") || desc.includes("install") || desc.includes("consult")) {
    return INDUSTRY_TEMPLATES.services;
  }
  
  return INDUSTRY_TEMPLATES.manufacturing;
}
