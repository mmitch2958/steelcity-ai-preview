import { google, gmail_v1 } from 'googleapis';

// Use OAuth2Client type from googleapis to avoid version conflicts
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export class GoogleGmailService {
  private gmail: gmail_v1.Gmail;

  constructor(auth: OAuth2ClientType) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  // Send email
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
    attachments?: Array<{ filename: string; content: Buffer; contentType: string }>
  ) {
    try {
      const boundary = `boundary_${Date.now()}`;
      let message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: multipart/alternative; boundary="alt_boundary"',
        '',
        '--alt_boundary',
        'Content-Type: text/plain; charset=utf-8',
        '',
        textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        '',
        '--alt_boundary',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlBody,
        '',
        '--alt_boundary--'
      ];

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          message.push(
            `--${boundary}`,
            `Content-Type: ${attachment.contentType}`,
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            'Content-Transfer-Encoding: base64',
            '',
            attachment.content.toString('base64'),
            ''
          );
        }
      }

      message.push(`--${boundary}--`);

      const raw = Buffer.from(message.join('\n')).toString('base64');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        }
      });

      return {
        messageId: response.data.id,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Get emails with specific criteria
  async getEmails(query: string = '', maxResults: number = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      const messages = response.data.messages || [];
      const emailDetails: Array<{
        id: string;
        threadId: string;
        subject: string;
        from: string;
        date: string;
        snippet: string;
        labelIds: string[];
      }> = [];

      for (const message of messages) {
        if (!message.id) continue;
        
        const email = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id
        });

        const headers = email.data.payload?.headers || [];
        const subject = headers.find((h: { name?: string | null; value?: string | null }) => h.name === 'Subject')?.value || '';
        const from = headers.find((h: { name?: string | null; value?: string | null }) => h.name === 'From')?.value || '';
        const date = headers.find((h: { name?: string | null; value?: string | null }) => h.name === 'Date')?.value || '';

        emailDetails.push({
          id: email.data.id || '',
          threadId: email.data.threadId || '',
          subject,
          from,
          date,
          snippet: email.data.snippet || '',
          labelIds: email.data.labelIds || []
        });
      }

      return emailDetails;
    } catch (error) {
      console.error('Error getting emails:', error);
      throw new Error('Failed to get emails');
    }
  }

  // Create email templates for Steel City AI
  generateConsultationConfirmationEmail(
    clientName: string,
    meetingDate: string,
    meetingTime: string,
    meetingUrl?: string
  ) {
    const subject = `Consultation Confirmed - Steel City AI`;
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Consultation Confirmed</h2>
            
            <p>Dear ${clientName},</p>
            
            <p>Thank you for scheduling a consultation with Steel City AI. We're excited to discuss how our AI automation solutions can transform your business operations.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Meeting Details</h3>
              <p><strong>Date:</strong> ${meetingDate}</p>
              <p><strong>Time:</strong> ${meetingTime}</p>
              ${meetingUrl ? `<p><strong>Meeting Link:</strong> <a href="${meetingUrl}" style="color: #2563eb;">${meetingUrl}</a></p>` : ''}
            </div>
            
            <p>To help us prepare for our discussion, please consider:</p>
            <ul>
              <li>What processes in your business take the most time?</li>
              <li>What repetitive tasks would you like to automate?</li>
              <li>Any specific challenges you're facing with document processing or customer service?</li>
            </ul>
            
            <p>If you need to reschedule or have any questions, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>
            The Steel City AI Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              Steel City AI - Automating workflows, enhancing productivity
            </p>
          </div>
        </body>
      </html>
    `;

    return { subject, htmlBody };
  }

  generateProjectUpdateEmail(
    clientName: string,
    projectName: string,
    updateDetails: string,
    attachments?: string[]
  ) {
    const subject = `Project Update: ${projectName} - Steel City AI`;
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Project Update</h2>
            
            <p>Dear ${clientName},</p>
            
            <p>We have an update on your <strong>${projectName}</strong> project with Steel City AI.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Update Details</h3>
              <p>${updateDetails}</p>
            </div>
            
            ${attachments && attachments.length > 0 ? `
              <p><strong>Attached files:</strong></p>
              <ul>
                ${attachments.map(file => `<li>${file}</li>`).join('')}
              </ul>
            ` : ''}
            
            <p>If you have any questions or would like to schedule a call to discuss these updates, please let us know.</p>
            
            <p>Best regards,<br>
            The Steel City AI Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              Steel City AI - Automating workflows, enhancing productivity
            </p>
          </div>
        </body>
      </html>
    `;

    return { subject, htmlBody };
  }

  // Auto-categorize emails for Steel City AI
  async categorizeIncomingEmails() {
    try {
      // Get recent unread emails
      const emails = await this.getEmails('is:unread', 20);
      
      type EmailType = typeof emails[number];
      const categorized: {
        newInquiries: EmailType[];
        clientCommunications: EmailType[];
        projectUpdates: EmailType[];
        other: EmailType[];
      } = {
        newInquiries: [],
        clientCommunications: [],
        projectUpdates: [],
        other: []
      };

      for (const email of emails) {
        const subject = email.subject.toLowerCase();
        const from = email.from.toLowerCase();

        if (subject.includes('inquiry') || subject.includes('consultation') || subject.includes('quote')) {
          categorized.newInquiries.push(email);
        } else if (subject.includes('project') || subject.includes('update')) {
          categorized.projectUpdates.push(email);
        } else if (this.isKnownClient(from)) {
          categorized.clientCommunications.push(email);
        } else {
          categorized.other.push(email);
        }
      }

      return categorized;
    } catch (error) {
      console.error('Error categorizing emails:', error);
      throw new Error('Failed to categorize emails');
    }
  }

  // Helper to check if sender is a known client
  private isKnownClient(email: string): boolean {
    // This would check against your client database
    // For now, return false - implement based on your client records
    return false;
  }
}