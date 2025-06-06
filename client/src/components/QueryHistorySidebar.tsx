import React from "react";
import { History, CheckCircle, AlertCircle, Trash2, Search, X } from "lucide-react";

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  status: "success" | "error";
  result?: QueryResult;
  error?: string;
  projectId: string;
}

interface QueryHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistory[];
  filteredHistory: QueryHistory[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onLoadQuery: (item: QueryHistory) => void;
  onClearHistory: () => void;
}

export const QueryHistorySidebar: React.FC<QueryHistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  filteredHistory,
  searchTerm,
  onSearchChange,
  onLoadQuery,
  onClearHistory
}) => {
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 z-50 flex flex-col shadow-xl lg:relative lg:w-96">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h3 className="font-medium text-slate-800">Query History</h3>
            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
              {history.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {history.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.length > 0 ? (
            <div className="space-y-2 p-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLoadQuery(item)}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs text-slate-500">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-slate-700 block break-all">
                    {item.query.length > 100 ? item.query.substring(0, 100) + "..." : item.query}
                  </code>
                  {item.result && (
                    <div className="text-xs text-slate-500 mt-1">
                      {item.result.rowCount} rows in {item.result.executionTime}ms
                    </div>
                  )}
                  {item.error && (
                    <div className="text-xs text-red-600 mt-1 break-all">
                      Error: {item.error.length > 50 ? item.error.substring(0, 50) + "..." : item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              {history.length === 0 ? (
                <>
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">No query history yet</p>
                  <p className="text-slate-400 text-xs mt-1">Execute queries to see them here</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">No queries found</p>
                  <p className="text-slate-400 text-xs mt-1">Try a different search term</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};