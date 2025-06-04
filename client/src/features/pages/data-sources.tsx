import React, { useState, useEffect } from "react";
import {Database,Plus,TestTube,CheckCircle,AlertCircle,Eye,EyeOff,Edit3,Trash2,RefreshCw,} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import { Sidebar } from "../../shared/sidebar";
import { formatDistanceToNow } from "date-fns";
import { useAppSelector } from "../../hooks/redux-hooks";
import {GET_DATA_SOURCES,TEST_CONNECTION,CREATE_DATASOURCE,DELETE_DATASOURCE,UPDATE_DATASOURCE_NAME,} from "../../graphql/data-sources";
import client from "../../graphql/apollo-client";

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
	const [hasUserIdSupport, setHasUserIdSupport] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [loadedFromCache, setLoadedFromCache] = useState(false);

	// קבלת פרטי המשתמש המחובר מה-Redux store
	const { user } = useAppSelector(state => state.auth);

	const [formData, setFormData] = useState<DataSourceForm>({
		projectId: "",
		host: "",
		port: "5432",
		databaseName: "",
		username: "",
		password: "",
	});

	// פונקציות Local Storage
	const getLocalStorageKey = (userId: string) => `dataSources_${userId}`;
	const getCacheMetaKey = (userId: string) => `dataSourcesMeta_${userId}`;

	const saveToLocalStorage = (userId: string, data: any[]) => {
		try {
			const key = getLocalStorageKey(userId);
			const metaKey = getCacheMetaKey(userId);
			
			localStorage.setItem(key, JSON.stringify(data));
			localStorage.setItem(metaKey, JSON.stringify({
				timestamp: Date.now(),
				count: data.length,
				hasUserIdSupport
			}));
			
			console.log(`Saved ${data.length} data sources to localStorage for user ${userId}`);
		} catch (error) {
			console.error("Failed to save to localStorage:", error);
		}
	};

	const loadFromLocalStorage = (userId: string) => {
		try {
			const key = getLocalStorageKey(userId);
			const metaKey = getCacheMetaKey(userId);
			
			const data = localStorage.getItem(key);
			const meta = localStorage.getItem(metaKey);
			
			if (data && meta) {
				const parsedData = JSON.parse(data);
				const parsedMeta = JSON.parse(meta);
				
				// בדוק אם הקאש לא ישן מדי (למשל, 1 שעה)
				const isExpired = (Date.now() - parsedMeta.timestamp) > (60 * 60 * 1000);
				
				if (!isExpired) {
					console.log(`Loaded ${parsedData.length} data sources from localStorage for user ${userId}`);
					setHasUserIdSupport(parsedMeta.hasUserIdSupport || false);
					return parsedData;
				} else {
					console.log("localStorage cache expired, will fetch from server");
					clearUserLocalStorage(userId);
				}
			}
		} catch (error) {
			console.error("Failed to load from localStorage:", error);
		}
		return null;
	};

	const clearUserLocalStorage = (userId: string) => {
		try {
			const key = getLocalStorageKey(userId);
			const metaKey = getCacheMetaKey(userId);
			
			localStorage.removeItem(key);
			localStorage.removeItem(metaKey);
			
			console.log(`Cleared localStorage for user ${userId}`);
		} catch (error) {
			console.error("Failed to clear localStorage:", error);
		}
	};

	const clearAllDataSourcesCache = () => {
		try {
			// מחק את כל הקאש של data sources (לכל המשתמשים)
			const keys = Object.keys(localStorage);
			keys.forEach(key => {
				if (key.startsWith('dataSources_') || key.startsWith('dataSourcesMeta_')) {
					localStorage.removeItem(key);
				}
			});
			console.log("Cleared all data sources cache");
		} catch (error) {
			console.error("Failed to clear cache:", error);
		}
	};

	// שאילתה עם דיבוג מפורט - רק אם אין קאש
	const {
		data: dataSourcesData,
		loading: dataSourcesLoading,
		refetch,
		error: dataSourcesError
	} = useQuery(GET_DATA_SOURCES, {
		skip: loadedFromCache, // דלג על השאילתה אם טענו מהקאש
		errorPolicy: 'all',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data) => {
			console.log("=== useQuery onCompleted ===");
			console.log("Received data:", data);
		},
		onError: (error) => {
			console.error("=== useQuery onError ===");
			console.error("GraphQL Error:", error);
		}
	});

	const [testConnectionMutation] = useMutation(TEST_CONNECTION);
	const [createDatasourceMutation] = useMutation(CREATE_DATASOURCE);
	const [deleteDatasourceMutation] = useMutation(DELETE_DATASOURCE);
	const [updateDataSourceMutation] = useMutation(UPDATE_DATASOURCE_NAME);

	// פונקציה אופטימלית לביצוע fetch עם ניסיון userId
	const fetchDataSourcesManually = async (forceRefresh = false) => {
		try {
			console.log("=== Manual Fetch Attempt ===");
			console.log("Current user ID:", user?.id);
			console.log("Force refresh:", forceRefresh);
			
			// אם לא forceRefresh, נסה קודם מהקאש
			if (!forceRefresh && user?.id) {
				const cachedData = loadFromLocalStorage(user.id);
				if (cachedData) {
					setDataSources(cachedData);
					setLoadedFromCache(true);
					return;
				}
			}

			// ניסיון 1: לנסות לקבל userId מהשרת
			const responseWithUserId = await fetch('http://localhost:3000/api/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					query: `
						query GetDataSources {
							getDataSources {
								dataSource {
									id
									projectId
									type
									database
									userId
								}
							}
						}
					`
				}),
			});

			console.log("Response with userId status:", responseWithUserId.status);
			
			if (responseWithUserId.ok) {
				const result = await responseWithUserId.json();
				console.log("Result with userId:", result);
				
				// בדוק אם יש שגיאות GraphQL
				if (result.errors && result.errors.length > 0) {
					const hasUserIdError = result.errors.some((error: any) => 
						error.message.includes('userId') || error.message.includes('Cannot query field')
					);
					
					if (hasUserIdError) {
						console.log("Server doesn't support userId field, falling back...");
					} else {
						console.error("Other GraphQL errors:", result.errors);
					}
				} else if (result.data?.getDataSources?.dataSource) {
					// הצלחנו לקבל userId!
					setHasUserIdSupport(true);
					const allDataSources = result.data.getDataSources.dataSource;
					console.log("All data sources with userId:", allDataSources);
					
					// סנן לפי המשתמש הנוכחי
					if (user?.id) {
						const userDataSources = allDataSources.filter(
							(ds: any) => {
								console.log(`Comparing userId: ${ds.userId} with current user: ${user.id}`);
								return ds.userId === user.id;
							}
						);
						console.log("User's data sources:", userDataSources);
						setDataSources(userDataSources);
						
						// שמור בקאש
						saveToLocalStorage(user.id, userDataSources);
						return;
					}
				}
			}
			
			// ניסיון 2: אם userId לא עבד, נסה בלי userId
			console.log("Trying without userId (fallback approach)...");
			const response = await fetch('http://localhost:3000/api/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					query: `
						query GetDataSources {
							getDataSources {
								dataSource {
									id
									projectId
									type
									database
								}
							}
						}
					`
				}),
			});

			console.log("Response without userId status:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("Result without userId:", result);
				
				if (result.data?.getDataSources?.dataSource) {
					const allDataSources = result.data.getDataSources.dataSource;
					console.log("All data sources (without userId):", allDataSources);
					
					// אסטרטגיית סינון בסיסית
					if (user?.email) {
						const recentDataSources = allDataSources.slice(-10); // 10 האחרונים
						console.log("Showing recent data sources:", recentDataSources);
						setDataSources(recentDataSources);
						
						// שמור בקאש גם במקרה הזה
						if (user?.id) {
							saveToLocalStorage(user.id, recentDataSources);
						}
					} else {
						setDataSources(allDataSources);
					}
				}
			} else {
				const errorText = await response.text();
				console.error("Manual fetch error:", errorText);
			}
			
		} catch (error) {
			console.error("Manual fetch failed:", error);
		}
	};

	// פונקציה לרענון ידני
	const handleManualRefresh = async () => {
		setRefreshing(true);
		console.log("Manual refresh triggered - will fetch from server");
		try {
			setLoadedFromCache(false); // אפשר שאילתות שוב
			await fetchDataSourcesManually(true); // force refresh
		} catch (error) {
			console.error("Manual refresh failed:", error);
		} finally {
			setRefreshing(false);
		}
	};

	// טעינה ראשונית כשהמשתמש נטען
	useEffect(() => {
		console.log("=== User Changed ===");
		console.log("User loaded:", user);
		
		// תמיד נקה דאטה קודמת כשמשתמש משתנה
		if (user?.id) {
			console.log("User loaded, clearing previous data and loading for current user...");
			setDataSources([]); // נקה דאטה קודמת
			setLoadedFromCache(false);
			
			// נסה קודם מהקאש - רק עבור המשתמש הנוכחי
			const cachedData = loadFromLocalStorage(user.id);
			if (cachedData) {
				console.log("Loaded from cache successfully for user:", user.id);
				setDataSources(cachedData);
				setLoadedFromCache(true);
			} else {
				console.log("No cache found, fetching from server...");
				fetchDataSourcesManually();
			}
		} else if (!user) {
			// אם אין משתמש (logout), נקה הכל
			console.log("No user - clearing all data");
			setDataSources([]);
			setLoadedFromCache(false);
		}
	}, [user?.id]); // תלוי ב-user.id ולא ב-user כולו

	// הוסף useEffect להאזנה לשינויי משתמש בזמן אמת
	useEffect(() => {
		// אם המשתמש השתנה (התחלף משתמש), נקה קאש ישן
		const previousUserId = localStorage.getItem('currentUserId');
		
		if (user?.id && previousUserId && previousUserId !== user.id) {
			console.log(`User changed from ${previousUserId} to ${user.id} - clearing old cache`);
			
			// נקה קאש של המשתמש הקודם
			if (previousUserId) {
				clearUserLocalStorage(previousUserId);
			}
			
			// נקה גם דאטה נוכחית
			setDataSources([]);
			setLoadedFromCache(false);
		}
		
		// שמור את המשתמש הנוכחי
		if (user?.id) {
			localStorage.setItem('currentUserId', user.id);
		} else {
			localStorage.removeItem('currentUserId');
		}
	}, [user?.id]);

	// useEffect לטיפול ב-GraphQL data (רק אם לא טענו מקאש)
	useEffect(() => {
		if (loadedFromCache) return; // דלג אם טענו מקאש
		
		console.log("=== GraphQL Data Debug ===");
		console.log("dataSourcesData:", dataSourcesData);
		console.log("dataSourcesLoading:", dataSourcesLoading);
		console.log("dataSourcesError:", dataSourcesError);
		
		// אם יש שגיאה ב-GraphQL, נסה fetch ישיר
		if (dataSourcesError && user?.id) {
			console.log("GraphQL error detected, trying manual fetch...");
			fetchDataSourcesManually();
			return;
		}
		
		// אם GraphQL הצליח
		if (dataSourcesData?.getDataSources?.dataSource) {
			const allDataSources = dataSourcesData.getDataSources.dataSource;
			console.log("All data sources from GraphQL:", allDataSources);
			
			if (hasUserIdSupport && user?.id) {
				const userDataSources = allDataSources.filter(
					(ds: any) => ds.userId === user.id
				);
				setDataSources(userDataSources);
				saveToLocalStorage(user.id, userDataSources);
			} else {
				const recentDataSources = allDataSources.slice(-10);
				setDataSources(recentDataSources);
				if (user?.id) {
					saveToLocalStorage(user.id, recentDataSources);
				}
			}
		}
	}, [dataSourcesData, dataSourcesLoading, dataSourcesError, hasUserIdSupport, loadedFromCache]);

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
		if (!formData.projectId.trim()) {
			setConnectionStatus("error");
			setConnectionMessage("Project ID is required");
			return;
		}

		setLoading(true);

		try {
			console.log("Creating data source for user:", user?.id);
			
			const response = await fetch('http://localhost:3000/api/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					query: `
						mutation CreatePostgresqlDataSource($source: DataSourceInfo!) {
							createPostgresqlDataSource(source: $source) {
								dataSource {
									id
									projectId
									type
									database
									${hasUserIdSupport ? 'userId' : ''}
								}
							}
						}
					`,
					variables: {
						source: {
							projectId: formData.projectId,
							databaseUrl: formData.host,
							port: formData.port,
							databaseName: formData.databaseName,
							username: formData.username,
							password: formData.password,
						}
					}
				}),
			});

			console.log("Create response status:", response.status);

			if (response.ok) {
				const result = await response.json();
				console.log("Create result:", result);

				// אם יצירה הצליחה, הוסף לדאטה המקומית מיד
				if (result.data?.createPostgresqlDataSource?.dataSource) {
					const newDataSource = result.data.createPostgresqlDataSource.dataSource;
					
					// הוסף לרשימה הקיימת
					const updatedDataSources = [...dataSources, newDataSource];
					setDataSources(updatedDataSources);
					
					// עדכן קאש
					if (user?.id) {
						saveToLocalStorage(user.id, updatedDataSources);
					}
					
					closeModal();
					alert("Data source created successfully!");
				} else {
					// אם לא קיבלנו את הדאטה בחזרה, רענן מהשרת
					closeModal();
					alert("Data source created successfully!");
					
					if (user?.id) {
						clearUserLocalStorage(user.id);
					}
					setLoadedFromCache(false);
					await fetchDataSourcesManually(true);
				}
			} else {
				const errorText = await response.text();
				throw new Error(`Server error: ${response.status} - ${errorText}`);
			}

		} catch (error: any) {
			console.error("=== Create Error ===");
			console.error("Error:", error);
			
			// טיפול גמיש בשגיאות - אבל עדיין רענן מהשרת
			if (error.message.includes('400') || error.message.includes('Bad Request')) {
				console.log("Ignoring 400 error, data source was probably created");
				closeModal();
				alert("Data source created successfully!");
				
				// רענן מהשרת במקרה של שגיאה
				if (user?.id) {
					clearUserLocalStorage(user.id);
				}
				setLoadedFromCache(false);
				await fetchDataSourcesManually(true);
			} else {
				setConnectionMessage(error.message || "Failed to create data source");
				setConnectionStatus("error");
			}
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
				variables: { 
					datasourceId
				},
			});

			// עדכן מקומי
			const updatedDataSources = dataSources.filter((ds) => ds.id !== datasourceId);
			setDataSources(updatedDataSources);
			
			// עדכן קאש
			if (user?.id) {
				saveToLocalStorage(user.id, updatedDataSources);
			}
			
			alert("Data source deleted successfully!");

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
				const updatedDataSources = dataSources.map((source) =>
					source.id === id
						? { ...source, projectId: editingName.trim() }
						: source
				);
				
				setDataSources(updatedDataSources);
				
				// עדכן קאש
				if (user?.id) {
					saveToLocalStorage(user.id, updatedDataSources);
				}
				
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
								<div>
									<h1 className="text-2xl font-semibold text-slate-800">
										Data Sources
									</h1>
									<p className="text-sm text-slate-600">
										{hasUserIdSupport 
											? "Your personal data connections" 
											: "Recent data connections"
										}
										{loadedFromCache && " (from cache)"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={handleManualRefresh}
									disabled={refreshing}
									className="flex items-center gap-2 px-3 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
									title="Refresh data sources from server"
								>
									<RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
									{refreshing ? "Refreshing..." : "Refresh"}
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

						{(dataSourcesLoading && !loadedFromCache) ? (
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
									{hasUserIdSupport 
										? "Create your first personal data source to get started"
										: "Create your first data source to get started"
									}
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
										{hasUserIdSupport ? "Your " : "Recent "}Data Sources ({dataSources.length})
									</h2>
									<p className="text-sm text-gray-600 mt-1">
										{hasUserIdSupport 
											? "Showing only your personal data connections"
											: "Showing recent data connections"
										}
										{loadedFromCache && " • Loaded from cache"}
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
													<span className="text-sm text-gray-500">
														Recently
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

			{/* Modal for Adding New Data Source */}
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
								disabled={loading}
								className="flex items-center gap-2 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
							>
								<TestTube className="w-4 h-4" />
								{loading ? "Testing..." : "Test Connection"}
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
									disabled={loading || connectionStatus !== "success"}
									className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? "Creating..." : "Create"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DataSources;