import { google, sheets_v4 } from 'googleapis';

// Use OAuth2Client type from googleapis to avoid version conflicts
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;

  constructor(auth: OAuth2ClientType) {
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  // Create a new spreadsheet for client data
  async createClientSpreadsheet(clientName: string, clientId: string) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${clientName} - Steel City AI Dashboard`
          },
          sheets: [
            {
              properties: {
                title: 'Project Overview',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 10
                }
              }
            },
            {
              properties: {
                title: 'Consultations',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 8
                }
              }
            },
            {
              properties: {
                title: 'Documents',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 6
                }
              }
            },
            {
              properties: {
                title: 'Analytics',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 8
                }
              }
            }
          ]
        }
      });

      const spreadsheetId = response.data.spreadsheetId;
      const spreadsheetUrl = response.data.spreadsheetUrl;

      // Set up initial headers and formatting
      await this.setupClientDashboardHeaders(spreadsheetId ?? '');

      // Note: Spreadsheet permissions will be set when sharing with specific client

      return {
        spreadsheetId,
        spreadsheetUrl,
        clientId
      };
    } catch (error) {
      console.error('Error creating client spreadsheet:', error);
      throw new Error('Failed to create client spreadsheet');
    }
  }

  // Set up headers for client dashboard
  private async setupClientDashboardHeaders(spreadsheetId: string) {
    try {
      // Project Overview headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Project Overview!A1:J1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Project Name',
            'Status',
            'Start Date',
            'Estimated Completion',
            'Progress %',
            'Service Type',
            'Priority',
            'Last Updated',
            'Notes',
            'Next Action'
          ]]
        }
      });

      // Consultations headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Consultations!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Date',
            'Time',
            'Type',
            'Status',
            'Meeting Link',
            'Notes',
            'Follow-up Required',
            'Next Steps'
          ]]
        }
      });

      // Documents headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Documents!A1:F1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Document Name',
            'Type',
            'Upload Date',
            'Status',
            'Drive Link',
            'Description'
          ]]
        }
      });

      // Analytics headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Analytics!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Metric',
            'Current Value',
            'Previous Value',
            'Change %',
            'Date',
            'Target',
            'Status',
            'Notes'
          ]]
        }
      });

      // Format headers (bold)
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0, // Project Overview
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                  }
                },
                fields: 'userEnteredFormat(textFormat,backgroundColor)'
              }
            }
          ]
        }
      });

    } catch (error) {
      console.error('Error setting up dashboard headers:', error);
      throw new Error('Failed to set up dashboard headers');
    }
  }

  // Update project data in spreadsheet
  async updateProjectData(spreadsheetId: string, projects: any[]) {
    try {
      const values = projects.map(project => [
        project.name,
        project.status,
        project.startDate,
        project.estimatedCompletion,
        project.progress,
        project.serviceType,
        project.priority,
        project.lastUpdated,
        project.notes,
        project.nextAction
      ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Project Overview!A2:J${values.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      return true;
    } catch (error) {
      console.error('Error updating project data:', error);
      throw new Error('Failed to update project data');
    }
  }

  // Update consultations data
  async updateConsultationsData(spreadsheetId: string, consultations: any[]) {
    try {
      const values = consultations.map(consultation => [
        consultation.date,
        consultation.time,
        consultation.type,
        consultation.status,
        consultation.meetingLink,
        consultation.notes,
        consultation.followupRequired,
        consultation.nextSteps
      ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Consultations!A2:H${values.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      return true;
    } catch (error) {
      console.error('Error updating consultations data:', error);
      throw new Error('Failed to update consultations data');
    }
  }

  // Update documents data
  async updateDocumentsData(spreadsheetId: string, documents: any[]) {
    try {
      const values = documents.map(doc => [
        doc.name,
        doc.type,
        doc.uploadDate,
        doc.status,
        doc.driveLink,
        doc.description
      ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Documents!A2:F${values.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      return true;
    } catch (error) {
      console.error('Error updating documents data:', error);
      throw new Error('Failed to update documents data');
    }
  }

  // Share spreadsheet with specific user
  async shareSpreadsheet(spreadsheetId: string, clientEmail: string, role: 'reader' | 'writer' = 'reader') {
    try {
      if (!clientEmail || clientEmail === 'anyone') {
        throw new Error('Client email is required for secure sharing');
      }

      const drive = google.drive({ version: 'v3', auth: this.sheets.context._options.auth });
      
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role,
          type: 'user',
          emailAddress: clientEmail
        },
        sendNotificationEmail: true,
        emailMessage: 'You now have access to your Steel City AI project dashboard with real-time updates.'
      });

      return true;
    } catch (error) {
      console.error('Error sharing spreadsheet:', error);
      throw new Error('Failed to share spreadsheet');
    }
  }

  // Get spreadsheet data
  async getSpreadsheetData(spreadsheetId: string, range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error getting spreadsheet data:', error);
      throw new Error('Failed to get spreadsheet data');
    }
  }

  // Create analytics dashboard
  async createAnalyticsDashboard(spreadsheetId: string, analyticsData: any[]) {
    try {
      const values = analyticsData.map(metric => [
        metric.name,
        metric.currentValue,
        metric.previousValue,
        metric.changePercent,
        metric.date,
        metric.target,
        metric.status,
        metric.notes
      ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Analytics!A2:H${values.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      // Add some charts/formatting for better visualization
      await this.addAnalyticsCharts(spreadsheetId);

      return true;
    } catch (error) {
      console.error('Error creating analytics dashboard:', error);
      throw new Error('Failed to create analytics dashboard');
    }
  }

  // Add charts to analytics sheet
  private async addAnalyticsCharts(spreadsheetId: string) {
    try {
      // Add a simple chart for progress tracking
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addChart: {
                chart: {
                  spec: {
                    title: 'Progress Overview',
                    basicChart: {
                      chartType: 'COLUMN',
                      legendPosition: 'BOTTOM_LEGEND',
                      domains: [{
                        domain: {
                          sourceRange: {
                            sources: [{
                              sheetId: 3, // Analytics sheet
                              startRowIndex: 1,
                              endRowIndex: 10,
                              startColumnIndex: 0,
                              endColumnIndex: 1
                            }]
                          }
                        }
                      }],
                      series: [{
                        series: {
                          sourceRange: {
                            sources: [{
                              sheetId: 3,
                              startRowIndex: 1,
                              endRowIndex: 10,
                              startColumnIndex: 1,
                              endColumnIndex: 2
                            }]
                          }
                        }
                      }]
                    }
                  },
                  position: {
                    overlayPosition: {
                      anchorCell: {
                        sheetId: 3,
                        rowIndex: 12,
                        columnIndex: 0
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error adding analytics charts:', error);
      // Don't throw error for chart creation failure
    }
  }

  // Create project milestone dashboard for live tracking
  async createProjectDashboard(projectId: string, projectTitle: string, clientName: string) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${projectTitle} - Live Project Dashboard | Steel City AI`
          },
          sheets: [
            {
              properties: {
                title: 'Project Overview',
                gridProperties: {
                  rowCount: 50,
                  columnCount: 8
                }
              }
            },
            {
              properties: {
                title: 'Milestones & Progress',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 10
                }
              }
            },
            {
              properties: {
                title: 'Status Updates',
                gridProperties: {
                  rowCount: 200,
                  columnCount: 6
                }
              }
            },
            {
              properties: {
                title: 'Deliverables',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 8
                }
              }
            }
          ]
        }
      });

      const spreadsheetId = response.data.spreadsheetId;
      const spreadsheetUrl = response.data.spreadsheetUrl;

      // Set up project dashboard headers and formatting
      await this.setupProjectDashboardHeaders(spreadsheetId ?? '', projectTitle, clientName);

      return {
        spreadsheetId,
        spreadsheetUrl,
        projectId
      };
    } catch (error) {
      console.error('Error creating project dashboard:', error);
      throw new Error('Failed to create project dashboard');
    }
  }

  // Set up headers for project milestone dashboard
  private async setupProjectDashboardHeaders(spreadsheetId: string, projectTitle: string, clientName: string) {
    try {
      // Project Overview headers and data
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              range: 'Project Overview!A1:H20',
              values: [
                ['PROJECT OVERVIEW', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['Project:', projectTitle, '', '', 'Client:', clientName, '', ''],
                ['Status:', 'In Progress', '', '', 'Last Updated:', new Date().toLocaleDateString(), '', ''],
                ['Overall Progress:', '0%', '', '', 'Start Date:', '', '', ''],
                ['Expected Completion:', '', '', '', 'Budget Used:', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['QUICK STATS', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['Total Milestones:', '0', '', '', 'Completed:', '0', '', ''],
                ['Active Deliverables:', '0', '', '', 'Pending Review:', '0', '', ''],
                ['Hours Logged:', '0', '', '', 'Estimated Hours:', '0', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['CONTACT INFORMATION', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['Project Manager:', 'Steel City AI Team', '', '', '', '', '', ''],
                ['Email:', 'mike@steelcity-ai.com', '', '', '', '', '', ''],
                ['Phone:', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['Last sync: ' + new Date().toLocaleString(), '', '', '', '', '', '', '']
              ]
            },
            {
              range: 'Milestones & Progress!A1:J1',
              values: [
                ['Milestone', 'Description', 'Status', 'Progress %', 'Due Date', 'Completed', 'Est. Hours', 'Actual Hours', 'Deliverables', 'Notes']
              ]
            },
            {
              range: 'Status Updates!A1:F1',
              values: [
                ['Date', 'Update Type', 'Title', 'Message', 'Milestone', 'Attachments']
              ]
            },
            {
              range: 'Deliverables!A1:H1',
              values: [
                ['Deliverable', 'Type', 'Milestone', 'Status', 'Description', 'File Link', 'Updated', 'Notes']
              ]
            }
          ]
        }
      });

      // Apply formatting to make it look professional
      await this.formatProjectDashboard(spreadsheetId);

    } catch (error) {
      console.error('Error setting up project dashboard headers:', error);
      throw error;
    }
  }

  // Format project dashboard for professional appearance
  private async formatProjectDashboard(spreadsheetId: string) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            // Format Project Overview title
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 8
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 14 },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            },
            // Format headers in Milestones sheet
            {
              repeatCell: {
                range: {
                  sheetId: 1,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 10
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            },
            // Format headers in Status Updates sheet
            {
              repeatCell: {
                range: {
                  sheetId: 2,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 6
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            },
            // Format headers in Deliverables sheet  
            {
              repeatCell: {
                range: {
                  sheetId: 3,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 8
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER'
                  }
                },
                fields: 'userEnteredFormat'
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error formatting project dashboard:', error);
      // Don't throw error for formatting failure
    }
  }

  // Update project milestone data in dashboard
  async updateProjectMilestones(spreadsheetId: string, milestones: any[]) {
    try {
      const values = milestones.map(milestone => [
        milestone.title,
        milestone.description || '',
        milestone.status,
        `${milestone.progress}%`,
        milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '',
        milestone.completedAt ? new Date(milestone.completedAt).toLocaleDateString() : '',
        milestone.estimatedHours || '',
        milestone.actualHours || '',
        milestone.deliverables?.length || 0,
        ''
      ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Milestones & Progress!A2:J${values.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values
        }
      });

      // Update overview statistics
      const completedMilestones = milestones.filter(m => m.status === 'completed').length;
      const totalProgress = milestones.length > 0 ? 
        Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length) : 0;

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              range: 'Project Overview!B5',
              values: [[`${totalProgress}%`]]
            },
            {
              range: 'Project Overview!B10',
              values: [[milestones.length]]
            },
            {
              range: 'Project Overview!F10',
              values: [[completedMilestones]]
            },
            {
              range: 'Project Overview!F6',
              values: [[new Date().toLocaleDateString()]]
            }
          ]
        }
      });

    } catch (error) {
      console.error('Error updating project milestones:', error);
      throw error;
    }
  }

  // Update status updates in dashboard
  async updateProjectStatusUpdates(spreadsheetId: string, statusUpdates: any[]) {
    try {
      const values = statusUpdates
        .filter(update => update.clientVisible)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50) // Limit to 50 most recent updates
        .map(update => [
          new Date(update.createdAt).toLocaleDateString(),
          update.updateType,
          update.title,
          update.message,
          update.milestoneName || '',
          update.attachments?.length ? `${update.attachments.length} files` : ''
        ]);

      if (values.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Status Updates!A2:F${values.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values
          }
        });
      }

    } catch (error) {
      console.error('Error updating status updates:', error);
      throw error;
    }
  }

  // Update deliverables in dashboard
  async updateProjectDeliverables(spreadsheetId: string, deliverables: any[]) {
    try {
      const values = deliverables.map(deliverable => [
        deliverable.title,
        deliverable.deliverableType,
        deliverable.milestoneName || '',
        deliverable.status,
        deliverable.description || '',
        deliverable.fileUrl || '',
        new Date(deliverable.updatedAt).toLocaleDateString(),
        deliverable.notes || ''
      ]);

      if (values.length > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Deliverables!A2:H${values.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values
          }
        });
      }

      // Update deliverable stats in overview
      const activeDeliverables = deliverables.filter(d => 
        d.status === 'in_progress' || d.status === 'pending'
      ).length;
      const reviewDeliverables = deliverables.filter(d => d.status === 'review').length;

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              range: 'Project Overview!B11',
              values: [[activeDeliverables]]
            },
            {
              range: 'Project Overview!F11',
              values: [[reviewDeliverables]]
            }
          ]
        }
      });

    } catch (error) {
      console.error('Error updating deliverables:', error);
      throw error;
    }
  }

  // Sync complete project data to dashboard
  async syncProjectDashboard(spreadsheetId: string, projectData: {
    project: any;
    milestones: any[];
    statusUpdates: any[];
    deliverables: any[];
  }) {
    try {
      // Update project overview info
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              range: 'Project Overview!B3',
              values: [[projectData.project.title]]
            },
            {
              range: 'Project Overview!B4',
              values: [[projectData.project.status]]
            },
            {
              range: 'Project Overview!F5',
              values: [[projectData.project.startDate ? new Date(projectData.project.startDate).toLocaleDateString() : '']]
            },
            {
              range: 'Project Overview!B6',
              values: [[projectData.project.endDate ? new Date(projectData.project.endDate).toLocaleDateString() : '']]
            },
            {
              range: 'Project Overview!A20',
              values: [['Last sync: ' + new Date().toLocaleString()]]
            }
          ]
        }
      });

      // Update all sections
      await Promise.all([
        this.updateProjectMilestones(spreadsheetId, projectData.milestones),
        this.updateProjectStatusUpdates(spreadsheetId, projectData.statusUpdates),
        this.updateProjectDeliverables(spreadsheetId, projectData.deliverables)
      ]);

      return { success: true, lastSynced: new Date() };

    } catch (error) {
      console.error('Error syncing project dashboard:', error);
      throw error;
    }
  }
}