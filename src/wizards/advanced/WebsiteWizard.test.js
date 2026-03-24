/**
 * Website/eCommerce Wizard Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { WebsiteWizard, WEBSITE_STEPS, DELIVERY_TYPES } from './WebsiteWizard.js';

const mockClient = {
  companyId: 1,
  searchRead: async (model, domain, fields) => {
    if (model === 'product.pricelist') {
      return [
        { id: 1, name: 'Public Pricelist', currency_id: 1, active: true },
        { id: 2, name: 'VIP Pricelist', currency_id: 1, active: true }
      ];
    }
    if (model === 'delivery.carrier') {
      return [
        { id: 1, name: 'Standard Shipping', delivery_type: 'fixed', active: true },
        { id: 2, name: 'Express Delivery', delivery_type: 'base_on_rule', active: true }
      ];
    }
    return [];
  },
  create: async (model, data) => {
    return Math.floor(Math.random() * 10000) + 100;
  }
};

test('WebsiteWizard initializes with correct initial state', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  assert.equal(wizard.state.currentStep, WEBSITE_STEPS.MODULE_SELECTION);
  assert.deepEqual(wizard.state.moduleSelection, {
    install_ecommerce: true,
    install_delivery: false,
    install_google_analytics: false,
    install_social_marketing: false
  });
  assert.equal(wizard.state.shippingMethods.length, 1); // Default shipping method
});

test('WebsiteWizard has default shop configuration', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  const shopConfig = wizard.state.shopConfig;
  assert.equal(shopConfig.cart_recovery_emails, true);
  assert.equal(shopConfig.cart_abandoned_delay, 1);
  assert.equal(shopConfig.add_to_cart_action, 'go_to_cart');
  assert.equal(shopConfig.default_pricelist, 'public');
});

test('WebsiteWizard has default shipping methods', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  const methods = wizard.state.shippingMethods;
  assert.equal(methods.length, 1);
  assert.equal(methods[0].name, 'Standard Shipping');
  assert.equal(methods[0].delivery_type, DELIVERY_TYPES.FIXED);
  assert.equal(methods[0].estimated_days, '3-5');
});

test('WebsiteWizard has default product settings', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  const productSettings = wizard.state.productSettings;
  assert.equal(productSettings.allow_out_of_stock, false);
  assert.equal(productSettings.notify_customer, true);
  assert.equal(productSettings.invoice_policy, 'order');
  assert.equal(productSettings.self_pickup, true);
});

test('WebsiteWizard has default SEO configuration', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  const seoConfig = wizard.state.seoConfig;
  assert.equal(seoConfig.website_public, true);
  assert.equal(seoConfig.social_share, true);
  assert.deepEqual(seoConfig.channel_ids, []);
});

test('WebsiteWizard setModuleSelection updates selection correctly', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.setModuleSelection({
    install_delivery: true,
    install_google_analytics: true
  });
  
  assert.equal(wizard.state.moduleSelection.install_ecommerce, true);
  assert.equal(wizard.state.moduleSelection.install_delivery, true);
  assert.equal(wizard.state.moduleSelection.install_google_analytics, true);
});

test('WebsiteWizard setShopConfig updates shop config correctly', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.setShopConfig({
    website_name: 'My Online Shop',
    website_domain: 'shop.example.com',
    cart_recovery_emails: false
  });
  
  assert.equal(wizard.state.shopConfig.website_name, 'My Online Shop');
  assert.equal(wizard.state.shopConfig.website_domain, 'shop.example.com');
  assert.equal(wizard.state.shopConfig.cart_recovery_emails, false);
});

test('WebsiteWizard addPaymentProvider adds provider correctly', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.addPaymentProvider({
    name: 'Stripe',
    provider_type: 'stripe',
    state: 'enabled'
  });
  
  assert.equal(wizard.state.paymentProviders.length, 1);
  assert.equal(wizard.state.paymentProviders[0].name, 'Stripe');
  assert.ok(wizard.state.paymentProviders[0].isNew);
});

test('WebsiteWizard updatePaymentProvider modifies provider', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.addPaymentProvider({ name: 'PayPal' });
  wizard.updatePaymentProvider(0, { name: 'PayPal Business', state: 'enabled' });
  
  assert.equal(wizard.state.paymentProviders[0].name, 'PayPal Business');
});

test('WebsiteWizard removePaymentProvider removes provider', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.addPaymentProvider({ name: 'Provider 1' });
  wizard.addPaymentProvider({ name: 'Provider 2' });
  wizard.removePaymentProvider(0);
  
  assert.equal(wizard.state.paymentProviders.length, 1);
  assert.equal(wizard.state.paymentProviders[0].name, 'Provider 2');
});

test('WebsiteWizard addShippingMethod adds method correctly', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.addShippingMethod({
    name: 'Express Delivery',
    delivery_type: DELIVERY_TYPES.FIXED,
    fixed_price: 25,
    estimated_days: '1-2'
  });
  
  assert.equal(wizard.state.shippingMethods.length, 2);
  assert.equal(wizard.state.shippingMethods[1].name, 'Express Delivery');
});

test('WebsiteWizard updateShippingMethod modifies method', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.shippingMethods = [{ name: 'Old Shipping' }];
  wizard.updateShippingMethod(0, { name: 'New Shipping', fixed_price: 15 });
  
  assert.equal(wizard.state.shippingMethods[0].name, 'New Shipping');
  assert.equal(wizard.state.shippingMethods[0].fixed_price, 15);
});

test('WebsiteWizard removeShippingMethod removes method', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.shippingMethods = [
    { name: 'Method 1' },
    { name: 'Method 2' }
  ];
  wizard.removeShippingMethod(0);
  
  assert.equal(wizard.state.shippingMethods.length, 1);
  assert.equal(wizard.state.shippingMethods[0].name, 'Method 2');
});

test('WebsiteWizard setProductSettings updates product settings', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.setProductSettings({
    allow_out_of_stock: true,
    invoice_policy: 'delivery'
  });
  
  assert.equal(wizard.state.productSettings.allow_out_of_stock, true);
  assert.equal(wizard.state.productSettings.invoice_policy, 'delivery');
});

test('WebsiteWizard setSeoConfig updates SEO config', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.setSeoConfig({
    website_public: false,
    social_share: false
  });
  
  assert.equal(wizard.state.seoConfig.website_public, false);
  assert.equal(wizard.state.seoConfig.social_share, false);
});

test('WebsiteWizard nextStep validates website name requirement', async () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.currentStep = WEBSITE_STEPS.SHOP_CONFIG;
  wizard.state.shopConfig.website_name = ''; // Missing name
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, false);
  assert.ok(wizard.state.errors.website_name);
});

test('WebsiteWizard nextStep advances when validation passes', async () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.currentStep = WEBSITE_STEPS.SHOP_CONFIG;
  wizard.state.shopConfig.website_name = 'My Shop';
  
  const result = await wizard.nextStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, WEBSITE_STEPS.PAYMENT_PROVIDERS);
});

test('WebsiteWizard prevStep goes back correctly', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.currentStep = WEBSITE_STEPS.PAYMENT_PROVIDERS;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, true);
  assert.equal(wizard.state.currentStep, WEBSITE_STEPS.SHOP_CONFIG);
});

test('WebsiteWizard prevStep does nothing on first step', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.currentStep = WEBSITE_STEPS.MODULE_SELECTION;
  
  const result = wizard.prevStep();
  
  assert.equal(result.success, false);
});

test('WebsiteWizard getStepInfo returns correct info', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  const info = wizard.getStepInfo(WEBSITE_STEPS.SHOP_CONFIG);
  assert.equal(info.title, 'Shop Setup');
  
  const info2 = wizard.getStepInfo(WEBSITE_STEPS.COMPLETION);
  assert.equal(info2.title, 'Complete');
});

test('WebsiteWizard getProgress calculates correctly', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.currentStep = WEBSITE_STEPS.MODULE_SELECTION;
  assert.equal(wizard.getProgress(), 0);
  
  wizard.state.currentStep = WEBSITE_STEPS.EXECUTION;
  const progress = wizard.getProgress();
  assert.ok(progress > 0 && progress < 100);
  
  wizard.state.currentStep = WEBSITE_STEPS.COMPLETION;
  assert.equal(wizard.getProgress(), 100);
});

test('WebsiteWizard getAvailablePricelists returns pricelists after init', async () => {
  const wizard = new WebsiteWizard(mockClient);
  
  await wizard.initialize();
  
  const pricelists = wizard.getAvailablePricelists();
  assert.ok(pricelists.length > 0);
});

test('WebsiteWizard getDeliveryTypeOptions returns correct options', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  const options = wizard.getDeliveryTypeOptions();
  
  assert.equal(options.length, 3);
  assert.ok(options.some(o => o.value === DELIVERY_TYPES.FIXED));
  assert.ok(options.some(o => o.value === DELIVERY_TYPES.BASE_ON_RULE));
  assert.ok(options.some(o => o.value === DELIVERY_TYPES.ROUTE_BASED));
});

test('WebsiteWizard reset restores initial state', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.state.currentStep = WEBSITE_STEPS.COMPLETION;
  wizard.setShopConfig({ website_name: 'Test Shop' });
  wizard.addPaymentProvider({ name: 'Test Provider' });
  
  wizard.reset();
  
  assert.equal(wizard.state.currentStep, WEBSITE_STEPS.MODULE_SELECTION);
  assert.equal(wizard.state.shopConfig.website_name, '');
  assert.equal(wizard.state.paymentProviders.length, 0);
});

test('WebsiteWizard exportConfig exports correct structure', () => {
  const wizard = new WebsiteWizard(mockClient);
  
  wizard.setShopConfig({ website_name: 'My Shop' });
  wizard.addShippingMethod({ name: 'Express' });
  
  const config = wizard.exportConfig();
  
  assert.ok(config.moduleSelection !== undefined);
  assert.equal(config.shopConfig.website_name, 'My Shop');
  assert.equal(config.shippingMethods.length, 2); // Default + added
  assert.ok(config.productSettings !== undefined);
  assert.ok(config.seoConfig !== undefined);
  assert.equal(config.completedAt, null);
});
