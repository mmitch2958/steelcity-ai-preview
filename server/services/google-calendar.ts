import { google, calendar_v3 } from 'googleapis';

// Use OAuth2Client type from googleapis to avoid version conflicts
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;

  constructor(auth: OAuth2ClientType) {
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  // Create a dedicated calendar for a client
  async createClientCalendar(name: string, description: string, timezone: string = 'America/New_York') {
    try {
      const calendarData = {
        summary: name,
        description: description,
        timeZone: timezone
      };

      const response = await this.calendar.calendars.insert({
        requestBody: calendarData
      });

      const calendarId = response.data.id ?? '';

      return {
        calendarId,
        name: response.data.summary,
        description: response.data.description,
        timezone: response.data.timeZone || timezone, // Use provided timezone as fallback
        calendarUrl: `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`
      };
    } catch (error) {
      console.error('Error creating client calendar:', error);
      throw new Error('Failed to create client calendar');
    }
  }

  // Create a consultation meeting
  async createConsultationMeeting(
    clientName: string,
    clientEmail: string,
    startTime: Date,
    endTime: Date,
    meetingType: string,
    description?: string
  ) {
    try {
      const event = {
        summary: `${meetingType} - ${clientName}`,
        description: description || `Consultation meeting with ${clientName} for Steel City AI services.`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/New_York' // Adjust based on your timezone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/New_York'
        },
        attendees: [
          { email: clientEmail, displayName: clientName }
        ],
        conferenceData: {
          createRequest: {
            requestId: `steel-city-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'email', minutes: 60 },      // 1 hour before
            { method: 'popup', minutes: 15 }       // 15 minutes before
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      return {
        eventId: response.data.id,
        meetingUrl: response.data.conferenceData?.entryPoints?.[0]?.uri,
        htmlLink: response.data.htmlLink,
        startTime: response.data.start?.dateTime,
        endTime: response.data.end?.dateTime
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create consultation meeting');
    }
  }

  // Get available time slots
  async getAvailableTimeSlots(startDate: Date, endDate: Date, duration: number = 60) {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: 'primary' }]
        }
      });

      const busyTimes = response.data.calendars?.primary?.busy || [];
      
      // Generate available slots (simplified logic)
      const availableSlots = [];
      const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
      
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, 0, 0, 0);
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + duration);

            // Check if slot conflicts with busy times
            const isAvailable = !busyTimes.some((busy: any) => {
              const busyStart = new Date(busy.start);
              const busyEnd = new Date(busy.end);
              return slotStart < busyEnd && slotEnd > busyStart;
            });

            if (isAvailable) {
              availableSlots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString()
              });
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      throw new Error('Failed to get available time slots');
    }
  }

  // Update meeting
  async updateMeeting(eventId: string, updates: any) {
    try {
      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: updates,
        sendUpdates: 'all'
      });

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        updated: response.data.updated
      };
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw new Error('Failed to update meeting');
    }
  }

  // Cancel meeting
  async cancelMeeting(eventId: string, message?: string) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all'
      });

      return true;
    } catch (error) {
      console.error('Error canceling meeting:', error);
      throw new Error('Failed to cancel meeting');
    }
  }

  // List upcoming meetings
  async getUpcomingMeetings(maxResults: number = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error getting upcoming meetings:', error);
      throw new Error('Failed to get upcoming meetings');
    }
  }
}