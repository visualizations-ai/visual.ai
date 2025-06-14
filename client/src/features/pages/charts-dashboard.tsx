import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "../../shared/app-layout";
import { 
  BarChart3, 
  Play,
  Download,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks/redux-hooks";
import { useMutation, useQuery } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";
import { GENERATE_CHART_QUERY, CREATE_CHART_MUTATION } from "../../graphql/charts";
import { useToast } from "../../shared/ToastContext";

import {
  fetchCharts,
  loadFromLocalStorage,
  syncWithLocalStorage,
  deleteChart as deleteChartAction,
  clearError
} from "../../store/charts-slice";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar, Line, Pie } from 'react-chartjs-2';

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

interface ChartPoint {
  x: number;
  y: number;
}

interface ChartData {
  id: string;
  name: string;
  type: string;
  data: ChartPoint[];
  userId: string;
  projectId?: string;
  labels?: string[];
  categories?: string[];
  additionalData?: {
    [key: string]: any[];
  };
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
  createdAt: string;
}

interface NewChartForm {
  name: string;
  prompt: string;
  type: 'bar' | 'line' | 'pie' | 'number' | 'matrix';
}

const colors = [
  'rgba(15, 23, 42, 0.8)',   
  'rgba(123, 126, 244, 0.8)', 
  'rgba(30, 41, 59, 0.8)',    
  'rgba(107, 110, 228, 0.8)', 
  'rgba(51, 65, 85, 0.8)',    
  'rgba(139, 122, 255, 0.8)', 
  'rgba(71, 85, 105, 0.8)',   
  'rgba(91, 95, 200, 0.8)',   
  'rgba(100, 116, 139, 0.8)', 
  'rgba(155, 156, 255, 0.8)', 
  'rgba(148, 163, 184, 0.8)', 
  'rgba(75, 78, 220, 0.8)',  
];

const convertGraphQLToChartJS = (chart: ChartData) => {
  let labels: string[] = [];
  const data = chart.data.map(point => point.y);
  
  if (chart.labels && chart.labels.length > 0) {
    labels = chart.labels;
  } else if (chart.categories && chart.categories.length > 0) {
    labels = chart.categories;
  } else {
    labels = chart.data.map((_, index) => {
      if (chart.type === 'pie') {
        const defaultCategories = [
          'Category A', 'Category B', 'Category C', 
          'Category D', 'Category E', 'Category F', 'Category G'
        ];
        return defaultCategories[index] || `Category ${index + 1}`;
      }
      return `Point ${index + 1}`;
    });
  }
  
  return {
    labels,
    datasets: [{
      label: chart.name,
      data,
      backgroundColor: chart.type === 'pie' 
        ? colors.slice(0, data.length)
        : 'rgba(15, 23, 42, 0.8)', 
      borderColor: chart.type === 'pie'
        ? colors.slice(0, data.length).map(color => color.replace('0.8', '1'))
        : 'rgba(15, 23, 42, 1)', 
      borderWidth: 2,

      hoverBackgroundColor: chart.type === 'pie'
        ? colors.slice(0, data.length).map(color => color.replace('0.8', '0.9'))
        : 'rgba(123, 126, 244, 0.9)', 
      hoverBorderColor: chart.type === 'pie'
        ? colors.slice(0, data.length)
        : 'rgba(123, 126, 244, 1)' 
    }]
  };
};

const getChartOptions = (type: string, title: string) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'rgba(51, 65, 85, 1)', 
          font: {
            size: 12,
            weight: '500' as const
          }
        }
      },
      title: {
        display: true,
        text: title,
        color: 'rgba(30, 41, 59, 1)', 
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)', 
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(123, 126, 244, 1)',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600' as const
        },
        bodyFont: {
          size: 13
        }
      }
    },

    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const
    },
    hover: {
      animationDuration: 300
    }
  };

  if (type === 'line' || type === 'bar') {
    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.3)', 
            borderColor: 'rgba(100, 116, 139, 1)'
          },
          ticks: {
            color: 'rgba(71, 85, 105, 1)', 
            font: {
              size: 11
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.3)', 
            borderColor: 'rgba(100, 116, 139, 1)' 
          },
          ticks: {
            color: 'rgba(71, 85, 105, 1)', 
            font: {
              size: 11
            }
          }
        }
      }
    };
  }

  return baseOptions;
};

