import test from "node:test";
import assert from "node:assert/strict";

import { createInitialProjectState } from "../project-state.js";
import { generateDomainPreview } from "../preview-engine.js";

test("inventory preview generates bounded warehouse creation actions from configuration and inspection", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.inventoryConfiguration.warehouses = [
    {
      key: "wh-1",
      warehouseName: "Main Warehouse",
      code: "MAIN",
      companyScope: "",
      purposeNotes: "",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "inventory", {
    domainId: "inventory",
    status: "complete",
    moduleStatus: [{ module: "stock", state: "installed" }],
    records: { warehouses: [] }
  });

  assert.equal(result.previews.length, 1);
  assert.equal(result.previews[0].targetModel, "stock.warehouse");
  assert.equal(result.previews[0].safetyClass, "safe");
  assert.equal(result.previews[0].executable, true);
});

test("missing module produces a non-executable module-install preview", () => {
  const project = createInitialProjectState();
  const result = generateDomainPreview(project, "documents", {
    domainId: "documents",
    status: "complete",
    moduleStatus: [{ module: "documents", state: "missing" }]
  });

  assert.equal(result.previews.length, 1);
  assert.equal(result.previews[0].operation, "install_module");
  assert.equal(result.previews[0].executable, false);
});

test("CRM preview generates bounded sales-team creation from configuration and inspection", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.crmConfiguration.activityDisciplineCapture = [
    {
      key: "team-1",
      salesTeamLabel: "North Team",
      ownerRoleNote: "Sales lead",
      activityTypeNotes: "",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "crm", {
    domainId: "crm",
    status: "complete",
    moduleStatus: [{ module: "crm", state: "installed" }],
    records: { stages: [], teams: [] }
  });

  assert.ok(result.previews.some((preview) => preview.targetModel === "crm.team" && preview.executable));
});

test("inventory preview blocks operation-type creation until the linked warehouse exists live", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.inventoryConfiguration.warehouses = [
    {
      key: "wh-2",
      warehouseName: "Overflow Warehouse",
      code: "OVR",
      companyScope: "",
      purposeNotes: "",
      inScope: true
    }
  ];
  project.inventoryConfiguration.operationTypes = [
    {
      key: "op-1",
      linkedWarehouseKey: "wh-2",
      operationTypeName: "Overflow Receipts",
      operationTypeKey: "IN",
      flowCategory: "Inbound",
      sequenceOrder: "",
      notes: "",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "inventory", {
    domainId: "inventory",
    status: "complete",
    moduleStatus: [{ module: "stock", state: "installed" }],
    records: { warehouses: [], operationTypes: [] }
  });

  assert.equal(result.previews.length, 2);
  const operationPreview = result.previews.find((preview) => preview.targetModel === "stock.picking.type");
  assert.equal(operationPreview.safetyClass, "conditional");
  assert.equal(operationPreview.executable, false);
});

test("master-data preview generates safe create-first actions for missing shared categories", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.masterDataConfiguration.partnerCategoryCapture = [
    {
      key: "partner-1",
      categoryName: "Wholesale Customer",
      stewardshipNote: "Owned by data steward",
      inScope: true
    }
  ];
  project.masterDataConfiguration.productCategoryCapture = [
    {
      key: "product-1",
      categoryName: "Finished Goods",
      parentCategoryName: "",
      stewardshipNote: "Owned by product governance",
      inScope: true
    }
  ];
  project.masterDataConfiguration.uomCategoryCapture = [
    {
      key: "uom-1",
      categoryName: "Weight",
      stewardshipNote: "Owned by operations",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "master-data", {
    domainId: "master-data",
    status: "complete",
    moduleStatus: [
      { module: "product", state: "installed" },
      { module: "contacts", state: "installed" },
      { module: "uom", state: "installed" }
    ],
    modelStatus: {
      "res.partner.category": "readable",
      "product.category": "readable",
      "uom.category": "readable"
    },
    records: {
      partnerCategories: [],
      productCategories: [],
      uomCategories: []
    }
  });

  assert.ok(result.previews.some((preview) => preview.targetModel === "res.partner.category" && preview.executable));
  assert.ok(result.previews.some((preview) => preview.targetModel === "product.category" && preview.executable));
  assert.ok(result.previews.some((preview) => preview.targetModel === "uom.category" && preview.executable));
});

