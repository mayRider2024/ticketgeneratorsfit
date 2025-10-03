import fs from 'fs';
import path from 'path';

export function checkDashboardAccess() {
  try {
    const statusFile = path.join(process.cwd(), 'dashboard-status.json');
    
    if (!fs.existsSync(statusFile)) {
      return true; // Default to enabled if file doesn't exist
    }
    
    const data = fs.readFileSync(statusFile, 'utf8');
    const status = JSON.parse(data);
    return status.enabled;
  } catch (error) {
    console.error('Error checking dashboard access:', error);
    return true; // Default to enabled on error
  }
}