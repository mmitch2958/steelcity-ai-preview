// Stripe Service for Steel City AI
// Reference: stripe-replit-sync integration

import { getUncachableStripeClient } from './stripeClient';
import { db } from './storage';
import { sql } from 'drizzle-orm';

export class StripeService {
  async createCustomer(email: string, name: string, metadata: Record<string, string> = {}) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'subscription'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getCustomer(customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.retrieve(customerId);
  }

  async listInvoices(customerId: string, limit = 10) {
    const stripe = await getUncachableStripeClient();
    return await stripe.invoices.list({
      customer: customerId,
      limit,
    });
  }

  async getSubscription(subscriptionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string, immediately = false) {
    const stripe = await getUncachableStripeClient();
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async getProduct(productId: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE id = ${productId}`
      );
      return result.rows[0] || null;
    } catch (error) {
      return null;
    }
  }

  async listProducts(active = true, limit = 20) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit}`
      );
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async listPrices(active = true, limit = 20) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit}`
      );
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async listProductsWithPrices(active = true, limit = 20) {
    try {
      const result = await db.execute(
        sql`
          WITH paginated_products AS (
            SELECT id, name, description, metadata, active
            FROM stripe.products
            WHERE active = ${active}
            ORDER BY id
            LIMIT ${limit}
          )
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.active as product_active,
            p.metadata as product_metadata,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.recurring,
            pr.active as price_active,
            pr.metadata as price_metadata
          FROM paginated_products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          ORDER BY p.id, pr.unit_amount
        `
      );
      return result.rows;
    } catch (error) {
      return [];
    }
  }
}

export const stripeService = new StripeService();
