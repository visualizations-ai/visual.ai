import React, { useState } from "react";
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
import { useMutation, useQuery } from "@apollo/client";
import { Sidebar } from "../../shared/sidebar";
import { useAppSelector } from "../../hooks/redux-hooks";
import {
  GET_DATA_SOURCES,
  TEST_CONNECTION,
  CREATE_DATASOURCE,
  DELETE_DATASOURCE,
  UPDATE_DATASOURCE_NAME,
} from "../../graphql/data-sources";

export interface DataSourceForm {
  projectId: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
}

const ImprovedDataSources = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<DataSourceForm>({
    projectId: "",
    host: "",
    port: "5432",
    databaseName: "",
    username: "",
    password: "",
  });


  const {
    data: dataSourcesData,
    loading: dataSourcesLoading,
    refetch: refetchDataSources,
    error: dataSourcesError,
  } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  const [testConnectionMutation, { loading: testingConnection }] = useMutation(TEST_CONNECTION);
  const [createDatasourceMutation, { loading: creatingDatasource }] = useMutation(CREATE_DATASOURCE);
  const [deleteDatasourceMutation] = useMutation(DELETE_DATASOURCE);
  const [updateDataSourceMutation] = useMutation(UPDATE_DATASOURCE_NAME);

  const dataSources = dataSourcesData?.getDataSources?.dataSource || [];

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

    try {
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
        refetchQueries: [{ query: GET_DATA_SOURCES }],
      });

      closeModal();
      alert("Data source created successfully!");
    } catch (error: any) {
      setConnectionMessage(error.message || "Failed to create data source");
      setConnectionStatus("error");
    }
  };

  const handleDelete = async (datasourceId: string, projectId: string) => {
    if (!confirm(`Are you sure you want to delete data source "${projectId}"?`)) {
      return;
    }

    try {
      await deleteDatasourceMutation({
        variables: { datasourceId },
        refetchQueries: [{ query: GET_DATA_SOURCES }],
      });
      alert("Data source deleted successfully!");
    } catch (error: any) {
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

    try {
      const { data } = await updateDataSourceMutation({
        variables: {
          datasourceId: id,
          newName: editingName.trim(),
        },
        refetchQueries: [{ query: GET_DATA_SOURCES }],
      });

      if (data?.updateDataSourceName?.success) {
        setEditingId(null);
        setEditingName("");
      } else {
        throw new Error("Failed to update name");
      }
    } catch (error: any) {
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
    refetchDataSources();
  };

  const inputClass =
    "w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400";

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-50/90 to-slate-50/90 pb-24">
          <div className="max-w-6xl mx-auto h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Database className="text-slate-700" size={28} />
                <div>
                  <h1 className="text-2xl font-semibold text-slate-800">
                    Data Sources
                  </h1>
                  <p className="text-sm text-slate-600">
                    Manage your database connections
                    {user?.id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        User: {user.id.slice(-8)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={dataSourcesLoading}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  title="Refresh data sources"
                >
                  <RefreshCw size={16} className={dataSourcesLoading ? "animate-spin" : ""} />
                  {dataSourcesLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={openModal}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
                >
                  <Plus size={20} />
                  Add Data Source
                </button>
              </div>
            </div>

            {dataSourcesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Error loading data sources</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{dataSourcesError.message}</p>
              </div>
            )}

            {dataSourcesLoading ? (
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
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
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

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={testConnection}
                disabled={testingConnection}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>

              <div className="flex-1 flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={creatingDatasource || connectionStatus !== "success"}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingDatasource ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedDataSources;