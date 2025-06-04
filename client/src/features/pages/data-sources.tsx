import React, { useState, useEffect } from "react";
import {Database,Plus,TestTube,CheckCircle,AlertCircle,Eye,EyeOff,Edit3,Trash2,} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import { Sidebar } from "../../shared/sidebar";
import { formatDistanceToNow } from "date-fns";
import {GET_DATA_SOURCES,TEST_CONNECTION,CREATE_DATASOURCE,DELETE_DATASOURCE,UPDATE_DATASOURCE_NAME,} from "../../graphql/data-sources";

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
	const [loading, setLoading] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [connectionMessage, setConnectionMessage] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [dataSources, setDataSources] = useState<any[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");

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
		refetch,
	} = useQuery(GET_DATA_SOURCES);
	const [testConnectionMutation] = useMutation(TEST_CONNECTION);
	const [createDatasourceMutation] = useMutation(CREATE_DATASOURCE);
	const [deleteDatasourceMutation] = useMutation(DELETE_DATASOURCE);
	const [updateDataSourceMutation] = useMutation(UPDATE_DATASOURCE_NAME);

	useEffect(() => {
		if (dataSourcesData?.getDataSources?.dataSource) {
			setDataSources(dataSourcesData.getDataSources.dataSource);
		}
	}, [dataSourcesData]);

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
		if (
			!formData.host ||
			!formData.username ||
			!formData.password ||
			!formData.databaseName
		) {
			setConnectionStatus("error");
			setConnectionMessage("Please fill in all required connection fields");
			return;
		}

		setLoading(true);
		setConnectionStatus("idle");

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
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async () => {
		if (connectionStatus !== "success") {
			setConnectionStatus("error");
			setConnectionMessage("Please test the connection successfully first");
			return;
		}

		if (!formData.projectId.trim()) {
			setConnectionStatus("error");
			setConnectionMessage("Project ID is required");
			return;
		}

		setLoading(true);

		try {
			const result = await createDatasourceMutation({
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

			const newDataSource = {
				id: Date.now().toString(),
				projectId: formData.projectId,
				type: "postgresql",
				database: formData.databaseName,
			};

			setDataSources((prev) => [...prev, newDataSource]);
			closeModal();
			alert("Data source created successfully!");
			refetch();
		} catch (error: any) {
			setConnectionMessage(error.message || "Failed to save data source");
			setConnectionStatus("error");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (datasourceId: string, projectId: string) => {
		if (
			!confirm(`Are you sure you want to delete data source "${projectId}"?`)
		) {
			return;
		}

		try {
			await deleteDatasourceMutation({
				variables: { datasourceId },
			});

			setDataSources((prev) => prev.filter((ds) => ds.id !== datasourceId));
			alert("Data source deleted successfully!");
			refetch();
		} catch (error: any) {
			alert("Failed to delete data source: " + error.message);
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
		setLoading(false);
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
			});

			if (data?.updateDataSourceName?.success) {
				setDataSources((prev) =>
					prev.map((source) =>
						source.id === id
							? { ...source, projectId: editingName.trim() }
							: source
					)
				);
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
								<h1 className="text-2xl font-semibold text-slate-800">
									Data Sources
								</h1>
							</div>
							<button
								onClick={openModal}
								className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
							>
								<Plus size={20} />
								Add Data Source
							</button>
						</div>

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
								</div>

								<div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
									<div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
										<div className="col-span-3">Data Source</div>
										<div className="col-span-2">Type</div>
										<div className="col-span-2">Database</div>
										<div className="col-span-2">Status</div>
										<div className="col-span-2">Last Sync</div>
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
																	onChange={(e) =>
																		setEditingName(e.target.value)
																	}
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
															Created recently
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
													<span className="text-sm text-gray-500">
														{dataSource.lastSync
															? formatDistanceToNow(
																	new Date(dataSource.lastSync),
																	{ addSuffix: true }
															  )
															: "Never synced"}
													</span>
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
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-semibold text-white">
									Add PostgreSQL Data Source
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
									<label className="block text-sm font-medium text-slate-300 mb-2">
										Project ID *
									</label>
									<input
										type="text"
										name="projectId"
										value={formData.projectId}
										onChange={handleInputChange}
										className={inputClass}
										required
										placeholder="e.g., my-supabase-db"
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
										required
										placeholder="aws-0-eu-central-1.pooler.supabase.com"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-300 mb-2">
										Port
									</label>
									<input
										type="number"
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
										required
										placeholder="postgres"
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
										required
										placeholder="postgres.tchkarrwxtjmbmpkabqt"
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
											required
											placeholder="Your Supabase password"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute inset-y-0 right-0 pr-3 flex items-center"
										>
											{showPassword ? (
												<EyeOff className="h-5 w-5 text-slate-400" />
											) : (
												<Eye className="h-5 w-5 text-slate-400" />
											)}
										</button>
									</div>
								</div>

								<div className="pt-4 border-t border-slate-700">
									<button
										type="button"
										onClick={testConnection}
										disabled={loading}
										className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
									>
										{loading ? (
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
										<div
											className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-3 ${
												connectionStatus === "success"
													? "bg-green-900/20 border border-green-500/50 text-green-200"
													: "bg-red-900/20 border border-red-500/50 text-red-200"
											}`}
										>
											{connectionStatus === "success" ? (
												<CheckCircle size={16} />
											) : (
												<AlertCircle size={16} />
											)}
											{connectionMessage}
										</div>
									)}
								</div>

								<div className="flex gap-3 pt-4">
									<button
										type="button"
										onClick={closeModal}
										disabled={loading}
										className="flex-1 text-white py-3 rounded-lg transition bg-slate-600 hover:bg-slate-500 disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleSubmit}
										disabled={loading || connectionStatus !== "success"}
										className={`flex-1 text-white py-3 rounded-lg transition ${
											loading || connectionStatus !== "success"
												? "bg-[#7B7EF4]/50 cursor-not-allowed"
												: "bg-[#7B7EF4] hover:bg-[#6B6EE4]"
										} shadow-lg shadow-[#7B7EF4]/20`}
									>
										{loading ? "Creating..." : "Create Data Source"}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DataSources;
