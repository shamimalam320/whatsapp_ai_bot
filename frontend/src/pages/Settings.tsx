import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as templatesApi from '../api/templates';

interface BusinessProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  whatsappNumber: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [aiConfig, setAiConfig] = useState<any>({
    model: '',
    temperature: 0.7,
    systemPrompt: '',
    autoReply: true,
    tone: 'friendly',
  });
  const [aiSettingsJson, setAiSettingsJson] = useState<string>('');


  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token');

  const handleApiError = (error: any) => {
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await templatesApi.getTemplates();
      if (data.success) setTemplates(data.data || []);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/business/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Profile API response:', data);
      
      if (data.success) {
        setProfile(data.data);
        setWhatsappNumber(data.data.whatsappNumber || '');
        // fetch AI config separately
        fetchAiConfig();
        setError('');
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      handleApiError(error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiConfig = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/business/ai-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) setAiConfig(data.data);
      // fetch ai settings if available
      try {
        const { getAiSettings } = await import('../api/aiSettings');
        const s = await getAiSettings();
        if (s.success) setAiSettingsJson(JSON.stringify(s.data, null, 2));
      } catch (err) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to fetch AI config', err);
    }
  };

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/business/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ whatsappNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ WhatsApp connected successfully! You can now receive messages.');
        setProfile(prev => prev ? { ...prev, whatsappNumber: data.data.whatsappNumber } : null);
      } else {
        setError(data.message || 'Failed to connect WhatsApp');
      }
    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      handleApiError(error);
      setError('Failed to connect WhatsApp');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/business/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Profile updated successfully!');
        setProfile(data.data);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      handleApiError(error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Success/Error Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* WhatsApp Connection Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">💬</span>
                WhatsApp Connection
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Connect your WhatsApp Business number to receive messages
              </p>
            </div>
            {profile?.whatsappNumber && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Connected
              </span>
            )}
          </div>

          <form onSubmit={handleConnectWhatsApp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+14155238886 (Twilio Sandbox Number)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={saving || !whatsappNumber}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Connecting...' : profile?.whatsappNumber ? 'Update' : 'Connect'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 For Twilio sandbox, use: <code className="bg-gray-100 px-1 rounded">+14155238886</code>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                The system will automatically add "whatsapp:" prefix if not included
              </p>
            </div>

            {profile?.whatsappNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Current Number:</strong> {profile.whatsappNumber}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ✅ Your bot is ready to receive WhatsApp messages!
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Business Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🏢</span>
            Business Profile
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={profile?.phone || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={profile?.address || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* AI Configuration Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            AI Configuration
          </h2>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setMessage(''); setError('');
            try {
              const token = getToken();
              const res = await fetch('http://localhost:5000/api/business/ai-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(aiConfig),
              });
              const data = await res.json();
              if (data.success) { setAiConfig(data.data); setMessage('✅ AI settings saved'); }
              else setError(data.message || 'Failed to save AI settings');
            } catch (err: any) { console.error(err); setError('Failed to save AI settings'); }
            finally { setSaving(false); }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input type="text" value={aiConfig.model || ''} onChange={(e) => setAiConfig((prev: any) => ({ ...prev, model: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperature ({aiConfig.temperature})</label>
              <input type="range" min={0} max={1} step={0.05} value={aiConfig.temperature} onChange={(e) => setAiConfig((prev: any) => ({ ...prev, temperature: parseFloat(e.target.value) }))} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <select value={aiConfig.tone} onChange={(e) => setAiConfig((prev: any) => ({ ...prev, tone: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto Reply</label>
              <label className="inline-flex items-center">
                <input type="checkbox" checked={aiConfig.autoReply} onChange={(e) => setAiConfig((prev: any) => ({ ...prev, autoReply: e.target.checked }))} className="mr-2" />
                <span className="text-sm text-gray-700">Automatically reply to incoming messages</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt (optional)</label>
              <textarea rows={4} value={aiConfig.systemPrompt || ''} onChange={(e) => setAiConfig((prev: any) => ({ ...prev, systemPrompt: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                {saving ? 'Saving...' : 'Save AI Settings'}
              </button>
            </div>
          </form>
            {/* AI Settings JSON editor */}
            <div className="mt-6 bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-semibold mb-2">Advanced AI Settings (JSON)</h3>
              <textarea value={aiSettingsJson} onChange={(e)=>setAiSettingsJson(e.target.value)} rows={8} className="w-full border rounded p-2 text-xs font-mono" />
              <div className="flex justify-end mt-3">
                <button onClick={async ()=>{
                  setSaving(true); setMessage(''); setError('');
                  try {
                    const { updateAiSettings } = await import('../api/aiSettings');
                    const parsed = aiSettingsJson ? JSON.parse(aiSettingsJson) : {};
                    const res = await updateAiSettings(parsed);
                    if (res.success) setMessage('✅ Advanced AI settings saved');
                    else setError(res.message || 'Failed to save');
                  } catch (err:any) { console.error(err); setError('Invalid JSON or save failed'); }
                  finally { setSaving(false); }
                }} className="px-4 py-2 bg-green-600 text-white rounded">Save JSON</button>
              </div>
            </div>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📦</span>
            Templates
          </h2>

          <p className="text-sm text-gray-600 mb-4">Choose a template to pre-configure your store for product browsing, orders, and quick replies.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t._id} className={`p-4 border rounded-lg ${selectedTemplate === t._id ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                  </div>
                  <div>
                    <button onClick={() => setSelectedTemplate(t._id)} className="px-3 py-1 bg-gray-200 rounded-lg text-sm">Select</button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <strong>Example:</strong>
                  <div className="mt-2 text-xs text-gray-600 whitespace-pre-line">{t.messageTemplates?.welcome?.en}</div>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" onClick={async () => {
                setSaving(true); setMessage(''); setError('');
                try {
                  const token = getToken();
                  if (!token) { navigate('/login'); return; }
                  const res = await fetch('http://localhost:5000/api/business/apply-template', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ templateId: selectedTemplate })
                  });
                  const data = await res.json();
                  if (data.success) { setMessage('✅ Template applied successfully'); fetchProfile(); }
                  else setError(data.message || 'Failed to apply template');
                } catch (err: any) { console.error(err); setError('Failed to apply template'); }
                finally { setSaving(false); }
              }}>Apply Template</button>
            </div>
          )}
        </div>

        {/* Setup Guide */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📖 Quick Setup Guide
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">1.</span>
              <div>
                <strong>Connect WhatsApp above</strong> - Enter your Twilio sandbox number
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">2.</span>
              <div>
                <strong>Add Products</strong> - Go to Products page and add your catalog
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">3.</span>
              <div>
                <strong>Configure Twilio Webhook</strong> - Set webhook URL in Twilio console
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-blue-600 mr-3">4.</span>
              <div>
                <strong>Test</strong> - Send a WhatsApp message and see it in Chats page
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
