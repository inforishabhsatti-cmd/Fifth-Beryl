import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

const AdminTicker = () => {
  const { api } = useAuth();
  const [settings, setSettings] = useState({
    text: '',
    is_active: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/ticker');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching ticker settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure only the required fields are sent to the API
      await api.put('/ticker', {
          text: settings.text,
          is_active: settings.is_active
      });
      toast.success('Running label updated successfully');
      // Re-fetch data to confirm and update the local state immediately
      await fetchSettings(); 
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update running label');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair text-black">Running Label (Ticker)</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8">
            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div className="flex items-center gap-3">
                    <Zap size={24} className={settings.is_active ? 'text-black' : 'text-gray-400'} />
                    <div>
                        <h2 className="text-xl font-bold playfair text-black">Ticker Status</h2>
                        <p className="text-sm text-gray-500">Toggle the running label on or off.</p>
                    </div>
                </div>
                <Switch
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
                    className="data-[state=checked]:bg-black"
                />
              </div>

              <div>
                <Label htmlFor="ticker_text" className="text-lg font-bold block mb-2">Ticker Text Content</Label>
                <Textarea
                  id="ticker_text"
                  rows={4}
                  value={settings.text}
                  onChange={(e) => setSettings({ ...settings, text: e.target.value })}
                  className="mt-1 bg-white border-gray-300 focus:border-black rounded-none"
                  placeholder="Enter the scrolling message here, e.g., Free Shipping WorldWide | Use Code SUMMER20"
                />
                <p className="text-xs text-gray-500 mt-2">The text will automatically loop horizontally.</p>
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
    </div>
  );
};

export default AdminTicker;