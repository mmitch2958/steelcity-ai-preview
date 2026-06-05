import { Express } from 'express';
import bcrypt from 'bcrypt';
import { db, dbPg, pgPool } from './storage';
import { 
  clients, 
  projects,
  clientPortalUsers, 
  aiUsageTracking, 
  clientInvoices, 
  softwareUpdates, 
  supportTickets, 
  supportMessages,
  insertClientPortalUserSchema,
  insertSupportTicketSchema,
  clientPortalLoginSchema
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

declare module 'express-session' {
  interface SessionData {
    portalUser?: {
      id: string;
      clientId: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

const requirePortalAuth = (req: any, res: any, next: any) => {
  if (req.session?.portalUser) {
    return next();
  }
  res.status(401).json({ error: 'Portal authentication required' });
};

const generateTicketNumber = () => {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export function registerClientPortalRoutes(app: Express) {
  // ============================================
  // CLIENT PORTAL AUTHENTICATION
  // ============================================

  // Public endpoint — returns just the client name for the login page display
  app.get('/api/portal/client-info/:slug', async (req, res) => {
    try {
      const client = await dbPg.select({ name: clients.name, slug: clients.slug })
        .from(clients).where(eq(clients.slug, req.params.slug)).limit(1);
      if (!client.length) return res.status(404).json({ error: 'Not found' });
      res.json(client[0]);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/portal/login', async (req, res) => {
    try {
      const { email, password, clientSlug } = clientPortalLoginSchema.parse(req.body);

      const client = await dbPg.select().from(clients).where(eq(clients.slug, clientSlug)).limit(1);
      if (!client.length) {
        return res.status(401).json({ error: 'Invalid client portal' });
      }

      const userResult = await pgPool.query(
        `SELECT id, client_id, email, name, role, is_active, password_hash
         FROM client_portal_users WHERE email = $1 AND client_id = $2 LIMIT 1`,
        [email, client[0].id]
      );
      const user = userResult.rows;

      if (!user.length || !user[0].is_active) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      await pgPool.query('UPDATE client_portal_users SET last_login_at = now() WHERE id = $1', [user[0].id]);

      req.session.portalUser = {
        id: user[0].id,
        clientId: user[0].client_id,
        clientSlug: client[0].slug,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role
      };

      res.json({
        success: true,
        user: {
          id: user[0].id,
          name: user[0].name,
          email: user[0].email,
          role: user[0].role
        },
        client: {
          id: client[0].id,
          name: client[0].name,
          company: client[0].company
        }
      });
    } catch (error: any) {
      console.error('Portal login error:', error);
      res.status(400).json({ error: error.message || 'Login failed' });
    }
  });

  app.post('/api/portal/logout', (req, res) => {
    req.session.portalUser = undefined;
    res.json({ success: true });
  });

  app.get('/api/portal/me', requirePortalAuth, async (req, res) => {
    try {
      const portalUser = req.session.portalUser!;
      
      const client = await dbPg.select().from(clients)
        .where(eq(clients.id, portalUser.clientId))
        .limit(1);

      res.json({
        user: portalUser,
        client: client[0] || null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CLIENT PORTAL DASHBOARD
  // ============================================

  app.get('/api/portal/dashboard', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      
      const [clientData, clientProjects, recentUsage, pendingInvoices, updates, openTickets] = await Promise.all([
        dbPg.select().from(clients).where(eq(clients.id, clientId)).limit(1),
        dbPg.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt)),
        dbPg.select().from(aiUsageTracking)
          .where(eq(aiUsageTracking.clientId, clientId))
          .orderBy(desc(aiUsageTracking.usageDate))
          .limit(30),
        dbPg.select().from(clientInvoices)
          .where(and(
            eq(clientInvoices.clientId, clientId),
            sql`${clientInvoices.status} IN ('pending', 'overdue')`
          ))
          .orderBy(desc(clientInvoices.dueDate)),
        dbPg.select().from(softwareUpdates)
          .where(sql`${softwareUpdates.clientId} IS NULL OR ${softwareUpdates.clientId} = ${clientId}`)
          .orderBy(desc(softwareUpdates.releaseDate))
          .limit(10),
        dbPg.select().from(supportTickets)
          .where(and(
            eq(supportTickets.clientId, clientId),
            sql`${supportTickets.status} NOT IN ('resolved', 'closed')`
          ))
          .orderBy(desc(supportTickets.createdAt))
      ]);

      res.json({
        client: clientData[0],
        projects: clientProjects,
        recentUsage,
        pendingInvoices,
        updates,
        openTickets
      });
    } catch (error: any) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AI USAGE TRACKING
  // ============================================

  app.get('/api/portal/usage', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { startDate, endDate, projectId } = req.query;

      let query = dbPg.select().from(aiUsageTracking).where(eq(aiUsageTracking.clientId, clientId));

      const usage = await dbPg.select().from(aiUsageTracking)
        .where(eq(aiUsageTracking.clientId, clientId))
        .orderBy(desc(aiUsageTracking.usageDate));

      const summary = usage.reduce((acc, item) => {
        acc.totalTokens += item.tokensUsed;
        acc.totalRequests += item.requestsCount;
        acc.totalCost += parseFloat(item.costUsd || '0');
        return acc;
      }, { totalTokens: 0, totalRequests: 0, totalCost: 0 });

      res.json({ usage, summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/portal/usage/by-service', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;

      const usage = await dbPg.select().from(aiUsageTracking)
        .where(eq(aiUsageTracking.clientId, clientId));

      const byService = usage.reduce((acc: Record<string, any>, item) => {
        if (!acc[item.serviceType]) {
          acc[item.serviceType] = { tokens: 0, requests: 0, cost: 0 };
        }
        acc[item.serviceType].tokens += item.tokensUsed;
        acc[item.serviceType].requests += item.requestsCount;
        acc[item.serviceType].cost += parseFloat(item.costUsd || '0');
        return acc;
      }, {});

      res.json({ byService });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // BILLING / INVOICES
  // ============================================

  app.get('/api/portal/invoices', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;

      const invoices = await dbPg.select().from(clientInvoices)
        .where(eq(clientInvoices.clientId, clientId))
        .orderBy(desc(clientInvoices.createdAt));

      res.json({ invoices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/portal/invoices/:id', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { id } = req.params;

      const invoice = await dbPg.select().from(clientInvoices)
        .where(and(
          eq(clientInvoices.id, id),
          eq(clientInvoices.clientId, clientId)
        ))
        .limit(1);

      if (!invoice.length) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({ invoice: invoice[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SOFTWARE UPDATES
  // ============================================

  app.get('/api/portal/updates', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;

      const updates = await dbPg.select().from(softwareUpdates)
        .where(sql`${softwareUpdates.clientId} IS NULL OR ${softwareUpdates.clientId} = ${clientId}`)
        .orderBy(desc(softwareUpdates.releaseDate));

      res.json({ updates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // SUPPORT TICKETS
  // ============================================

  app.get('/api/portal/tickets', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { status } = req.query;

      let tickets;
      if (status && status !== 'all') {
        tickets = await dbPg.select().from(supportTickets)
          .where(and(
            eq(supportTickets.clientId, clientId),
            eq(supportTickets.status, status as string)
          ))
          .orderBy(desc(supportTickets.createdAt));
      } else {
        tickets = await dbPg.select().from(supportTickets)
          .where(eq(supportTickets.clientId, clientId))
          .orderBy(desc(supportTickets.createdAt));
      }

      res.json({ tickets });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/portal/tickets', requirePortalAuth, async (req, res) => {
    try {
      const portalUser = req.session.portalUser!;
      const data = insertSupportTicketSchema.parse({
        ...req.body,
        clientId: portalUser.clientId,
        portalUserId: portalUser.id
      });

      const ticketNumber = generateTicketNumber();

      const [ticket] = await dbPg.insert(supportTickets)
        .values({ ...data, ticketNumber })
        .returning();

      if (req.body.initialMessage) {
        await dbPg.insert(supportMessages).values({
          ticketId: ticket.id,
          senderId: portalUser.id,
          senderType: 'client',
          content: req.body.initialMessage
        });
      }

      res.json({ ticket });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/portal/tickets/:id', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { id } = req.params;

      const ticket = await dbPg.select().from(supportTickets)
        .where(and(
          eq(supportTickets.id, id),
          eq(supportTickets.clientId, clientId)
        ))
        .limit(1);

      if (!ticket.length) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const messages = await dbPg.select().from(supportMessages)
        .where(and(
          eq(supportMessages.ticketId, id),
          eq(supportMessages.isInternal, false)
        ))
        .orderBy(supportMessages.createdAt);

      res.json({ ticket: ticket[0], messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/portal/tickets/:id/messages', requirePortalAuth, async (req, res) => {
    try {
      const portalUser = req.session.portalUser!;
      const { id } = req.params;

      const ticket = await dbPg.select().from(supportTickets)
        .where(and(
          eq(supportTickets.id, id),
          eq(supportTickets.clientId, portalUser.clientId)
        ))
        .limit(1);

      if (!ticket.length) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const [message] = await dbPg.insert(supportMessages)
        .values({
          ticketId: id,
          senderId: portalUser.id,
          senderType: 'client',
          content: req.body.content
        })
        .returning();

      await dbPg.update(supportTickets)
        .set({ lastReplyAt: new Date(), updatedAt: new Date() })
        .where(eq(supportTickets.id, id));

      res.json({ message });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================
  // PROJECT PROGRESS
  // ============================================

  app.get('/api/portal/projects', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;

      const clientProjects = await dbPg.select().from(projects)
        .where(eq(projects.clientId, clientId))
        .orderBy(desc(projects.createdAt));

      res.json({ projects: clientProjects });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/portal/projects/:id', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { id } = req.params;

      const project = await dbPg.select().from(projects)
        .where(and(
          eq(projects.id, id),
          eq(projects.clientId, clientId)
        ))
        .limit(1);

      if (!project.length) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({ project: project[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ADMIN ROUTES FOR PORTAL MANAGEMENT
  // ============================================

  app.post('/api/admin/portal-users', async (req, res) => {
    try {
      const data = insertClientPortalUserSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(data.passwordHash, 10);

      const result = await pgPool.query(
        `INSERT INTO client_portal_users (id, client_id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, now(), now())
         RETURNING id, client_id, email, name, role`,
        [data.clientId, data.name, data.email, passwordHash, data.role || 'user']
      );
      const user = result.rows[0];

      res.json({ 
        user: { 
          id: user.id, 
          clientId: user.client_id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/admin/portal-users/:clientId', async (req, res) => {
    try {
      const { clientId } = req.params;

      const result = await pgPool.query(
        `SELECT id, client_id AS "clientId", email, name, role, is_active AS "isActive", last_login_at AS "lastLoginAt", created_at AS "createdAt"
         FROM client_portal_users WHERE client_id = $1`,
        [clientId]
      );

      res.json({ users: result.rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // STRIPE BILLING ENDPOINTS
  // ============================================

  app.get('/api/portal/stripe/products', requirePortalAuth, async (req, res) => {
    try {
      const { stripeService } = await import('./stripeService');
      const products = await stripeService.listProductsWithPrices();
      res.json({ products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/portal/stripe/publishable-key', requirePortalAuth, async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/portal/stripe/create-checkout-session', requirePortalAuth, async (req, res) => {
    try {
      const { priceId } = req.body;
      const { clientId, email, name } = req.session.portalUser!;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const { stripeService } = await import('./stripeService');
      
      const client = await dbPg.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (!client.length) {
        return res.status(404).json({ error: 'Client not found' });
      }

      let stripeCustomerId = client[0].stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(email, name, {
          clientId,
          company: client[0].company || client[0].name
        });
        stripeCustomerId = customer.id;
        
        await dbPg.update(clients)
          .set({ stripeCustomerId })
          .where(eq(clients.id, clientId));
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      
      const clientSlug = client[0].slug;
      const successUrl = `${baseUrl}/${clientSlug}/billing?success=true`;
      const cancelUrl = `${baseUrl}/${clientSlug}/billing?cancelled=true`;

      const session = await stripeService.createCheckoutSession(
        stripeCustomerId,
        priceId,
        successUrl,
        cancelUrl,
        'subscription'
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Create checkout session error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/portal/stripe/customer-portal', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { stripeService } = await import('./stripeService');

      const client = await dbPg.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (!client.length || !client[0].stripeCustomerId) {
        return res.status(400).json({ error: 'No Stripe customer found for this client' });
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const returnUrl = `${baseUrl}/${client[0].slug}/billing`;

      const portalSession = await stripeService.createCustomerPortalSession(
        client[0].stripeCustomerId,
        returnUrl
      );

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error('Customer portal error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/portal/stripe/invoices', requirePortalAuth, async (req, res) => {
    try {
      const { clientId } = req.session.portalUser!;
      const { stripeService } = await import('./stripeService');

      const client = await dbPg.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      if (!client.length || !client[0].stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const invoicesResponse = await stripeService.listInvoices(client[0].stripeCustomerId, 20);
      res.json({ invoices: invoicesResponse.data });
    } catch (error: any) {
      console.error('Get Stripe invoices error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('[CLIENT PORTAL] Routes registered');
}
