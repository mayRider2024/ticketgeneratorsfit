// Utility function to get template URL based on storage type
export function getTemplateUrl(templatePath) {
  if (!templatePath) return null;
  
  // If it's already a data URL or full URL, return as is
  if (templatePath.startsWith('data:') || templatePath.startsWith('http')) {
    return templatePath;
  }
  
  // If it starts with /templates/, it's the old file system path
  if (templatePath.startsWith('/templates/')) {
    return templatePath;
  }
  
  // Otherwise, it's a template ID for the new memory storage system
  return `/api/templates/${templatePath}`;
}

// Function to get template data URL from memory (for canvas operations)
export async function getTemplateDataUrl(templatePath) {
  if (!templatePath) return null;
  
  // If it's already a data URL, return as is
  if (templatePath.startsWith('data:')) {
    return templatePath;
  }
  
  // If it's a file path, convert to URL and fetch
  if (templatePath.startsWith('/templates/')) {
    try {
      const response = await fetch(templatePath);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }
  
  // For template IDs, fetch from the API
  try {
    const response = await fetch(`/api/templates/${templatePath}`);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
  }
}