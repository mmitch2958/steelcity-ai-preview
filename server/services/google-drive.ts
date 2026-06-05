import { google, drive_v3 } from 'googleapis';

// Use OAuth2Client type from googleapis to avoid version conflicts
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor(auth: OAuth2ClientType) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  // Create a client folder structure
  async createClientFolderStructure(clientName: string, clientId: string) {
    try {
      // Create main client folder
      const mainFolder = await this.drive.files.create({
        requestBody: {
          name: `${clientName} - Steel City AI`,
          mimeType: 'application/vnd.google-apps.folder',
          description: `Client folder for ${clientName} (ID: ${clientId})`
        }
      });

      const mainFolderId = mainFolder.data.id;
      if (!mainFolderId) {
        throw new Error('Failed to get folder ID from Google Drive response');
      }

      // Create subfolders
      const subfolders = [
        'Documents',
        'Processed Files',
        'Reports',
        'Communications'
      ];

      const subfolderIds: Record<string, string> = {};

      for (const folderName of subfolders) {
        const subfolder = await this.drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [mainFolderId]
          }
        });
        const subfolderId = subfolder.data.id;
        if (!subfolderId) {
          throw new Error(`Failed to get subfolder ID for ${folderName}`);
        }
        subfolderIds[folderName] = subfolderId;
      }

      // Note: Folder permissions will be set when sharing with specific client

      return {
        mainFolderId,
        subfolderIds,
        folderUrl: `https://drive.google.com/drive/folders/${mainFolderId}`
      };
    } catch (error) {
      console.error('Error creating client folder structure:', error);
      throw new Error('Failed to create client folder structure');
    }
  }

  // Upload file to specific folder
  async uploadFile(folderId: string, fileName: string, fileContent: Buffer, mimeType: string) {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId]
        },
        media: {
          mimeType,
          body: fileContent
        }
      });

      const fileId = response.data.id;
      if (!fileId) {
        throw new Error('Failed to get file ID from Google Drive response');
      }

      return {
        fileId,
        fileName: response.data.name || fileName,
        fileUrl: `https://drive.google.com/file/d/${fileId}/view`
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  // List files in a folder
  async listFiles(folderId: string) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, createdTime, size, webViewLink)'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  // Download file
  async downloadFile(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  // Delete file
  async deleteFile(fileId: string) {
    try {
      await this.drive.files.delete({ fileId });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Share folder with client
  async shareFolder(folderId: string, clientEmail: string, role: 'reader' | 'writer' = 'reader') {
    try {
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role,
          type: 'user',
          emailAddress: clientEmail
        },
        sendNotificationEmail: true,
        emailMessage: `You now have access to your Steel City AI project folder. You can view your documents and reports here.`
      });

      return true;
    } catch (error) {
      console.error('Error sharing folder:', error);
      throw new Error('Failed to share folder with client');
    }
  }
}