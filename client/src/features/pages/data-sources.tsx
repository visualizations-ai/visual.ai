import React, { useState, useEffect } from "react";
import { AppLayout } from "../../shared/app-layout";
import { 
  Database, 
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TestTube2,
  Eye,
  EyeOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector,  } from "../../hooks/redux-hooks";
import { useQuery, useMutation } from "@apollo/client";
import { 
  GET_DATA_SOURCES, 
  CREATE_DATASOURCE, 
  DELETE_DATASOURCE, 
  TEST_CONNECTION 
} from "../../graphql/data-sources";

interface DataSource {
  id: string;
  projectId: string;
  type: string;
  database: string;
}

interface NewDataSourceForm {
  projectId: string;
  databaseUrl: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
}

const DataSources: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDataSource, setNewDataSource] = useState<NewDataSourceForm>({
    projectId: '',
    databaseUrl: '',
    port: '5432',
    databaseName: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  const { data: dataSourcesData, loading: loadingDataSources, refetch } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });

  const [createDataSource, { loading: creatingDataSource }] = useMutation(CREATE_DATASOURCE);
  const [deleteDataSource] = useMutation(DELETE_DATASOURCE);
  const [testConnection] = useMutation(TEST_CONNECTION);

  const dataSources: DataSource[] = dataSourcesData?.getDataSources?.dataSource || [];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCreateDataSource = async () => {
    if (!newDataSource.projectId.trim() || !newDataSource.databaseUrl.trim() || 
        !newDataSource.databaseName.trim() || !newDataSource.username.trim() || 
        !newDataSource.password.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createDataSource({
        variables: {
          source: {
            ...newDataSource,
            type: 'postgresql'
          }
        }
      });

      setIsCreateModalOpen(false);
      setNewDataSource({
        projectId: '',
        databaseUrl: '',
        port: '5432',
        databaseName: '',
        username: '',
        password: ''
      });
      setConnectionStatus('idle');
      
      refetch();
      alert("Data source created successfully!");
    } catch (error: any) {
      console.error("Failed to create data source:", error);
      alert(`Failed to create data source: ${error.message}`);
    }
  };

  const handleDeleteDataSource = async (dataSourceId: string) => {
    if (!confirm("Are you sure you want to delete this data source?")) return;

    try {
      await deleteDataSource({
        variables: { datasourceId: dataSourceId }
      });
      
      refetch();
      alert("Data source deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete data source:", error);
      alert(`Failed to delete data source: ${error.message}`);
    }
  };

  const handleTestConnection = async () => {
    if (!newDataSource.databaseUrl.trim() || !newDataSource.databaseName.trim() || 
        !newDataSource.username.trim() || !newDataSource.password.trim()) {
      alert("Please fill in all connection fields before testing");
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      await testConnection({
        variables: {
          datasource: {
            ...newDataSource,
            type: 'postgresql'
          }
        }
      });
      
      setConnectionStatus('success');
    } catch (error: any) {
      console.error("Connection test failed:", error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  if (loadingDataSources) {
    return (
      <AppLayout
        title="Data Sources"
        subtitle="Manage your database connections"
        icon={<Database className="text-white lg:text-white text-slate-700 lg:w-8 lg:h-8" size={24} />}
      >
        <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full">
          <div className="max-w-6xl mx-auto p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-500">Loading data sources...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const headerActions = (
    <button
      onClick={() => setIsCreateModalOpen(true)}
      className="p-2 lg:px-6 lg:py-3 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
    >
      <Plus size={16} className="lg:w-5 lg:h-5" />
      <span className="hidden lg:inline">Add Data Source</span>
    </button>
  );

  return (
    <AppLayout
      title="Data Sources"
      subtitle="Manage your database connections"
      icon={<Database className="text-white lg:text-white text-slate-700 lg:w-8 lg:h-8" size={24} />}
      headerActions={headerActions}
    >
      <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
          {dataSources.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Database className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">No data sources yet</h3>
              <p className="text-slate-500 mb-8">Connect your first database to get started!</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-8 py-3 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all"
              >
                Add Your First Data Source
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dataSources.map((dataSource) => (
                <div key={dataSource.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all group border border-slate-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Database className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{dataSource.projectId}</h3>
                          <p className="text-sm text-slate-500 capitalize">{dataSource.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteDataSource(dataSource.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Delete data source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Database:</span>
                        <span className="text-slate-700 font-medium">{dataSource.database}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Status:</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-indigo-600" size={24} />
                Add PostgreSQL Data Source
              </h2>
              <p className="text-slate-600 mt-1">Connect to your PostgreSQL database</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newDataSource.projectId}
                  onChange={(e) => setNewDataSource({ ...newDataSource, projectId: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="My Database Project"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Database Host *
                </label>
                <input
                  type="text"
                  value={newDataSource.databaseUrl}
                  onChange={(e) => setNewDataSource({ ...newDataSource, databaseUrl: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="localhost or your-db-host.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  value={newDataSource.port}
                  onChange={(e) => setNewDataSource({ ...newDataSource, port: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="5432"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Database Name *
                </label>
                <input
                  type="text"
                  value={newDataSource.databaseName}
                  onChange={(e) => setNewDataSource({ ...newDataSource, databaseName: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="mydatabase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={newDataSource.username}
                  onChange={(e) => setNewDataSource({ ...newDataSource, username: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="postgres"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newDataSource.password}
                    onChange={(e) => setNewDataSource({ ...newDataSource, password: e.target.value })}
                    className="w-full p-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  {testingConnection ? (
                    <>
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <TestTube2 size={16} />
                      Test Connection
                    </>
                  )}
                </button>

                {connectionStatus === 'success' && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle size={16} />
                    <span className="text-sm">Connection successful!</span>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertTriangle size={16} />
                    <span className="text-sm">Connection failed. Please check your credentials.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setConnectionStatus('idle');
                }}
                className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDataSource}
                disabled={creatingDataSource || connectionStatus !== 'success'}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingDataSource ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Create Data Source
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default DataSources;