const DataSourceSelector: React.FC<{
  selectedDataSource: string | null;
  onDataSourceChange: (id: string) => void;
  dataSources: any[];
  loading: boolean;
}> = ({ selectedDataSource, onDataSourceChange, dataSources, loading }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
    <label className="block text-sm font-semibold text-slate-700 mb-3">
      Select Data Source
    </label>
    <div className="relative">
      <select
        value={selectedDataSource || ""}
        onChange={(e) => onDataSourceChange(e.target.value)}
        className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none shadow-sm"
        disabled={loading}
      >
        <option value="">Choose your data source...</option>
        {dataSources.map((ds) => (
          <option key={ds.id} value={ds.id}>
             {ds.projectId} ({ds.database})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const ChartsDashboard: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [generatingChart, setGeneratingChart] = useState(false);
  const [newChart, setNewChart] = useState<NewChartForm>({
    name: '',
    prompt: '',
    type: 'bar'
  });

  const { user } = useAppSelector(state => state.auth);
  const { charts, loading: loadingCharts, error: chartsError } = useAppSelector(state => state.charts);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { success, error: showError, warning, info } = useToast();

  const { data: dataSourcesData, loading: loadingDataSources } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });

  const dataSources = useMemo(() => dataSourcesData?.getDataSources?.dataSource || [], [dataSourcesData]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    console.log(' Charts Dashboard: Loading charts for user:', user.id);

    dispatch(clearError());

    dispatch(loadFromLocalStorage({ userId: user.id }));

    const fetchFromServer = async () => {
      try {
        console.log(' Fetching charts from server...');
        await dispatch(fetchCharts()).unwrap();
        console.log(' Charts loaded successfully');
      } catch (error) {
        console.error(' Failed to fetch charts:', error);
      }
    };
    
    fetchFromServer();
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (dataSources.length > 0 && !selectedDataSource) {
      setSelectedDataSource(dataSources[0].id);
    }
  }, [dataSources, selectedDataSource]);

  const renderChart = (chart: ChartData) => {
    try {
      if (chart.type === 'number') {
        const value = chart.data[0]?.y || 0;
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl font-bold text-indigo-600 mb-4">
              {value.toLocaleString()}
            </div>
            <div className="text-lg text-gray-600 text-center">
              {chart.name}
            </div>
          </div>
        );
      }
      
      if (chart.type === 'matrix' && chart.matrixData) {
        const { matrix, rowLabels, columnLabels, title } = chart.matrixData;
        
        return (
          <div className="h-full p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <div className="overflow-auto h-full">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100"></th>
                    {columnLabels?.map((label: string, index: number) => (
                      <th key={index} className="border p-2 bg-gray-100 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix?.map((row: (number | string)[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      <td className="border p-2 bg-gray-50 font-medium">
                        {rowLabels?.[rowIndex] || `Row ${rowIndex + 1}`}
                      </td>
                      {row.map((cell: number | string, cellIndex: number) => (
                        <td key={cellIndex} className="border p-2 text-center">
                          {typeof cell === 'number' ? cell.toLocaleString() : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      
      const chartJSData = convertGraphQLToChartJS(chart);
      const options = getChartOptions(chart.type, chart.name);
      
      switch (chart.type) {
        case 'bar':
          return <Bar data={chartJSData} options={options} />;
        case 'line':
          return <Line data={chartJSData} options={options} />;
        case 'pie':
          return <Pie data={chartJSData} options={options} />;
        default:
          return <Bar data={chartJSData} options={options} />;
      }
    } catch (error) {
      console.error("Error rendering chart:", error);
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Error rendering chart</p>
          </div>
        </div>
      );
    }
  };

  const [generateChartMutation] = useMutation(GENERATE_CHART_QUERY);
  const [createChartMutation] = useMutation(CREATE_CHART_MUTATION);

  const handleGenerateChart = async () => {
    if (!newChart.name.trim() || !newChart.prompt.trim() || !selectedDataSource) {
      warning("Please fill in all fields and select a data source");
      return;
    }

    try {
      console.log("Starting chart generation...");
      setGeneratingChart(true);
      setIsCreateModalOpen(false);
      info(`Creating chart "${newChart.name}"...`);
      
      const selectedDS = dataSources.find(ds => ds.id === selectedDataSource);
      if (!selectedDS) {
        throw new Error("Selected data source not found");
      }

      console.log("Calling AI service...");
      const { data } = await generateChartMutation({
        variables: {
          info: {
            projectId: selectedDS.projectId,
            userPrompt: newChart.prompt,
            chartType: newChart.type
          }
        }
      });

      if (!data?.generateChart) {
        throw new Error('No chart data received from AI');
      }

      const result = JSON.parse(data.generateChart);
      console.log(' AI result processed');
      
      let chartData: ChartPoint[] = [];
      let matrixData;
      let labels: string[] = [];

      if (result.promptResult && result.promptResult.input) {
        const aiChart = result.promptResult.input;
        
        if (aiChart.chartType === 'number' || aiChart.chartType === 'NUMBER') {
          if (aiChart.chart && aiChart.chart.value !== undefined) {
            chartData = [{ x: 0, y: aiChart.chart.value }];
            labels = [newChart.name];
          }
        } 
        else if (aiChart.chartType === 'matrix' || aiChart.chartType === 'MATRIX') {
          if (aiChart.chart && aiChart.chart.matrix) {
            chartData = [];
            matrixData = {
              title: aiChart.chart.title || newChart.name,
              matrix: aiChart.chart.matrix,
              rowLabels: aiChart.chart.rowLabels || [],
              columnLabels: aiChart.chart.columnLabels || []
            };
          }
        } 
        else if (['bar', 'line', 'pie', 'BAR', 'LINE', 'PIE', 'bar chart', 'line chart', 'pie chart'].includes(aiChart.chartType)) {
          if (aiChart.chart && aiChart.chart.data && Array.isArray(aiChart.chart.data)) {
            if (aiChart.chart.xAxis) {
              labels = aiChart.chart.data.map((item: any) => {
                const labelValue = item[aiChart.chart.xAxis];
                return String(labelValue || `Item ${aiChart.chart.data.indexOf(item) + 1}`);
              });
            } else {
              const sampleItem = aiChart.chart.data[0];
              const keys = Object.keys(sampleItem);
              
              const labelKey = keys.find(key => 
                key.toLowerCase().includes('name') ||
                key.toLowerCase().includes('category') ||
                key.toLowerCase().includes('type') ||
                key.toLowerCase().includes('label') ||
                typeof sampleItem[key] === 'string'
              );
              
              if (labelKey) {
                labels = aiChart.chart.data.map((item: any) => String(item[labelKey]));
              } else {
                labels = aiChart.chart.data.map((_: any, index: number) => `Item ${index + 1}`);
              }
            }
            
            chartData = aiChart.chart.data.map((item: any, index: number) => {
              let yVal = 0;
              
              if (typeof item === 'object' && item !== null) {
                if (aiChart.chart.yAxis && item[aiChart.chart.yAxis] !== undefined) {
                  yVal = Number(item[aiChart.chart.yAxis]) || 0;
                } else {
                  const values = Object.values(item).filter(v => typeof v === 'number');
                  yVal = values[0] as number || 0;
                }
              } else if (typeof item === 'number') {
                yVal = item;
              }
              
              return { x: index, y: yVal };
            });
          }
        }
      }

      if (chartData.length === 0 && !matrixData) {
        console.log('⚠️ No data found, creating example data');
        if (newChart.type === 'number') {
          chartData = [{ x: 0, y: 100 }]; 
          labels = [newChart.name];
        } else {
          chartData = [
            { x: 0, y: 65 },
            { x: 1, y: 35 }
          ];
          if (newChart.type === 'pie') {
            labels = ['Primary Category', 'Secondary Category'];
          } else {
            labels = ['Category A', 'Category B'];
          }
        }
      }

      const serverChartData = {
        name: newChart.name,
        type: newChart.type,
        data: chartData,
        userId: user?.id || "1",
        projectId: selectedDS.projectId,
        labels: labels.length > 0 ? labels : undefined,
        categories: labels.length > 0 ? labels : undefined
      };

      console.log(' Saving chart to server...');

      const serverResponse = await createChartMutation({
        variables: { input: serverChartData }
      });
      
      if (!serverResponse.data?.createChart) {
        throw new Error('No chart data returned from server');
      }
      
      console.log(' Chart saved successfully!');
      
      await dispatch(fetchCharts()).unwrap();
      
      if (user?.id) {
        dispatch(syncWithLocalStorage({ userId: user.id }));
      }
      
      setGeneratingChart(false);
      setNewChart({ name: '', prompt: '', type: 'bar' });
      
      success(`Chart "${newChart.name}" created successfully!`);

    } catch (error: any) {
      console.error(" Chart creation failed:", error);
      setGeneratingChart(false);
      setNewChart({ name: '', prompt: '', type: 'bar' });
      showError(`Failed to create chart "${newChart.name}": ${error.message}`);
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!confirm("Are you sure you want to delete this chart?")) return;

    try {
      console.log(" Deleting chart:", chartId.slice(0, 8));
      
      await dispatch(deleteChartAction(chartId)).unwrap();
      
      await dispatch(fetchCharts()).unwrap();

      console.log(" Chart deleted successfully");
      success("Chart deleted successfully!");
      
    } catch (error: any) {
      console.error(" Failed to delete chart:", error);
      showError(`Failed to delete chart: ${error.message}`);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewChart({ name: '', prompt: '', type: 'bar' });
    setGeneratingChart(false);
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

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="p-2 lg:px-6 lg:py-3 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
      >
        <Sparkles size={16} className="lg:w-5 lg:h-5" />
        <span className="hidden lg:inline">Create with AI</span>
      </button>
    </div>
  );

  if (loadingCharts) {
    return (
      <AppLayout
        title="Charts Dashboard"
        subtitle="Create beautiful charts with AI"
        headerActions={headerActions}
      >
        <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading charts...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Charts Dashboard"
      subtitle="Create beautiful charts with AI"
      headerActions={headerActions}
    >
      <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
          <DataSourceSelector
            selectedDataSource={selectedDataSource}
            onDataSourceChange={setSelectedDataSource}
            dataSources={dataSources}
            loading={loadingDataSources}
          />

          {chartsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error loading charts</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{chartsError}</p>
            </div>
          )}

          {charts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">No charts yet</h3>
              <p className="text-slate-500 mb-8">Create your first chart using AI prompts!</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-8 py-3 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all"
              >
                Create Your First Chart
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {charts.map((chart) => (
                <div key={chart.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all group">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{chart.name}</h3>
                        <p className="text-sm text-slate-500">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs capitalize">
                            {chart.type}
                          </span>
                          {chart.labels && chart.labels.length > 0 && (
                            <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                              {chart.labels.length} labels
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => exportChart(chart)}
                          className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
                          title="Export chart"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChart(chart.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
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
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-slate-900/50 flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/50">
            <div className="p-6 border-b border-slate-200/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Create New Chart
                  </h2>
                  <p className="text-slate-600 mt-1">Enter your chart details</p>
                </div>
                <button
                  onClick={handleCancelCreate}
                  className="p-2 hover:bg-slate-100/80 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chart Name
                </label>
                <input
                  type="text"
                  value={newChart.name}
                  onChange={(e) => setNewChart({ ...newChart, name: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter chart name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chart Type
                </label>
                <div className="flex flex-col space-y-2"> 
                  {[
                    { value: 'number', label: 'Number Display' },
                    { value: 'bar', label: 'Bar Chart' },
                    { value: 'line', label: 'Line Chart' },
                    { value: 'pie', label: 'Pie Chart' },
                    { value: 'matrix', label: 'Matrix/Table' }
                  ].map((type) => (
                    <label 
                      key={type.value} 
                      className={`
                        cursor-pointer relative p-4 border-2 rounded-xl transition-all
                        flex items-center gap-3
                        ${newChart.type === type.value 
                          ? 'border-[#7B7EF4] bg-[#7B7EF4]/5' 
                          : 'border-slate-200 hover:border-[#7B7EF4]/50 bg-white'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="chartType"
                        value={type.value}
                        checked={newChart.type === type.value}
                        onChange={(e) => setNewChart({ ...newChart, type: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-2 h-2 rounded-full ${
                          newChart.type === type.value 
                            ? 'bg-[#7B7EF4]' 
                            : 'bg-slate-300'
                        }`} />
                        <span className={`text-sm font-medium ${
                          newChart.type === type.value 
                            ? 'text-[#7B7EF4]' 
                            : 'text-slate-600'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newChart.prompt}
                  onChange={(e) => setNewChart({ ...newChart, prompt: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Describe what you want to visualize..."
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <button
                onClick={handleCancelCreate}
                className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateChart}
                disabled={!newChart.name || !newChart.prompt || !selectedDataSource}
                className="flex-1 px-6 py-3 bg-[#7B7EF4] hover:bg-[#6B6EE4] text-white rounded-lg transition-colors shadow-lg shadow-[#7B7EF4]/20 disabled:opacity-50"
              >
                {generatingChart ? 'Generating...' : 'Generate Chart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ChartsDashboard;