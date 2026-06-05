import { google } from 'googleapis';

// Use OAuth2Client type from googleapis to avoid version conflicts
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export class GoogleAuthService {
  private oauth2Client: OAuth2ClientType;
  
  constructor() {
    const credentials = this.getCredentials();
    this.oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
  }

  private getCredentials() {
    const secretsJson = process.env.GOOGLE_OAUTH_SECRETS;
    if (!secretsJson) {
      throw new Error('GOOGLE_OAUTH_SECRETS environment variable not set');
    }
    
    try {
      const secrets = JSON.parse(secretsJson);
      
      // Dynamically determine redirect URI based on environment
      let redirect_uri = 'http://localhost:5000/auth/google/callback';
      
      // Check if we're on Replit (has REPLIT_DOMAIN env var)
      if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        // Use current Replit URL with https protocol
        const replitUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`;
        redirect_uri = `https://${replitUrl.replace(/^https?:\/\//, '')}/auth/google/callback`;
      } 
      // Check if we're on production domain
      else if (process.env.NODE_ENV === 'production') {
        redirect_uri = 'https://steelcity-ai.com/auth/google/callback';
      }
      
      console.log('[GOOGLE OAUTH DEBUG] Dynamically determined redirect URI:', redirect_uri);
      
      return {
        client_id: secrets.web?.client_id || secrets.installed?.client_id,
        client_secret: secrets.web?.client_secret || secrets.installed?.client_secret,
        redirect_uri
      };
    } catch (error) {
      throw new Error('Invalid GOOGLE_OAUTH_SECRETS format');
    }
  }

  generateAuthUrl(scopes: string[]) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent select_account' // Force consent and account selection
    });
  }

  async getTokenFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
    return this.oauth2Client;
  }

  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  getOAuth2Client() {
    return this.oauth2Client;
  }

  // Standard scopes for Steel City AI integrations
  static readonly SCOPES = {
    DRIVE: 'https://www.googleapis.com/auth/drive',
    GMAIL: 'https://www.googleapis.com/auth/gmail.modify',
    CALENDAR: 'https://www.googleapis.com/auth/calendar',
    SHEETS: 'https://www.googleapis.com/auth/spreadsheets'
  };

  static readonly ALL_SCOPES = [
    GoogleAuthService.SCOPES.DRIVE,
    GoogleAuthService.SCOPES.GMAIL,
    GoogleAuthService.SCOPES.CALENDAR,
    GoogleAuthService.SCOPES.SHEETS
  ];
}