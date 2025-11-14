import { useState, useRef } from 'react';
import { Upload, X, Video } from 'lucide-react';
import { Button } from './ui/button';
import { validateImageFile, validateVideoFile, validateFileSize } from '../utils/fileUpload';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth to get token

// Get Cloudinary config from .env
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.REACT_APP_CLOUDINARY_API_KEY;
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FileUpload = ({ onUpload, accept = 'image/*', maxSize = 5, multiple = false, label = 'Upload Image' }) => {
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { token } = useAuth(); // Get token for our backend API

  // --- NEW UPLOAD LOGIC ---
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const uploadedFilesData = [];

    try {
      for (const file of files) {
        // 1. Basic client-side validation
        const isImageFile = validateImageFile(file);
        const isVideoFile = validateVideoFile(file);
        const imageAllowed = accept.includes('image');
        const videoAllowed = accept.includes('video');

        if ((isImageFile && !imageAllowed) || (isVideoFile && !videoAllowed) || (!isImageFile && !isVideoFile)) {
          toast.error(`${file.name} is not a valid file format.`);
          continue;
        }

        if (!validateFileSize(file, maxSize)) {
          toast.error(`${file.name} exceeds ${maxSize}MB size limit`);
          continue;
        }

        // 2. Get signature from our backend
        const sigResponse = await axios.get(`${API_URL}/upload-signature`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { signature, timestamp } = sigResponse.data;

        // 3. Create FormData and send to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        // Use an "unsigned" preset if you don't want to sign on the backend
        // formData.append("upload_preset", "your_unsigned_preset_name");

        // Determine resource type
        const resourceType = isVideoFile ? 'video' : 'image';
        
        const uploadResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
          formData
        );

        const fileData = {
          name: file.name,
          type: file.type,
          url: uploadResponse.data.secure_url, // This is the Cloudinary URL!
          preview: uploadResponse.data.secure_url 
        };
        
        uploadedFilesData.push(fileData);
      }

      if (uploadedFilesData.length > 0) {
        setPreviews(multiple ? [...previews, ...uploadedFilesData] : uploadedFilesData);
        // Send the *array of file data* (with URLs) to the parent
        onUpload(multiple ? uploadedFilesData : uploadedFilesData[0]);
        toast.success(`${uploadedFilesData.length} file(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. User must be an Admin.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  // --- END NEW UPLOAD LOGIC ---

  const removeFile = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onUpload(multiple ? newPreviews : null);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        <Upload className="mr-2" size={20} />
        {uploading ? 'Uploading...' : label}
      </Button>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {previews.map((file, index) => (
            <div key={index} className="relative group">
              {file.type.startsWith('image') ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <Video size={40} className="text-gray-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
              <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;