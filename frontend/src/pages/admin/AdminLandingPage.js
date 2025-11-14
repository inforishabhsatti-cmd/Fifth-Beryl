import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Image as ImageIcon, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import FileUpload from '../../components/FileUpload';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminLandingPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    hero_title: 'Welcome to Fifth Beryl',
    hero_subtitle: 'Elevate your style with our premium collection of handcrafted shirts.',
    hero_media: null,
    hero_media_type: 'image'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/landing-page`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

const handleMediaUpload = (file) => {
    console.log('Media upload received:', file);
    if (file) {
      setSettings({
        ...settings,
        // Use file.url (Cloudinary URL) instead of file.data (base64)
        hero_media: file.url, 
        hero_media_type: file.type.startsWith('video') ? 'video' : 'image'
      });
      console.log('Settings updated with media');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/landing-page`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Landing page updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" data-testid="back-btn">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair" data-testid="landing-page-settings-title">
            Landing Page Settings
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg space-y-6"
          >
            {/* Hero Media Upload */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Hero Section Media</Label>
              <p className="text-sm text-gray-600 mb-4">
                Upload an image or video for the hero section background. Recommended: High-quality images (1920x1080) or videos (max 20MB)
              </p>
              <FileUpload
                onUpload={handleMediaUpload}
                accept="image/*,video/*"
                maxSize={20}
                label="Upload Image or Video"
              />
              
              {settings.hero_media && (
                <div className="mt-4">
                  <Label className="text-sm mb-2 block">Current Media:</Label>
                  {settings.hero_media_type === 'video' ? (
                    <video
                      src={settings.hero_media}
                      className="w-full h-64 object-cover rounded-lg border"
                      controls
                    />
                  ) : (
                    <img
                      src={settings.hero_media}
                      alt="Hero"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Hero Title */}
            <div>
              <Label htmlFor="hero_title">Hero Title</Label>
              <Input
                id="hero_title"
                value={settings.hero_title}
                onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                placeholder="Welcome to Fifth Beryl"
                className="text-lg"
                data-testid="hero-title-input"
              />
            </div>

            {/* Hero Subtitle */}
            <div>
              <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
              <Textarea
                id="hero_subtitle"
                value={settings.hero_subtitle}
                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                placeholder="Elevate your style with our premium collection..."
                rows={3}
                data-testid="hero-subtitle-input"
              />
            </div>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                data-testid="save-btn"
              >
                <Save size={20} className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={fetchSettings}
                disabled={saving}
                data-testid="reset-btn"
              >
                Reset
              </Button>
            </div>

            {/* Preview Link */}
            <div className="pt-6 border-t">
              <p className="text-sm text-gray-600 mb-2">Preview your changes:</p>
              <Link to="/" target="_blank" className="text-emerald-600 hover:text-emerald-700 underline">
                View Landing Page →
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminLandingPage;