test("master-data preview blocks duplicates and unresolved parent dependencies", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.masterDataConfiguration.partnerCategoryCapture = [
    {
      key: "partner-1",
      categoryName: "VIP",
      stewardshipNote: "",
      inScope: true
    }
  ];
  project.masterDataConfiguration.productCategoryCapture = [
    {
      key: "product-1",
      categoryName: "Components",
      parentCategoryName: "Unknown Parent",
      stewardshipNote: "",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "master-data", {
    domainId: "master-data",
    status: "complete",
    moduleStatus: [
      { module: "product", state: "installed" },
      { module: "contacts", state: "installed" },
      { module: "uom", state: "installed" }
    ],
    modelStatus: {
      "res.partner.category": "readable",
      "product.category": "readable",
      "uom.category": "readable"
    },
    records: {
      partnerCategories: [{ id: 40, name: "VIP" }],
      productCategories: [],
      uomCategories: []
    }
  });

  const partnerPreview = result.previews.find((preview) => preview.targetModel === "res.partner.category");
  const productPreview = result.previews.find((preview) => preview.targetModel === "product.category");

  assert.equal(partnerPreview.safetyClass, "blocked");
  assert.equal(partnerPreview.executable, false);
  assert.equal(productPreview.safetyClass, "conditional");
  assert.equal(productPreview.executable, false);
});

test("sales preview generates bounded sales-team and pricelist creation actions", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.salesConfiguration.processCapture = [
    {
      key: "sales-1",
      quoteFlowMode: "B2B Standard Options",
      inScope: true
    }
  ];
  project.salesConfiguration.pricingCapture = [
    {
      key: "price-1",
      pricingApproachLabel: "B2B Wholesale Pricelist",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "sales", {
    domainId: "sales",
    status: "complete",
    moduleStatus: [{ module: "sale_management", state: "installed" }],
    records: {}
  });

  const teamPreview = result.previews.find(p => p.targetModel === "crm.team");
  const pricePreview = result.previews.find(p => p.targetModel === "product.pricelist");

  assert.ok(teamPreview && teamPreview.executable);
  assert.equal(teamPreview.intendedChanges[0].to, "B2B Standard Options");
  assert.ok(pricePreview && pricePreview.executable);
  assert.equal(pricePreview.intendedChanges[0].to, "B2B Wholesale Pricelist");
});

test("purchase preview generates bounded vendor-category creation actions", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.purchaseConfiguration.vendorPricingCapture = [
    {
      key: "vendor-1",
      pricingApproachLabel: "Local Distributors",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "purchase", {
    domainId: "purchase",
    status: "complete",
    moduleStatus: [{ module: "purchase", state: "installed" }],
    records: {}
  });

  const vendorPreview = result.previews.find(p => p.targetModel === "res.partner.category");

  assert.ok(vendorPreview && vendorPreview.executable);
  assert.equal(vendorPreview.intendedChanges[0].to, "Vendor Classification: Local Distributors");
});

test("manufacturing preview generates bounded workcenter creation actions", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.manufacturingConfiguration.productionModeCapture = [
    {
      key: "mfg-1",
      productionModeLabel: "Assembly Line 1",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "manufacturing-mrp", {
    domainId: "manufacturing-mrp",
    status: "complete",
    moduleStatus: [{ module: "mrp", state: "installed" }],
    records: {}
  });

  const wcPreview = result.previews.find(p => p.targetModel === "mrp.workcenter");

  assert.ok(wcPreview && wcPreview.executable);
  assert.equal(wcPreview.intendedChanges[0].to, "Assembly Line 1");
});

test("website-ecommerce preview generates bounded delivery-carrier creation actions", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.websiteEcommerceConfiguration.deliveryHandoffCapture = [
    {
      key: "web-1",
      handoffType: "Digital Delivery",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "website-ecommerce", {
    domainId: "website-ecommerce",
    status: "complete",
    moduleStatus: [{ module: "website_sale", state: "installed" }],
    records: {}
  });

  const deliveryPreview = result.previews.find(p => p.targetModel === "delivery.carrier");

  assert.ok(deliveryPreview && deliveryPreview.executable);
  assert.equal(deliveryPreview.intendedChanges[0].to, "Digital Delivery");
});

test("pos preview generates bounded payment-method creation actions", () => {
  const project = createInitialProjectState();
  project.connectionState.status = "connected_execute";
  project.connectionState.capabilityLevel = "execute";
  project.posConfiguration.invoicingPolicyCapture = [
    {
      key: "pos-1",
      invoicingPolicyLabel: "Credit Card Terminal",
      inScope: true
    }
  ];

  const result = generateDomainPreview(project, "pos", {
    domainId: "pos",
    status: "complete",
    moduleStatus: [{ module: "point_of_sale", state: "installed" }],
    records: {}
  });

  const pmPreview = result.previews.find(p => p.targetModel === "pos.payment.method");

  assert.ok(pmPreview && pmPreview.executable);
  assert.equal(pmPreview.intendedChanges[0].to, "Credit Card Terminal");
});
