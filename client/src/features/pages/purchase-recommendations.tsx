import React, { useState, useEffect } from "react";
import { AppLayout } from "../../shared/app-layout";
import { 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Calendar,
  DollarSign,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Sparkles
} from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";
import { useAppSelector } from "../../hooks/redux-hooks";

interface PurchaseRecommendation {
  id: string;
  productName: string;
  category: string;
  currentStock: number;
  recommendedQuantity: number;
  priority: 'High' | 'Medium' | 'Low';
  estimatedCost: number;
  reason: string;
  daysUntilStockout: number;
  supplier: string;
  lastOrderDate: string;
  averageMonthlyUsage: number;
}

const mockRecommendations: PurchaseRecommendation[] = [
  {
    id: "1",
    productName: "Premium Coffee Beans",
    category: "Beverages",
    currentStock: 15,
    recommendedQuantity: 50,
    priority: "High",
    estimatedCost: 245.00,
    reason: "Stock running low, high demand detected",
    daysUntilStockout: 5,
    supplier: "Coffee Supreme Ltd",
    lastOrderDate: "2024-12-15",
    averageMonthlyUsage: 45
  },
  {
    id: "2",
    productName: "Office Paper A4",
    category: "Office Supplies",
    currentStock: 25,
    recommendedQuantity: 100,
    priority: "Medium",
    estimatedCost: 89.50,
    reason: "Seasonal demand increase expected",
    daysUntilStockout: 12,
    supplier: "Office Depot",
    lastOrderDate: "2024-11-28",
    averageMonthlyUsage: 30
  },
  {
    id: "3",
    productName: "Wireless Keyboards",
    category: "Electronics",
    currentStock: 8,
    recommendedQuantity: 20,
    priority: "High",
    estimatedCost: 780.00,
    reason: "Below minimum stock level",
    daysUntilStockout: 3,
    supplier: "Tech Solutions Inc",
    lastOrderDate: "2024-10-20",
    averageMonthlyUsage: 12
  },
  {
    id: "4",
    productName: "Cleaning Supplies Kit",
    category: "Maintenance",
    currentStock: 40,
    recommendedQuantity: 30,
    priority: "Low",
    estimatedCost: 156.75,
    reason: "Regular restocking cycle",
    daysUntilStockout: 28,
    supplier: "CleanCorp",
    lastOrderDate: "2024-12-01",
    averageMonthlyUsage: 18
  },
  {
    id: "5",
    productName: "LED Monitor 27\"",
    category: "Electronics",
    currentStock: 3,
    recommendedQuantity: 15,
    priority: "High",
    estimatedCost: 3450.00,
    reason: "Critical stock level, new employee onboarding",
    daysUntilStockout: 2,
    supplier: "Display Tech Co",
    lastOrderDate: "2024-09-15",
    averageMonthlyUsage: 8
  }
];

const PurchaseRecommendations = () => {
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>(mockRecommendations);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority");

  const { user } = useAppSelector(state => state.auth);

  const { data: dataSourcesData } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });

  const dataSources = dataSourcesData?.getDataSources?.dataSource || [];

  const filteredRecommendations = recommendations
    .filter(rec => filterPriority === "all" || rec.priority === filterPriority)
    .filter(rec => filterCategory === "all" || rec.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "cost":
          return b.estimatedCost - a.estimatedCost;
        case "stockout":
          return a.daysUntilStockout - b.daysUntilStockout;
        default:
          return 0;
      }
    });

  const totalEstimatedCost = filteredRecommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0);
  const highPriorityCount = recommendations.filter(rec => rec.priority === "High").length;
  const categories = [...new Set(recommendations.map(rec => rec.category))];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-red-600 bg-red-100";
      case "Medium": return "text-yellow-600 bg-yellow-100";
      case "Low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High": return <AlertTriangle size={14} />;
      case "Medium": return <BarChart3 size={14} />;
      case "Low": return <CheckCircle size={14} />;
      default: return null;
    }
  };

  const generateAIRecommendations = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("AI recommendations updated successfully!");
    }, 2000);
  };

  const exportRecommendations = () => {
    const csvContent = [
      ["Product", "Category", "Current Stock", "Recommended Qty", "Priority", "Estimated Cost", "Days Until Stockout", "Supplier"],
      ...filteredRecommendations.map(rec => [
        rec.productName,
        rec.category,
        rec.currentStock,
        rec.recommendedQuantity,
        rec.priority,
        rec.estimatedCost,
        rec.daysUntilStockout,
        rec.supplier
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "purchase_recommendations.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={generateAIRecommendations}
        disabled={loading || dataSources.length === 0}
        className="p-2 lg:px-4 lg:py-2 text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
        title="Generate AI recommendations"
      >
        {loading ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        <span className="hidden lg:inline">
          {loading ? "Generating..." : "AI Generate"}
        </span>
      </button>
      <button
        onClick={exportRecommendations}
        className="p-2 lg:px-3 lg:py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
        title="Export recommendations"
      >
        <Download size={16} />
        <span className="hidden lg:inline">Export</span>
      </button>
    </div>
  );

  return (
    <AppLayout
      title="Purchase Recommendations"
      subtitle="AI-powered inventory management insights"
      icon={<ShoppingCart className="text-white" size={24} />}
      headerActions={headerActions}
    >
      <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Recommendations</p>
                  <p className="text-2xl font-bold text-slate-900">{recommendations.length}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">High Priority Items</p>
                  <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Estimated Cost</p>
                  <p className="text-2xl font-bold text-green-600">${totalEstimatedCost.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filters:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="priority">Sort by Priority</option>
                  <option value="cost">Sort by Cost</option>
                  <option value="stockout">Sort by Urgency</option>
                </select>
              </div>
            </div>
          </div>


          {dataSources.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-yellow-800 font-medium">No Data Source Connected</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Connect to your inventory database to get real-time AI-powered purchase recommendations.
                  </p>
                  <button
                    onClick={() => window.location.href = '/data-sources'}
                    className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Connect Data Source
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">
                Purchase Recommendations ({filteredRecommendations.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Recommendation</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Urgency</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{rec.productName}</div>
                          <div className="text-sm text-slate-500">{rec.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {getPriorityIcon(rec.priority)}
                          {rec.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">Current: {rec.currentStock}</div>
                          <div className="text-slate-500">Avg/month: {rec.averageMonthlyUsage}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">Order: {rec.recommendedQuantity}</div>
                          <div className="text-slate-500">{rec.supplier}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          ${rec.estimatedCost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className={`font-medium ${rec.daysUntilStockout <= 7 ? 'text-red-600' : rec.daysUntilStockout <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {rec.daysUntilStockout} days
                          </div>
                          <div className="text-slate-500">until stockout</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          title="View details"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecommendations.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No recommendations found</h3>
                <p className="text-slate-500">Try adjusting your filters or connect a data source.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PurchaseRecommendations;