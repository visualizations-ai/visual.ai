import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "../../shared/app-layout";
import { 
  BarChart3, 
  Play,
  Download,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/redux-hooks";
import { useMutation, useQuery } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";
import {  GENERATE_CHART_QUERY,
  GET_CHARTS_QUERY,
  GET_CHART_QUERY,
  CREATE_CHART_MUTATION,
  UPDATE_CHART_MUTATION,
  DELETE_CHART_MUTATION} from "../../graphql/charts";

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

import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

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
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
  createdAt: string;
}

interface CreateChartInput {
  name: string;
  type: string;
  data: ChartPoint[];
  userId: string;
  projectId: string;
}

interface NewChartForm {
  name: string;
  prompt: string;
  type: 'bar' | 'line' | 'pie' | 'number' | 'matrix';
}

const colors = [
  'rgba(99, 102, 241, 0.8)',  
  'rgba(236, 72, 153, 0.8)',   
  'rgba(34, 197, 94, 0.8)',    
  'rgba(251, 146, 60, 0.8)',   
  'rgba(168, 85, 247, 0.8)',   
  'rgba(14, 165, 233, 0.8)',   
  'rgba(239, 68, 68, 0.8)',    
  'rgba(245, 158, 11, 0.8)',   
];

const convertGraphQLToChartJS = (chart: ChartData) => {
  const labels = chart.data.map((_, index) => `Point ${index + 1}`);
  const data = chart.data.map(point => point.y);
  
  return {
    labels,
    datasets: [{
      label: chart.name,
      data,
      backgroundColor: colors.slice(0, data.length),
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2
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
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    }
  };

  if (type === 'line' || type === 'bar') {
    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
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
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [generatingChart, setGeneratingChart] = useState(false);
  const [newChart, setNewChart] = useState<NewChartForm>({
    name: '',
    prompt: '',
    type: 'bar'
  });

  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  const { data: dataSourcesData, loading: loadingDataSources } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });

  const dataSources = useMemo(() => dataSourcesData?.getDataSources?.dataSource || [], [dataSourcesData]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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
        case 'doughnut':
          return <Doughnut data={chartJSData} options={options} />;
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
      alert("Please fill in all fields and select a data source");
      return;
    }

    try {
      console.log(" Generating chart with AI...");
      setGeneratingChart(true);
      
      const selectedDS = dataSources.find(ds => ds.id === selectedDataSource);
      if (!selectedDS) {
        throw new Error("Selected data source not found");
      }

      const { data } = await generateChartMutation({
        variables: {
          info: {
            projectId: selectedDS.projectId,
            userPrompt: newChart.prompt,
            chartType: newChart.type
          }
        }
      });

      console.log(" Raw mutation response:", data);

      if (data?.generateChart) {
        try {
          const result = JSON.parse(data.generateChart);
          console.log(' Parsed result:', result);
          
          let chartData: ChartPoint[] = [];
          let matrixData;

          if (result.promptResult && result.promptResult.input) {
            const aiChart = result.promptResult.input;
            console.log(' AI Chart Config:', aiChart);
            console.log(' AI Chart Type:', aiChart.chartType);
            console.log(' AI Chart Object:', aiChart.chart);
            console.log(' AI Chart Data:', aiChart.chart?.data);
            console.log(' AI Chart Value:', aiChart.chart?.value);
            console.log(' AI Chart Matrix:', aiChart.chart?.matrix);
            
            if (aiChart.chartType === 'number' || aiChart.chartType === 'NUMBER') {
              console.log(' Processing NUMBER chart');
              if (aiChart.chart && aiChart.chart.value !== undefined) {
                chartData = [{ x: 0, y: aiChart.chart.value }];
                console.log(' Number data created:', chartData);
              } else {
                console.log(' No value found in chart.value');
              }
            } 
            else if (aiChart.chartType === 'matrix' || aiChart.chartType === 'MATRIX') {
              console.log(' Processing MATRIX chart');
              if (aiChart.chart && aiChart.chart.matrix) {
                chartData = [];
                matrixData = {
                  title: aiChart.chart.title || newChart.name,
                  matrix: aiChart.chart.matrix,
                  rowLabels: aiChart.chart.rowLabels || [],
                  columnLabels: aiChart.chart.columnLabels || []
                };
                console.log(' Matrix data created:', matrixData);
              } else {
                console.log(' No matrix found in chart.matrix');
              }
            } 
            else if (['bar', 'line', 'pie', 'BAR', 'LINE', 'PIE', 'bar chart', 'line chart', 'pie chart'].includes(aiChart.chartType)) {
              console.log(` Processing ${aiChart.chartType} chart`);
              
              if (aiChart.chart && aiChart.chart.data && Array.isArray(aiChart.chart.data)) {
                console.log('Found chart data array:', aiChart.chart.data);
                console.log('xAxis field:', aiChart.chart.xAxis);
                console.log(' yAxis field:', aiChart.chart.yAxis);
                
                chartData = aiChart.chart.data.map((item: any, index: number) => {
                  console.log(` Processing item ${index}:`, item);
                  
                  let yVal = 0;
                  
                  if (typeof item === 'object' && item !== null) {
                    if (aiChart.chart.yAxis && item[aiChart.chart.yAxis] !== undefined) {
                      yVal = Number(item[aiChart.chart.yAxis]) || 0;
                      console.log(` Using yAxis "${aiChart.chart.yAxis}": ${yVal}`);
                    } else {
                      const values = Object.values(item);
                      yVal = values.find(v => typeof v === 'number') as number || 0;
                      console.log(`Using first numeric value: ${yVal}`);
                    }
                  } else if (typeof item === 'number') {
                    yVal = item;
                    console.log(` Using direct number: ${yVal}`);
                  }
                  
                  return { x: index, y: yVal };
                });
                
                console.log('Chart data created from AI:', chartData);
              } else {
                console.log(' No data array found in chart.data');
              }
            } else {
              console.log(`Unknown chart type: ${aiChart.chartType}`);
            }
          } else {
            console.log(' No AI chart config found, using raw query data');
            if (result.queryResult && result.queryResult.length > 0) {
              console.log(' Using fallback with raw query data:', result.queryResult);
              
              if (newChart.type === 'number') {
                const firstRow = result.queryResult[0];
                const firstValue = Object.values(firstRow)[0] as number;
                chartData = [{ x: 0, y: firstValue || 0 }];
                console.log(' Fallback number data:', chartData);
              } else if (newChart.type === 'matrix') {
                const columns = Object.keys(result.queryResult[0]);
                const matrix = result.queryResult.map((row: any) => Object.values(row));
                chartData = [];
                matrixData = {
                  title: newChart.name,
                  matrix: matrix,
                  rowLabels: result.queryResult.map((_: any, index: number) => `Row ${index + 1}`),
                  columnLabels: columns
                };
                console.log(' Fallback matrix data:', matrixData);
              } else {
                chartData = result.queryResult.map((row: any, index: number) => {
                  const values = Object.values(row);
                  const yValue = values.find(v => typeof v === 'number') as number || 0;
                  return { x: index, y: yValue };
                });
                console.log('Fallback chart data:', chartData);
              }
            } else {
              chartData = [{ x: 0, y: 0 }];
              console.log(' Using empty fallback data');
            }
          }

          console.log(' Final chart data:', chartData);
          console.log(' Final matrix data:', matrixData);

          if (chartData.length === 0 && !matrixData) {
            console.log(' No chart data created, creating fallback');
            if (newChart.type === 'number') {
              chartData = [{ x: 0, y: 100 }]; 
            } else {
              chartData = [
                { x: 0, y: 10 },
                { x: 1, y: 20 },
                { x: 2, y: 15 }
              ]; 
            }
            console.log(' Fallback data created:', chartData);
          }

          const createChartInput: CreateChartInput = {
            name: newChart.name,
            type: newChart.type,
            data: chartData,
            userId: user?.id || "1",
            projectId: selectedDS.projectId
          };

          const createResponse = await createChartMutation({
            variables: { input: createChartInput }
          });

          const newAIChart: ChartData = {
            id: createResponse.data?.createChart?.id || String(Date.now()),
            name: newChart.name,
            type: newChart.type,
            userId: user?.id || "1",
            projectId: selectedDS.projectId,
            data: chartData,
            matrixData: matrixData,
            createdAt: new Date().toISOString()
          };

          setCharts(prev => [...prev, newAIChart]);
          setGeneratingChart(false);
          setIsCreateModalOpen(false);
          setNewChart({ name: '', prompt: '', type: 'bar' });
          
          alert("Chart created successfully!");
          
        } catch (parseError) {
          console.error(' Parse error:', parseError);
          throw new Error('Failed to parse AI response');
        }
      } else {
        throw new Error('No chart data received');
      }

    } catch (error: any) {
      console.error(" Error:", error);
      setGeneratingChart(false);
      alert(`Failed to generate chart: ${error.message}`);
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!confirm("Are you sure you want to delete this chart?")) return;

    try {
      setCharts(prev => prev.filter(chart => chart.id !== chartId));
      alert("Chart deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete chart:", error);
      alert(`Failed to delete chart: ${error.message}`);
    }
  };

  const handleSamplePrompt = (prompt: any) => {
    setNewChart({
      ...newChart,
      prompt: prompt.prompt,
      type: prompt.type,
      name: prompt.prompt.split(' ').slice(0, 4).join(' ')
    });
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

  const samplePrompts = [
    {
      type: 'number' as const,
      prompt: "Show total sales amount for this quarter",
      icon: "🔢"
    },
    {
      type: 'bar' as const,
      prompt: "Show me the top 10 customers by total purchase amount",
      icon: "📊"
    },
    {
      type: 'line' as const,
      prompt: "Display sales trends over the last 12 months",
      icon: "📈"
    },
    {
      type: 'pie' as const,
      prompt: "Break down revenue by product category",
      icon: "🥧"
    },
    {
      type: 'matrix' as const,
      prompt: "Create sales performance matrix by region and month",
      icon: "🗂️"
    }
  ];

  const headerActions = (
    <button
      onClick={() => setIsCreateModalOpen(true)}
      className="p-2 lg:px-6 lg:py-3 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
    >
      <Sparkles size={16} className="lg:w-5 lg:h-5" />
      <span className="hidden lg:inline">Create with AI</span>
    </button>
  );

  return (
    <AppLayout
      title="Charts Dashboard"
      subtitle="Create beautiful charts with AI"
      icon={<BarChart3 className="text-white lg:text-white text-slate-700 lg:w-8 lg:h-8" size={24} />}
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
                          Chart #{charts.indexOf(chart) + 1}
                          <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs capitalize">
                            {chart.type}
                          </span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={24} />
                Create Chart with AI
              </h2>
              <p className="text-slate-600 mt-1">Describe what you want to visualize</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chart Name *
                </label>
                <input
                  type="text"
                  value={newChart.name}
                  onChange={(e) => setNewChart({ ...newChart, name: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Monthly Sales Report"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chart Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'number', label: ' Number Display' },
                    { value: 'bar', label: 'Bar Chart' },
                    { value: 'line', label: 'Line Chart' },
                    { value: 'pie', label: ' Pie Chart' },
                    { value: 'doughnut', label: ' Doughnut Chart' },
                    { value: 'matrix', label: ' Matrix/Table' }
                  ].map((type) => (
                    <label key={type.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="chartType"
                        value={type.value}
                        checked={newChart.type === type.value}
                        onChange={(e) => setNewChart({ ...newChart, type: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg text-center transition-all ${
                        newChart.type === type.value 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}>
                        {type.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What do you want to see? *
                </label>
                <textarea
                  value={newChart.prompt}
                  onChange={(e) => setNewChart({ ...newChart, prompt: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Describe your visualization..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                   Try these examples:
                </label>
                <div className="space-y-2">
                  {samplePrompts.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => handleSamplePrompt(sample)}
                      className="w-full text-left p-3 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <span className="mr-2">{sample.icon}</span>
                      <span className="text-sm">{sample.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateChart}
                disabled={generatingChart || !newChart.name || !newChart.prompt || !selectedDataSource}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingChart ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Generate Chart
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

export default ChartsDashboard;