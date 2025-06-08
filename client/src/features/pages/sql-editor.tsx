// client/src/features/pages/sql-editor.tsx
import React, { useState, useRef, useEffect } from "react";
import { 
  Database, 
  Play, 
  Square, 
  RotateCcw, 
  Type, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  History,
} from "lucide-react";
import { AppLayout } from "../../shared/app-layout";
import { useAppSelector } from "../../hooks/redux-hooks";
import { useQuery } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";
import { DataSourceSelector } from "../../components/DataSourceSelector";
import { QueryHistorySidebar } from "../../components/QueryHistorySidebar";

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

const SqlEditor = () => {
  const [query, setQuery] = useState("");
  const [selectedDataSource, setSelectedDataSource] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAppSelector(state => state.auth);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const { data: dataSourcesData, loading: loadingDataSources } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });

  const dataSources = dataSourcesData?.getDataSources?.dataSource || [];

  useEffect(() => {
    if (dataSources.length > 0 && !selectedDataSource) {
      setSelectedDataSource(dataSources[0].id);
    }
  }, [dataSources, selectedDataSource]);

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`sqlHistory_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved).map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setQueryHistory(parsed);
        } catch (error) {
          console.error("Failed to load query history:", error);
        }
      }
    }
  }, [user?.id]);

  const saveHistory = (history: QueryHistory[]) => {
    if (user?.id) {
      try {
        localStorage.setItem(`sqlHistory_${user.id}`, JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save query history:", error);
      }
    }
  };

  const executeQuery = async () => {
    if (!query.trim() || !selectedDataSource) return;

    setIsExecuting(true);
    setCurrentError(null);
    setCurrentResult(null);

    const startTime = Date.now();

    try {
      const dataSource = dataSources.find((ds: any) => ds.id === selectedDataSource);
      if (!dataSource) {
        throw new Error("Selected data source not found");
      }

      const response = await fetch('http://localhost:3000/api/v1/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query ExecutePostgreSQLQuery($data: PostGresqlExecution!) {
              executePostgreSQLQuery(data: $data) {
                documents
              }
            }
          `,
          variables: {
            data: {
              projectId: dataSource.projectId,
              sqlQuery: query.trim()
            }
          }
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Query execution failed");
      }

      const executionTime = Date.now() - startTime;
      const documents = JSON.parse(result.data.executePostgreSQLQuery.documents);
      
      const queryResult: QueryResult = {
        columns: documents.length > 0 ? Object.keys(documents[0]) : [],
        rows: documents.map((doc: any) => Object.values(doc)),
        rowCount: documents.length,
        executionTime
      };

      setCurrentResult(queryResult);

      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
        status: "success",
        result: queryResult,
        projectId: dataSource.projectId
      };

      const newHistory = [historyItem, ...queryHistory.slice(0, 19)];
      setQueryHistory(newHistory);
      saveHistory(newHistory);

    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      setCurrentError(errorMessage);

      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
        status: "error",
        error: errorMessage,
        projectId: dataSources.find((ds: any) => ds.id === selectedDataSource)?.projectId || ""
      };

      const newHistory = [historyItem, ...queryHistory.slice(0, 19)];
      setQueryHistory(newHistory);
      saveHistory(newHistory);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatQuery = () => {
    if (!query.trim()) return;

    const formatted = query
      .replace(/\s+/g, ' ')
      .replace(/,/g, ',\n  ')
      .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|UNION|INSERT|UPDATE|DELETE)\b/gi, '\n$1')
      .replace(/\bAND\b/gi, '\n  AND')
      .replace(/\bOR\b/gi, '\n  OR')
      .trim();
    
    setQuery(formatted);
  };

  const clearResult = () => {
    setCurrentResult(null);
    setCurrentError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        formatQuery();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query, selectedDataSource]);

  const exportToCsv = () => {
    if (!currentResult) return;

    const csvContent = [
      currentResult.columns.join(','),
      ...currentResult.rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadQueryFromHistory = (historyItem: QueryHistory) => {
    setQuery(historyItem.query);
    setCurrentResult(historyItem.result || null);
    setCurrentError(historyItem.error || null);
    
    const dataSource = dataSources.find((ds: any) => ds.projectId === historyItem.projectId);
    if (dataSource) {
      setSelectedDataSource(dataSource.id);
    }
    setShowHistory(false);
  };

  const clearHistory = () => {
    setQueryHistory([]);
    if (user?.id) {
      localStorage.removeItem(`sqlHistory_${user.id}`);
    }
  };

  const lineNumbers = query.split('\n').map((_, index) => index + 1);
  const filteredHistory = queryHistory.filter(item =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Header Actions
  const headerActions = (
    <button
      onClick={() => setShowHistory(!showHistory)}
      className="p-2 lg:px-3 lg:py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors lg:border lg:border-slate-300 flex items-center gap-2"
    >
      <History size={16} />
      <span className="hidden lg:inline">History</span>
    </button>
  );

  return (
    <AppLayout
      title="SQL Editor"
      subtitle="Write and execute SQL queries"
      icon={<Database className="text-white lg:text-white text-slate-700 lg:w-8 lg:h-8" size={24} />}
      headerActions={headerActions}
    >
      <div className="bg-gradient-to-b from-indigo-50/90 to-slate-50/90 min-h-full flex">
        <div className="flex-1 flex flex-col p-3 sm:p-6 space-y-3 sm:space-y-6 overflow-y-auto">
          <DataSourceSelector
            selectedDataSource={selectedDataSource}
            onDataSourceChange={setSelectedDataSource}
            dataSources={dataSources}
            loading={loadingDataSources}
          />

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-slate-50 gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-2 text-sm font-medium text-slate-700">SQL Editor</span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={formatQuery}
                  className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors min-h-[44px]"
                  title="Format SQL (Ctrl+Shift+F)"
                >
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">Format</span>
                </button>
                
                <button
                  onClick={() => setQuery("")}
                  className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors min-h-[44px]"
                  title="Clear editor"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                
                <button
                  onClick={executeQuery}
                  disabled={isExecuting || !query.trim() || !selectedDataSource}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded transition-colors min-h-[44px]"
                  title="Execute Query (Ctrl+Enter)"
                >
                  {isExecuting ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{isExecuting ? 'Running...' : 'Run'}</span>
                </button>
              </div>
            </div>

            <div className="flex">
              <div className="hidden sm:block select-none bg-slate-50 border-r border-slate-200 p-4 text-right text-sm text-slate-400 font-mono overflow-hidden">
                {lineNumbers.map(num => (
                  <div key={num} className="leading-6 h-6">
                    {num}
                  </div>
                ))}
              </div>

              <div className="flex-1">
                <textarea
                  ref={editorRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="-- Enter your SQL query here
-- Press Ctrl+Enter to execute
-- Press Ctrl+Shift+F to format

SELECT * FROM users LIMIT 10;"
                  className="w-full h-64 sm:h-80 p-3 sm:p-4 font-mono text-sm resize-none border-none outline-none bg-white text-slate-800 leading-6"
                  style={{ fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace" }}
                  spellCheck={false}
                  disabled={isExecuting}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 gap-2 sm:gap-0">
              <div className="flex items-center gap-4">
                <span>Lines: {lineNumbers.length}</span>
                <span>Characters: {query.length}</span>
              </div>
              <span className="hidden sm:inline">Press Ctrl+Enter to run</span>
            </div>
          </div>

          {isExecuting && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Executing query...</p>
                </div>
              </div>
            </div>
          )}

          {currentError && (
            <div className="bg-white rounded-lg border border-red-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-red-200 bg-red-50 gap-3 sm:gap-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Query Error</span>
                </div>
                <button
                  onClick={clearResult}
                  className="p-2 hover:bg-red-100 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Clear error"
                >
                  <RotateCcw className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <div className="p-4">
                <pre className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-100 overflow-x-auto whitespace-pre-wrap">
                  {currentError}
                </pre>
              </div>
            </div>
          )}

          {currentResult && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-200 bg-slate-50 gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-slate-800">Query Results</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    ({currentResult.rowCount} {currentResult.rowCount === 1 ? 'row' : 'rows'} in {currentResult.executionTime}ms)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={exportToCsv}
                    className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors min-h-[44px] flex-1 sm:flex-none justify-center"
                    title="Export to CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  
                  <button
                    onClick={clearResult}
                    className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors min-h-[44px] flex-1 sm:flex-none justify-center"
                    title="Clear results"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {currentResult.rowCount > 0 ? (
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {currentResult.columns.map((column, index) => (
                            <th
                              key={index}
                              className="text-left p-3 font-medium text-slate-700 border-b border-slate-200 whitespace-nowrap min-w-[120px]"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentResult.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="p-3 border-b border-slate-100 text-slate-700 min-w-[120px]"
                              >
                                <div className="max-w-xs truncate" title={String(cell)}>
                                  {cell === null ? (
                                    <span className="text-slate-400 italic">NULL</span>
                                  ) : cell === '' ? (
                                    <span className="text-slate-400 italic">Empty</span>
                                  ) : (
                                    String(cell)
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Query executed successfully</h3>
                  <p className="text-slate-500 text-sm">No rows returned.</p>
                </div>
              )}
            </div>
          )}

          {!currentResult && !currentError && !isExecuting && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Ready to execute</h3>
              <p className="text-slate-500 text-sm">
                Write your SQL query above and press{' '}
                <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                  <span className="hidden sm:inline">Ctrl+Enter</span>
                  <span className="sm:hidden">Run</span>
                </kbd>{' '}
                to run it.
              </p>
            </div>
          )}
        </div>
        
        <QueryHistorySidebar
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={queryHistory}
          filteredHistory={filteredHistory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onLoadQuery={loadQueryFromHistory}
          onClearHistory={clearHistory}
        />
      </div>
    </AppLayout>
  );
};

export default SqlEditor;