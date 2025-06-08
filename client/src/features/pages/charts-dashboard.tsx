import React, { useState, useEffect } from "react";
import { Sidebar } from "../../shared/sidebar";
import { 
  BarChart3, 
  Plus, 
  Play,
  Download,
  Trash2,
  Menu,
  LogOut,
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { logoutUser } from "../../store/auth-slice";
import { useQuery, useMutation, gql } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// GraphQL operations - inline to avoid import issues
const GENERATE_CHART_QUERY = gql`
  query GenerateChart($info: AiChartQuery!) {
    generateChart(info: $info)
  }
`;

const GET_CHARTS_QUERY = gql`
  query GetCharts {
    getCharts {
      id
      name
      type
      data {
        x
        y
      }
      projectId
      createdAt
    }
  }
`;

const CREATE_CHART_MUTATION = gql`
  mutation CreateChart($input: CreateChartInput!) {
    createChart(input: $input) {
      id
      name
      type
      data {
        x
        y
      }
      projectId
      createdAt
    }
  }
`;

const DELETE_CHART_MUTATION = gql`
  mutation DeleteChart($id: String!) {
    deleteChart(id: $id) {
      message
    }
  }
`;

// Types - inline to avoid import issues
interface ChartPoint {
  x: number;
  y: number;
}

interface ChartData {
  id: string;
  name: string;
  type: string;
  data: ChartPoint[];
  projectId: string;
  createdAt: string;
}

interface NewChartForm {
  name: string;
  prompt: string;
  type: 'bar' | 'line' | 'pie';
}

// DataSourceSelector component - inline to avoid import issues
const DataSourceSelector = ({ selectedDataSource, onDataSourceChange, dataSources, loading }: any) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
    <label className="block text-sm font-medium text-slate-700 mb-2">
      Select Data Source
    </label>
    <div className="relative">
      <select
        value={selectedDataSource}
        onChange={(e) => onDataSourceChange(e.target.value)}
        className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
        disabled={loading}
      >
        <option value="">Select a data source...</option>
        {dataSources.map((ds: any) => (
          <option key={ds.id} value={ds.id}>
            {ds.projectId} ({ds.database})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// Utility functions - inline to avoid import issues
const convertAIToChartJS = (chartConfig: any, chartType: string) => {
  const { chart } = chartConfig;
  
  switch (chartType) {
    case 'bar':
    case 'line':
      const labels = chart.data?.map((item: any) => 
        item[chart.xAxis] || `Item ${chart.data.indexOf(item) + 1}`
      ) || [];
      const values = chart.data?.map((item: any) => 
        item[chart.yAxis] || 0
      ) || [];
      
      return {
        labels,
        datasets: [{
          label: chart.yAxis || 'Value',
          data: values,
          backgroundColor: chartType === 'bar' ? 'rgba(99, 102, 241, 0.6)' : undefined,
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          fill: chartType === 'line' ? false : undefined
        }]
      };
    
    case 'pie':
      const pieLabels = chart.data?.map((item: any) => 
        item.segment || item[chart.xAxis] || `Segment ${chart.data.indexOf(item) + 1}`
      ) || [];
      const pieValues = chart.data?.map((item: any) => 
        item.value || item[chart.yAxis] || 0
      ) || [];
      
      return {
        labels: pieLabels,
        datasets: [{
          data: pieValues,
          backgroundColor: chart.data?.map((item: any, index: number) => 
            item.color || `hsl(${(index * 360 / chart.data.length)}, 70%, 60%)`
          ) || []
        }]
      };
    
    default:
      return { labels: [], datasets: [] };
  }
};

const convertChartJSToGraphQL = (chartJSData: any, chartType: string): ChartPoint[] => {
  const points: ChartPoint[] = [];
  chartJSData.datasets[0].data.forEach((value: number, index: number) => {
    points.push({ x: index, y: value });
  });
  return points;
};

const convertGraphQLToChartJS = (chart: ChartData) => {
  const labels = chart.data.map((_, index) => `Item ${index + 1}`);
  const data = chart.data.map(point => point.y);
  
  const baseConfig = {
    labels,
    datasets: [{
      label: chart.name,
      data
    }]
  };
  
  switch (chart.type) {
    case 'bar':
      return {
        ...baseConfig,
        datasets: [{
          ...baseConfig.datasets[0],
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2
        }]
      };
    
    case 'line':
      return {
        ...baseConfig,
        datasets: [{
          ...baseConfig.datasets[0],
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: false
        }]
      };
    
    case 'pie':
      return {
        ...baseConfig,
        datasets: [{
          data,
          backgroundColor: labels.map((_, index) => 
            `hsl(${(index * 360 / labels.length)}, 70%, 60%)`
          )
        }]
      };
    
    default:
      return baseConfig;
  }
};

const exportChart = (chart: ChartData) => {
  const dataStr = JSON.stringify(chart, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${chart.name.replace(/\s+/g, '_')}_chart.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ChartsDashboard = () => {
  const [selectedDataSource, setSelectedDataSource] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [newChart, setNewChart] = useState<NewChartForm>({
    name: '',
    prompt: '',
    type: 'bar'
  });

  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // GraphQL operations
  const { data: dataSourcesData, loading: loadingDataSources, error: dataSourceError } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });

  const { data: chartsData, loading: loadingCharts, error: chartsError } = useQuery(GET_CHARTS_QUERY, {
    errorPolicy: 'all',
  });

  const [generateChart, { loading: generatingChart }] = useMutation(GENERATE_CHART_QUERY);
  const [createChart] = useMutation(CREATE_CHART_MUTATION);
  const [deleteChart] = useMutation(DELETE_CHART_MUTATION);

  const dataSources = dataSourcesData?.getDataSources?.dataSource || [];
  const charts: ChartData[] = chartsData?.getCharts || [];

  useEffect(() => {
    if (dataSources.length > 0 && !selectedDataSource) {
      setSelectedDataSource(dataSources[0].id);
    }
  }, [dataSources, selectedDataSource]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  const handleGenerateChart = async () => {
    if (!newChart.name || !newChart.prompt || !selectedDataSource) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const selectedDS = dataSources.find((ds: any) => ds.id === selectedDataSource);
      if (!selectedDS) {
        alert("Please select a valid data source");
        return;
      }

      console.log("🤖 Generating chart with AI...");
      console.log("Prompt:", newChart.prompt);
      console.log("Chart Type:", newChart.type);
      console.log("Project ID:", selectedDS.projectId);

      // Generate chart using AI
      const result = await generateChart({
        variables: {
          info: {
            projectId: selectedDS.projectId,
            userPrompt: newChart.prompt,
            chartType: newChart.type === 'bar' ? 'bar chart' : 
                      newChart.type === 'line' ? 'line chart' : 'pie chart'
          }
        }
      });

      const chartResult = JSON.parse(result.data.generateChart);
      console.log("🎯 AI Response:", chartResult);

      const { promptResult } = chartResult;

      if (promptResult?.input) {
        // Convert AI result to Chart.js format
        const chartJSData = convertAIToChartJS(promptResult.input, newChart.type);
        console.log("📊 Chart.js Data:", chartJSData);
        
        // Convert to GraphQL format
        const graphQLData = convertChartJSToGraphQL(chartJSData, newChart.type);
        console.log("💾 GraphQL Data:", graphQLData);

        // Create chart
        await createChart({
          variables: {
            input: {
              name: newChart.name,
              type: newChart.type,
              data: graphQLData,
              projectId: selectedDS.projectId
            }
          },
          refetchQueries: [{ query: GET_CHARTS_QUERY }]
        });

        setIsCreateModalOpen(false);
        setNewChart({ name: '', prompt: '', type: 'bar' });
        alert("✅ Chart created successfully from your prompt!");
      } else {
        console.error("❌ No chart data returned from AI");
        alert("Failed to generate chart data from AI. Please try a different prompt.");
      }
    } catch (error: any) {
      console.error("❌ Failed to generate chart:", error);
      alert(`Failed to generate chart: ${error.message}`);
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!confirm("Are you sure you want to delete this chart?")) return;

    try {
      await deleteChart({
        variables: { id: chartId },
        refetchQueries: [{ query: GET_CHARTS_QUERY }]
      });
      alert("Chart deleted successfully!");
    } catch (error: any) {
      alert(`Failed to delete chart: ${error.message}`);
    }
  };

  const renderChart = (chart: ChartData) => {
    try {
      const chartJSData = convertGraphQLToChartJS(chart);
      
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: chart.name,
          },
        },
      };

      switch (chart.type) {
        case 'bar':
          return <Bar data={chartJSData} options={commonOptions} />;
        case 'line':
          return <Line data={chartJSData} options={commonOptions} />;
        case 'pie':
          return <Pie data={chartJSData} options={commonOptions} />;
        default:
          return <div className="text-red-500">Unknown chart type: {chart.type}</div>;
      }
    } catch (error) {
      console.error("Error rendering chart:", error);
      return <div className="text-red-500">Error rendering chart</div>;
    }
  };

  // If there are errors, show them
  if (dataSourceError || chartsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-red-500 mr-3" size={24} />
            <h2 className="text-lg font-semibold text-red-700">Error Loading Page</h2>
          </div>
          {dataSourceError && (
            <p className="text-sm text-red-600 mb-2">Data sources: {dataSourceError.message}</p>
          )}
          {chartsError && (
            <p className="text-sm text-red-600 mb-4">Charts: {chartsError.message}</p>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
            <Sidebar forceOpen={true} onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-b from-indigo-50/90 to-slate-50/90 border-b border-slate-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} className="text-slate-700" />
              </button>
              
              <BarChart3 className="text-slate-700 flex-shrink-0" size={24} />
              
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-slate-800 truncate">
                  Charts Dashboard
                </h1>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between p-4 bg-gradient-to-b from-indigo-50/90 to-slate-50/90 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-slate-700" size={28} />
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Charts Dashboard</h1>
              <p className="text-sm text-slate-600">🤖 Create charts from AI prompts using Chart.js</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
          >
            <Plus size={20} />
            Create Chart
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Data Source Selector */}
          <div className="mb-6">
            <DataSourceSelector
              selectedDataSource={selectedDataSource}
              onDataSourceChange={setSelectedDataSource}
              dataSources={dataSources}
              loading={loadingDataSources}
            />
          </div>

          {/* Mobile Create Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
            >
              <Plus size={20} />
              🤖 Create Chart with AI
            </button>
          </div>

          {/* Charts Grid */}
          {loadingCharts ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading charts...</p>
            </div>
          ) : charts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <BarChart3 className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                No charts yet
              </h3>
              <p className="text-slate-500 mb-6">
                🤖 Create your first chart using AI prompts! <br />
                Just describe what you want to see and we'll query your data.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
              >
                Create Your First Chart
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {charts.map((chart: ChartData) => (
                <div key={chart.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-800">{chart.name}</h3>
                        <p className="text-sm text-slate-500">
                          {new Date(chart.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => exportChart(chart)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="Export chart"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChart(chart.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete chart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4" style={{ height: '300px' }}>
                    {renderChart(chart)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Chart Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-2">
                  🤖 Create Chart with AI
                </h2>
                <p className="text-slate-400 text-sm">
                  Describe what you want to visualize and AI will create it from your data
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Chart Name *
                  </label>
                  <input
                    type="text"
                    value={newChart.name}
                    onChange={(e) => setNewChart({ ...newChart, name: e.target.value })}
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Monthly Sales Report"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Chart Type *
                  </label>
                  <select
                    value={newChart.type}
                    onChange={(e) => setNewChart({ ...newChart, type: e.target.value as 'bar' | 'line' | 'pie' })}
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="bar">📊 Bar Chart</option>
                    <option value="line">📈 Line Chart</option>
                    <option value="pie">🥧 Pie Chart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What do you want to see? *
                  </label>
                  <textarea
                    value={newChart.prompt}
                    onChange={(e) => setNewChart({ ...newChart, prompt: e.target.value })}
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Examples:
• Show sales by month for the last year
• Display top 10 customers by revenue  
• Compare product categories by quantity
• Show user registrations over time"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    💡 Be specific! The AI will query your database based on this description.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateChart}
                  disabled={generatingChart || !newChart.name || !newChart.prompt || !selectedDataSource}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingChart ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      AI is working...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      🤖 Generate Chart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsDashboard;