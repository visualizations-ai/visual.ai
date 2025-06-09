import React, { useState } from "react";
import { AppLayout } from "../../shared/app-layout";
import { Settings, Save, Loader2 } from "lucide-react";

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoSave: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout
      title="Settings"
      subtitle="Manage your preferences"
      icon={<Settings className="text-white" size={24} />}
    >
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-slate-900">General Settings</h2>

        <div className="space-y-6">
          <SettingToggle
            label="Dark Mode"
            description="Enable dark theme for the application"
            checked={settings.darkMode}
            onToggle={() => handleToggle("darkMode")}
          />

          <SettingToggle
            label="Notifications"
            description="Receive notifications about important updates"
            checked={settings.notifications}
            onToggle={() => handleToggle("notifications")}
          />

          <SettingToggle
            label="Auto Save"
            description="Automatically save changes"
            checked={settings.autoSave}
            onToggle={() => handleToggle("autoSave")}
          />
        </div>

        <div className="mt-8 flex items-center space-x-4">
          <button
            disabled={loading}
            onClick={handleSave}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Settings
          </button>
          {saved && <span className="text-green-600 font-medium">Settings saved!</span>}
        </div>
      </div>
    </AppLayout>
  );
};

type SettingToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
};

const SettingToggle = ({ label, description, checked, onToggle }: SettingToggleProps) => {
  return (
    <div className="flex justify-between items-center border border-gray-200 rounded-lg p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onToggle}
          disabled={false}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition" />
        <div className="absolute left-1 top-1 bg-white border border-gray-300 w-4 h-4 rounded-full peer-checked:translate-x-5 transition-transform" />
      </label>
    </div>
  );
};

export default SettingsPage;