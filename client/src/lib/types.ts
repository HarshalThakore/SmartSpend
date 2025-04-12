export interface SystemSettings {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  appName: string;
  contactEmail: string;
  backupFrequency: string;
  lastBackup: Date | null;
}