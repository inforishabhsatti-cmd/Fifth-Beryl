import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import FileUpload from '../../components/FileUpload';

const AdminLandingPage = () => {
  const { api } = useAuth(); // Use 'api'
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_media: '',
    hero_media_type: 'image'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/landing-page');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching landing settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/landing-page', settings);
      toast.success('Landing page updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = (fileData) => {
    if (fileData) {
      setSettings({
        ...settings,
        hero_media: fileData.url,
        hero_media_type: fileData.type.startsWith('video') ? 'video' : 'image'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair text-black">Customize Landing Page</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 playfair text-black">Hero Section</h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    className="mt-1 bg-white border-gray-300 focus:border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="hero_subtitle"
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    className="mt-1 bg-white border-gray-300 focus:border-black rounded-none"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Hero Media (Image or Video)</Label>
                  <div className="border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50">
                    {settings.hero_media ? (
                      <div className="relative mb-4">
                        {settings.hero_media_type === 'video' ? (
                          <video 
                            src={settings.hero_media} 
                            className="max-h-64 mx-auto rounded-lg"
                            controls
                          />
                        ) : (
                          <img 
                            src={settings.hero_media} 
                            alt="Hero Preview" 
                            className="max-h-64 mx-auto rounded-lg object-cover"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 rounded-none"
                          onClick={() => setSettings({ ...settings, hero_media: '' })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <p className="text-gray-500 mb-4">No media selected</p>
                      </div>
                    )}
                    
                    <FileUpload 
                      onUpload={handleMediaUpload}
                      accept="image/*,video/*"
                      maxSize={20}
                      label="Upload Hero Media"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full bg-black text-white hover:bg-gray-800 rounded-none py-6 text-lg"
              >
                <Save className="mr-2" size={20} />
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminLandingPage;