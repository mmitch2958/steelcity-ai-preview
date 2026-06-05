// Gmail Integration using Replit Connectors
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(to: string, subject: string, htmlBody: string, from: string = 'mike@steelcity-ai.com'): string {
  const message = [
    `From: Steel City AI <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody
  ].join('\r\n');

  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    const gmail = await getUncachableGmailClient();
    const raw = createEmailMessage(to, subject, htmlBody);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw
      }
    });
    
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendAutomationDiscoveryEmails(
  clientEmail: string,
  clientName: string,
  companyName: string,
  processName: string,
  outline: {
    summary: string;
    recommendedApproach: string;
    proposedSolution: string[];
    estimatedTimeline: string;
    estimatedBudget: string;
    keyBenefits: string[];
    nextSteps: string[];
    modelUsed?: string;
  },
  geminiOutline?: {
    summary: string;
    recommendedApproach: string;
    proposedSolution: string[];
    estimatedTimeline: string;
    estimatedBudget: string;
    keyBenefits: string[];
    nextSteps: string[];
    modelUsed?: string;
  } | null
): Promise<{ clientEmailSent: boolean; adminEmailSent: boolean }> {
  const adminEmail = 'mike@steelcity-ai.com';
  
  const clientSubject = `Your Automation Discovery Outline - ${processName}`;
  const adminSubject = `New Automation Discovery Request - ${companyName}`;
  
  const clientHtmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .section h3 { color: #1e3a5f; margin-top: 0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .cta { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Steel City AI</h1>
        <p>Your Personalized Automation Outline</p>
      </div>
      <div class="content">
        <p>Hello ${clientName},</p>
        <p>Thank you for completing the Automation Discovery questionnaire! Based on your responses about <strong>${processName}</strong>, our AI has analyzed your needs and created a personalized automation outline.</p>
        
        <div class="section">
          <h3>Summary</h3>
          <p>${outline.summary}</p>
        </div>
        
        <div class="section">
          <h3>Recommended Approach</h3>
          <p>${outline.recommendedApproach}</p>
        </div>
        
        <div class="section">
          <h3>Proposed Solution</h3>
          <ul>
            ${outline.proposedSolution.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3>Timeline</h3>
          <p><strong>Estimated Timeline:</strong> ${outline.estimatedTimeline}</p>
        </div>
        
        <div class="section">
          <h3>Key Benefits</h3>
          <ul>
            ${outline.keyBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3>Next Steps</h3>
          <ul>
            ${outline.nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        
        <p style="text-align: center;">
          <a href="https://steelcity-ai.com/contact" class="cta">Schedule a Consultation</a>
        </p>
      </div>
      <div class="footer">
        <p>Steel City AI - Transforming Businesses Through Intelligent Automation</p>
        <p>Questions? Reply to this email or contact us at mike@steelcity-ai.com</p>
      </div>
    </body>
    </html>
  `;
  
  const adminHtmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; }
        .header { background: #1e3a5f; color: white; padding: 20px; }
        .content { padding: 20px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 150px; color: #666; }
        .section { background: #f9fafb; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
        .section h4 { margin-top: 0; color: #1e3a5f; }
        ul { padding-left: 20px; margin: 10px 0; }
        li { margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>New Automation Discovery Request</h2>
      </div>
      <div class="content">
        <h3>Contact Information</h3>
        <table class="info-table">
          <tr><td>Name</td><td>${clientName}</td></tr>
          <tr><td>Email</td><td>${clientEmail}</td></tr>
          <tr><td>Company</td><td>${companyName}</td></tr>
          <tr><td>Process</td><td>${processName}</td></tr>
        </table>
        
        <h3>OpenAI Outline (GPT-4o) - Sent to Client</h3>
        
        <div class="section">
          <h4>Summary</h4>
          <p>${outline.summary}</p>
        </div>
        
        <div class="section">
          <h4>Recommended Approach</h4>
          <p>${outline.recommendedApproach}</p>
        </div>
        
        <div class="section">
          <h4>Proposed Solution</h4>
          <ul>
            ${outline.proposedSolution.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h4>Timeline & Budget</h4>
          <p><strong>Timeline:</strong> ${outline.estimatedTimeline}</p>
          <p><strong>Budget:</strong> ${outline.estimatedBudget}</p>
        </div>
        
        <div class="section">
          <h4>Key Benefits</h4>
          <ul>
            ${outline.keyBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h4>Next Steps</h4>
          <ul>
            ${outline.nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        
        ${geminiOutline ? `
        <hr style="margin: 30px 0; border: none; border-top: 2px solid #2563eb;" />
        
        <h3>Gemini Outline (Gemini 2.5 Flash) - Admin Only</h3>
        
        <div class="section">
          <h4>Summary</h4>
          <p>${geminiOutline.summary}</p>
        </div>
        
        <div class="section">
          <h4>Recommended Approach</h4>
          <p>${geminiOutline.recommendedApproach}</p>
        </div>
        
        <div class="section">
          <h4>Proposed Solution</h4>
          <ul>
            ${geminiOutline.proposedSolution.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h4>Timeline & Budget</h4>
          <p><strong>Timeline:</strong> ${geminiOutline.estimatedTimeline}</p>
          <p><strong>Budget:</strong> ${geminiOutline.estimatedBudget}</p>
        </div>
        
        <div class="section">
          <h4>Key Benefits</h4>
          <ul>
            ${geminiOutline.keyBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h4>Next Steps</h4>
          <ul>
            ${geminiOutline.nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        ` : '<p><em>Gemini outline not available</em></p>'}
        
        <p><a href="https://steelcity-ai.com/admin/automation-discovery">View in Admin Portal</a></p>
      </div>
    </body>
    </html>
  `;
  
  const [clientEmailSent, adminEmailSent] = await Promise.all([
    sendEmail(clientEmail, clientSubject, clientHtmlBody),
    sendEmail(adminEmail, adminSubject, adminHtmlBody)
  ]);
  
  return { clientEmailSent, adminEmailSent };
}
