// src/utils/fileUpload.js

// Convert file to base64 for storage (Optional utility, good to keep)
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Validate file type
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
};

export const validateVideoFile = (file) => {
  const validTypes = [
    'video/mp4', 
    'video/webm', 
    'video/ogg', 
    'video/quicktime',  // Added for iOS MOV files
    'video/3gpp',       // Added for mobile formats
    'video/3gpp2',      // Added for mobile formats
    'video/x-m4v'       // Added for some Apple devices
  ];
  return validTypes.includes(file.type);
};

// Validate file size (max 5MB for images, 20MB for videos)
export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  return file.size <= maxSize;
};