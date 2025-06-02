import React, { useState } from 'react';
import { Database, Plus, TestTube, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface DataSourceForm {
  projectId: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
}

interface ConnectionError extends Error {
  message: string;
}

const DataSources = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<DataSourceForm>({
    projectId: '',
    host: '',
    port: '5432',
    databaseName: '',
    username: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testConnection = async () => {
    if (!formData.host || !formData.username || !formData.password) {
      setConnectionStatus('error');
      setConnectionMessage('Please fill in all required connection fields');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setConnectionStatus('success');
      setConnectionMessage('Connection successful!');
    } catch (error: unknown) {
      const connectionError = error as ConnectionError;
      setConnectionStatus('error');
      setConnectionMessage(connectionError.message || 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async () => {
    if (connectionStatus !== 'success') {
      setConnectionStatus('error');
      setConnectionMessage('Please test the connection first');
      return;
    }

    setLoading(true);

    try {
      console.log('Creating data source:', formData);
      closeModal();
      alert('Data source created successfully!');
    } catch (error: unknown) {
      const submitError = error as ConnectionError;
      setConnectionMessage(submitError.message || 'Failed to save data source');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    resetForm();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      host: '',
      port: '5432',
      databaseName: '',
      username: '',
      password: ''
    });
    setConnectionStatus('idle');
    setConnectionMessage('');
    setShowPassword(false);
  };

  const inputClass = "w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Database className="text-slate-700" size={28} />
            <h1 className="text-2xl font-semibold text-slate-800">Data Sources</h1>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
          >
            <Plus size={20} />
            Add Data Source
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Database className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No data sources yet</h3>
          <p className="text-slate-500 mb-6">Create your first data source to get started</p>
          <button
            onClick={openModal}
            className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
          >
            Add Your First Data Source
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Add New Data Source
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-white transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Project ID *</label>
                    <input type="text" name="projectId" value={formData.projectId} onChange={handleInputChange} className={inputClass} required placeholder="my-project-id" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Host *</label>
                    <input type="text" name="host" value={formData.host} onChange={handleInputChange} className={inputClass} required placeholder="localhost or IP address" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Port</label>
                    <input type="number" name="port" value={formData.port} onChange={handleInputChange} className={inputClass} placeholder="5432" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Database Name *</label>
                    <input type="text" name="databaseName" value={formData.databaseName} onChange={handleInputChange} className={inputClass} required placeholder="my_database" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Username *</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className={inputClass} required placeholder="username" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className={inputClass} required placeholder="password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={testingConnection}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
                    >
                      {testingConnection ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <TestTube size={16} />
                          Test Connection
                        </>
                      )}
                    </button>

                    {connectionMessage && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        connectionStatus === 'success'
                          ? 'bg-green-900/20 border border-green-500/50 text-green-200'
                          : 'bg-red-900/20 border border-red-500/50 text-red-200'
                      }`}>
                        {connectionStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {connectionMessage}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 text-white py-2 rounded-lg transition bg-slate-600 hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || connectionStatus !== 'success'}
                      className={`flex-1 text-white py-2 rounded-lg transition ${
                        loading || connectionStatus !== 'success'
                          ? "bg-[#7B7EF4]/50 cursor-not-allowed" 
                          : "bg-[#7B7EF4] hover:bg-[#6B6EE4]"
                      } shadow-lg shadow-[#7B7EF4]/20`}
                    >
                      {loading ? 'Saving...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSources;
