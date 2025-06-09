import React, { useState, useEffect } from "react";
import { AppLayout } from "../../shared/app-layout";
import {
  Database,
  Plus,
  TestTube,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks/redux-hooks";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_DATA_SOURCES,
  TEST_CONNECTION,
  CREATE_DATASOURCE,
  DELETE_DATASOURCE,
  UPDATE_DATASOURCE_NAME,
} from "../../graphql/data-sources";

import {
  setSelectedDataSource,
  fetchDataSources,
  addDataSourceOptimistic,
  removeDataSourceOptimistic,
  updateDataSourceOptimistic,
  clearError,
  loadFromLocalStorage
} from "../../store/dataSources-slice";

export interface DataSourceForm {
  projectId: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
}

const DataSources = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { user } = useAppSelector((state) => state.auth);
  const {
    dataSources,
    selectedDataSource,
    loading: loadingDataSources,
    error: dataSourceError
  } = useAppSelector(state => state.dataSources);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<DataSourceForm>({
    projectId: "",
    host: "",
    port: "5432",
    databaseName: "",
    username: "",
    password: "",
  });

  const getDataSourcesFromStorage = (userId: string) => {
    try {
      const storedData = localStorage.getItem(`dataSources_${userId}`);
      const storedMeta = localStorage.getItem(`dataSourcesMeta_${userId}`);
      
      if (storedData && storedMeta) {
        const meta = JSON.parse(storedMeta);
        const data = JSON.parse(storedData);
        
        const isDataFresh = (Date.now() - meta.lastUpdated) < (24 * 60 * 60 * 1000);
        
        if (isDataFresh) {
          return { data, meta, isFresh: true };
        } else {
          return { data: null, meta, isFresh: false };
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
    return { data: null, meta: null, isFresh: false };
  };

  const saveDataSourcesToStorage = (userId: string, dataSources: any[]) => {
    try {
      localStorage.setItem(`dataSources_${userId}`, JSON.stringify(dataSources));
      localStorage.setItem(`dataSourcesMeta_${userId}`, JSON.stringify({
        lastUpdated: Date.now(),
        count: dataSources.length
      }));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const { data: dataSourcesData, loading: queryLoading, refetch: refetchDataSources } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  const [testConnectionMutation, { loading: testingConnection }] = useMutation(TEST_CONNECTION);
  
  const [createDatasourceMutation, { loading: creatingDatasource }] = useMutation(CREATE_DATASOURCE, {
    onCompleted: (data) => {
      if (data?.createDatasource) {
        dispatch(addDataSourceOptimistic(data.createDatasource));
      }
    }
  });
  
  const [deleteDatasourceMutation] = useMutation(DELETE_DATASOURCE);
  const [updateDataSourceMutation] = useMutation(UPDATE_DATASOURCE_NAME);

  useEffect(() => {
    if (user?.id && dataSources.length > 0) {
      const realDataSources = dataSources.filter(ds => !ds.id.startsWith('temp_'));
      if (realDataSources.length > 0) {
        saveDataSourcesToStorage(user.id, realDataSources);
      }
    }
  }, [dataSources, user?.id]);

  useEffect(() => {
    if (dataSourcesData?.getDataSources?.dataSource) {
      const serverDataSources = dataSourcesData.getDataSources.dataSource;
      
      if (user?.id) {
        saveDataSourcesToStorage(user.id, serverDataSources);
      }
    }
  }, [dataSourcesData, user?.id]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadDataSources = async () => {
      dispatch(loadFromLocalStorage({ userId: user.id }));
      
      const { data: localData, isFresh } = getDataSourcesFromStorage(user.id);
      
      if (!localData || !isFresh) {
        dispatch(fetchDataSources());
      }
    };

    loadDataSources();
  }, [user, navigate, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (connectionStatus === "success") {
      setConnectionStatus("idle");
      setConnectionMessage("");
    }
  };

  const testConnection = async () => {
    if (!formData.host || !formData.username || !formData.password || !formData.databaseName) {
      setConnectionStatus("error");
      setConnectionMessage("Please fill in all required connection fields");
      return;
    }

    try {
      const result = await testConnectionMutation({
        variables: {
          datasource: {
            databaseUrl: formData.host,
            port: formData.port,
            databaseName: formData.databaseName,
            username: formData.username,
            password: formData.password,
          },
        },
      });

      setConnectionStatus("success");
      setConnectionMessage(result.data.checkPostgresqlConnection.message);
    } catch (error: any) {
      setConnectionStatus("error");
      let errorMessage = "Connection failed";
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = `Network error: ${error.networkError.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setConnectionMessage(errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (!formData.projectId.trim()) {
      setConnectionStatus("error");
      setConnectionMessage("Project ID is required");
      return;
    }

    if (connectionStatus !== "success") {
      setConnectionStatus("error");
      setConnectionMessage("Please test the connection first");
      return;
    }

    const tempId = 'temp_' + Date.now();

    try {
      const optimisticDataSource = {
        id: tempId,
        projectId: formData.projectId,
        type: 'postgresql',
        database: formData.databaseName,
      };
      
      dispatch(addDataSourceOptimistic(optimisticDataSource));
      
      closeModal();

      await createDatasourceMutation({
        variables: {
          source: {
            projectId: formData.projectId,
            databaseUrl: formData.host,
            port: formData.port,
            databaseName: formData.databaseName,
            username: formData.username,
            password: formData.password,
          },
        },
      });

      alert("Data source created successfully!");
      
    } catch (error: any) {
      dispatch(removeDataSourceOptimistic(tempId));
      
      setIsModalOpen(true);
      setConnectionMessage(error.message || "Failed to create data source");
      setConnectionStatus("error");
    }
  };

  const handleDelete = async (datasourceId: string, projectId: string) => {
    if (!confirm(`Are you sure you want to delete data source "${projectId}"?`)) {
      return;
    }

    try {
      dispatch(removeDataSourceOptimistic(datasourceId));

      await deleteDatasourceMutation({
        variables: { datasourceId },
      });

      if (user?.id) {
        const updatedDataSources = dataSources.filter(ds => ds.id !== datasourceId);
        saveDataSourcesToStorage(user.id, updatedDataSources);
      }

      alert("Data source deleted successfully!");
    } catch (error: any) {
      dispatch(fetchDataSources());
      alert("Failed to delete data source: " + error.message);
    }
  };

  const handleEditStart = (dataSource: any) => {
    setEditingId(dataSource.id);
    setEditingName(dataSource.projectId);
  };

  const handleEditSave = async (id: string) => {
    if (!editingName.trim()) {
      alert("Name cannot be empty");
      return;
    }

    const originalDataSource = dataSources.find(ds => ds.id === id);
    if (!originalDataSource) return;

    try {
      dispatch(updateDataSourceOptimistic({
        id,
        updates: { projectId: editingName.trim() }
      }));

      const { data } = await updateDataSourceMutation({
        variables: {
          datasourceId: id,
          newName: editingName.trim(),
        },
      });

      if (data?.updateDataSourceName?.success) {
        setEditingId(null);
        setEditingName("");
        dispatch(fetchDataSources());
      } else {
        throw new Error("Failed to update name");
      }
    } catch (error: any) {
      dispatch(updateDataSourceOptimistic({
        id,
        updates: { projectId: originalDataSource.projectId }
      }));
      alert(`Failed to update name: ${error.message}`);
      console.error("Update error:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName("");
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
      projectId: "",
      host: "",
      port: "5432",
      databaseName: "",
      username: "",
      password: "",
    });
    setConnectionStatus("idle");
    setConnectionMessage("");
    setShowPassword(false);
  };

  const handleRefresh = () => {
    dispatch(fetchDataSources());
  };

  const inputClass =
    "w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400";

  const headerActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={handleRefresh}
        disabled={loadingDataSources}
        className="p-2 sm:px-3 sm:py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
        title="Refresh data sources"
      >
        <RefreshCw size={16} className={loadingDataSources ? "animate-spin" : ""} />
        <span className="hidden sm:inline">{loadingDataSources ? "Refreshing..." : "Refresh"}</span>
      </button>
      <button
        onClick={openModal}
        className="p-2 sm:px-4 sm:py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center gap-2"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Add Data Source</span>
      </button>
    </div>
  );

  return (
    <AppLayout
      title="Data Sources"
      subtitle="Manage your database connections"
      icon={<Database className="text-white lg:text-white text-slate-700 lg:w-8 lg:h-8" size={24} />}
      headerActions={headerActions}
    >
      <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {user?.id && (
            <div className="mb-4 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full inline-block">
              User: {user.id.slice(-8)}
            </div>
          )}

          {dataSourceError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error loading data sources</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{dataSourceError}</p>
            </div>
          )}

          {loadingDataSources ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading data sources...</p>
            </div>
          ) : dataSources.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <Database className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                No data sources yet
              </h3>
              <p className="text-slate-500 mb-6">
                Create your first data source to get started
              </p>
              <button
                onClick={openModal}
                className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
              >
                Add Your First Data Source
              </button>
            </div>
          ) : (
            <>
              <div className="hidden lg:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Data Sources ({dataSources.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Your database connections
                  </p>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                    <div className="col-span-3">Data Source</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Database</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Created</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {dataSources.map((dataSource: any) => (
                    <div
                      key={dataSource.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <Database className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            {editingId === dataSource.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="px-2 py-1 text-sm border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleEditSave(dataSource.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="font-semibold text-gray-900">
                                {dataSource.projectId}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Recently created
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {dataSource.type}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-sm text-gray-900">
                            {dataSource.database}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">
                              Connected
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="text-sm text-gray-500">Recently</span>
                        </div>

                        <div className="col-span-1 flex items-center gap-1">
                          <button
                            onClick={() => handleEditStart(dataSource)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit name"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(dataSource.id, dataSource.projectId)
                            }
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete data source"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:hidden space-y-4">
                {dataSources.map((dataSource: any) => (
                  <div
                    key={dataSource.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          {editingId === dataSource.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="px-2 py-1 text-sm border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditSave(dataSource.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="text-red-600 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <h3 className="font-semibold text-gray-900">
                              {dataSource.projectId}
                            </h3>
                          )}
                          <p className="text-sm text-gray-500">Recently created</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditStart(dataSource)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(dataSource.id, dataSource.projectId)
                          }
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete data source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {dataSource.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Database:</span>
                        <span className="text-sm text-gray-900">{dataSource.database}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Status:</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-2">
                Add New Data Source
              </h2>
              <p className="text-slate-400 text-sm">
                Connect to your PostgreSQL database
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project ID *
                </label>
                <input
                  type="text"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Enter project identifier"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Host *
                </label>
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="localhost or IP address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="5432"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Database Name *
                </label>
                <input
                  type="text"
                  name="databaseName"
                  value={formData.databaseName}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Enter database name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Database username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Database password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {connectionMessage && (
                <div
                  className={`p-3 rounded-lg border ${
                    connectionStatus === "success"
                      ? "bg-green-900/50 border-green-700 text-green-300"
                      : "bg-red-900/50 border-red-700 text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {connectionStatus === "success" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{connectionMessage}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="flex items-center justify-center gap-2 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <TestTube className="w-4 h-4" />
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>

              <div className="flex gap-2 flex-1">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={creatingDatasource || connectionStatus !== "success"}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {creatingDatasource ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default DataSources;