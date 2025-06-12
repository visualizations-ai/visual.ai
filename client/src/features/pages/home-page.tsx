import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../../shared/app-layout";
import { MessageSquare, Send, Loader2, Database, Settings, ChevronUp, ArrowUp, RefreshCw, Copy, Check } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";

export const HomePage = () => {
  const location = useLocation();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [showDataSourceSelector, setShowDataSourceSelector] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: dataSourcesData } = useQuery(GET_DATA_SOURCES, {
    errorPolicy: 'all',
  });
  const dataSources = dataSourcesData?.getDataSources?.dataSource || [];

  useEffect(() => {
    if (dataSources.length > 0 && !selectedDataSource) {
      setSelectedDataSource(dataSources[0].id);
    }
  }, [dataSources, selectedDataSource]);

  const clearChat = () => {
    setMessages([]);
    setInput("");
    setCopiedStates({}); 
  };

  useEffect(() => {
    if (location.state?.clearChat) {
      clearChat();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const sampleQuestions = [
    "What is the current stock level of our best-selling products",
    "Which customers haven't made a purchase in the last three months",
    "Are there any budget overruns in this month's expenses",
    "Which products should we reorder this week based on sales forecasts",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev; 
        }
        return prev + Math.random() * 10;
      });
    }, 200);
    return interval;
  };
  const copyToClipboard = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [messageIndex]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [messageIndex]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const extractSQLFromMessage = (content: string): string | null => {
    const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/);
    return sqlMatch ? sqlMatch[1].trim() : null;
  };

  const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = customInput ?? input;

    if (!finalInput.trim() || loading || !selectedDataSource) {
      if (!selectedDataSource) {
        alert("Please select a data source first");
      }
      return;
    }

    const userMessage = { role: "user", content: finalInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const progressInterval = simulateProgress();

    try {
      const selectedDS = dataSources.find(ds => ds.id === selectedDataSource);
      if (!selectedDS) {
        throw new Error("Selected data source not found");
      }

      const response = await fetch('http://localhost:3000/api/v1/graphql', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            query GetSQLQueryData($info: AiSQLQuery!) {
              getSQLQueryData(info: $info)
            }
          `,
          variables: {
            info: {
              projectId: selectedDS.projectId,
              prompt: finalInput
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setProgress(100);
      
      let answer = "";
      
      if (data.errors) {
        answer = `I apologize, but I encountered an error: ${data.errors[0]?.message || 'Unknown error'}`;
      } else if (data.data?.getSQLQueryData) {
        try {
          const result = JSON.parse(data.data.getSQLQueryData);
          
          if (result.sql) {
            answer += `**SQL Query Generated:**\n\`\`\`sql\n${result.sql}\n\`\`\`\n\n`;
          }
          
          if (result.result && result.result.length > 0) {
            answer += `**Results:** I found ${result.result.length} result${result.result.length === 1 ? '' : 's'} for your question.\n\n`;
            
            const showResults = result.result.slice(0, 3);
            showResults.forEach((row: any, index: number) => {
              answer += `${index + 1}. `;
              Object.entries(row).forEach(([key, value]) => {
                answer += `${key}: ${value}, `;
              });
              answer = answer.slice(0, -2) + "\n";
            });
            
            if (result.result.length > 3) {
              answer += `\n... and ${result.result.length - 3} more results.`;
            }
          } else {
            answer += "**Results:** I found no results for your query. The data might be empty or the query conditions might be too restrictive.";
          }
        } catch (parseError) {
          answer = "I received data but couldn't format it properly.";
        }
      } else {
        answer = "No response received from the server.";
      }
      
      const botMessage = { role: "bot", content: answer };
      setMessages((prev) => [...prev, botMessage]);
      
    } catch (err) {
      setProgress(100);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "I apologize, but I encountered an error: " + (err as Error).message },
      ]);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500); 
    }
  };

  const setAndSubmitQuestion = (question: string) => {
    if (loading || !selectedDataSource) return;
    setInput("");
    handleSubmit(undefined, question);
  };

  const headerActions = null;

  return (
    <AppLayout
      title="New Conversation"
      subtitle="Ask anything about your data"
      icon={<MessageSquare className="text-white" size={24} />}
      titleClickable={false} 
      headerActions={headerActions}
    >
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing your question...
              </h3>
              <p className="text-gray-600 mb-4">
                Please wait while we search for the best answer.
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {Math.round(progress)}% Completed
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col bg-gradient-to-b from-indigo-50/90 to-slate-50/90">
        <div className="p-6 pb-0">
          <button
            onClick={clearChat}
            className="group relative overflow-hidden px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 flex items-center gap-2.5 text-sm font-medium transform hover:scale-105 active:scale-95"
            title="Start new conversation"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <RefreshCw 
              size={16} 
              className="relative z-10 group-hover:rotate-180 transition-transform duration-500" 
            />
            <span className="relative z-10 tracking-wide">New Chat</span>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-30 blur transition-all duration-300"></div>
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="flex flex-col items-center text-slate-700 space-y-8 max-w-4xl w-full">
                  <div className="text-center space-y-2">
                    <p className="animate__animated animate__fadeInUp animate__delay-1 text-xl font-medium text-slate-700">
                      Send a message to start conversation
                    </p>
                  </div>
                  
                  {!selectedDataSource && dataSources.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-700 text-sm">
                        Please select a data source to start asking questions
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap justify-center gap-4 max-w-2xl w-full">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setAndSubmitQuestion(question)}
                        disabled={loading || !selectedDataSource}
                        className={`p-6 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50/80 hover:border-indigo-200 transition-colors text-xs text-slate-700 text-center w-full sm:w-[152px] h-[100px] flex items-center justify-center leading-tight px-3 ${
                          loading || !selectedDataSource ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="max-w-2xl mx-auto space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="animate-fade-in">
                      {msg.role === "user" ? (
                        <div className="flex justify-start">
                          <div className="bg-white text-slate-900 p-3 rounded-xl w-full text-sm break-words border border-slate-100">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <div className="text-slate-700 p-3 w-full text-sm break-words">
                            <div className="prose prose-sm max-w-none">
                              {msg.content.split(/(\*\*SQL Query Generated:\*\*\n```sql\n[\s\S]*?\n```)/g).map((part, partIndex) => {
                                const sqlMatch = part.match(/\*\*SQL Query Generated:\*\*\n```sql\n([\s\S]*?)\n```/);
                                if (sqlMatch) {
                                  const sqlQuery = sqlMatch[1];
                                  return (
                                    <div key={partIndex} className="bg-slate-100 p-3 rounded-lg mt-2 mb-2 font-mono text-xs relative group">
                                      <div className="flex items-center justify-between mb-2">
                                        <strong className="text-slate-800">SQL Query:</strong>
                                        <button
                                          onClick={() => copyToClipboard(sqlQuery, idx)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-slate-200 rounded-md flex items-center gap-1 text-xs"
                                          title="Copy SQL query"
                                        >
                                          {copiedStates[idx] ? (
                                            <>
                                              <Check className="w-3 h-3 text-green-600" />
                                              <span className="text-green-600">Copied!</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3 text-slate-600" />
                                              <span className="text-slate-600">Copy</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <code className="text-blue-600 block">{sqlQuery}</code>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div
                                      key={partIndex}
                                      dangerouslySetInnerHTML={{
                                        __html: part
                                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/\n/g, '<br/>')
                                      }}
                                    />
                                  );
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="max-w-2xl mx-auto">
                <MessageInput
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  disabled={!selectedDataSource}
                  dataSources={dataSources}
                  selectedDataSource={selectedDataSource}
                  setSelectedDataSource={setSelectedDataSource}
                  showDataSourceSelector={showDataSourceSelector}
                  setShowDataSourceSelector={setShowDataSourceSelector}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const MessageInput = ({
  input,
  setInput,
  handleSubmit,
  loading,
  disabled = false,
  dataSources,
  selectedDataSource,
  setSelectedDataSource,
  showDataSourceSelector,
  setShowDataSourceSelector,
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e?: React.FormEvent) => void;
  loading: boolean;
  disabled?: boolean;
  dataSources: any[];
  selectedDataSource: string | null;
  setSelectedDataSource: (id: string) => void;
  showDataSourceSelector: boolean;
  setShowDataSourceSelector: (show: boolean) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const minHeight = 60;
      const maxHeight = 200;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
    }
  }, [input]);

  return (
    <div className="relative" style={{ filter: 'drop-shadow(0 0 0 transparent)' }}>
      {showDataSourceSelector && dataSources.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl p-3 z-50">
          <div className="text-xs text-slate-500 mb-3">Choose your data source:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {dataSources.map((ds: any) => (
              <button
                key={ds.id}
                onClick={() => {
                  setSelectedDataSource(ds.id);
                  setShowDataSourceSelector(false);
                }}
                className={`text-left p-2 rounded-lg text-sm transition-colors border ${
                  selectedDataSource === ds.id 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                    : 'hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="font-medium">{ds.projectId}</div>
                <div className="text-xs text-slate-500">({ds.database})</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-white border border-slate-300 rounded-xl focus-within:border-indigo-500 transition-all">
            <div className="relative">
              {textareaRef.current && textareaRef.current.scrollHeight > 200 && (
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white via-white to-transparent z-10" />
              )}
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={disabled ? "Please select a data source first..." : "Ask anything about your data"}
                disabled={loading || disabled}
                rows={1}
                className={`w-full py-3 px-4 pr-16 bg-transparent text-slate-900 
                  placeholder-slate-400 border-none outline-none transition-all 
                  text-base resize-none min-h-[60px] max-h-[200px] overflow-y-auto
                  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                  ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !disabled) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={loading || !input.trim() || disabled}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowDataSourceSelector(!showDataSourceSelector)}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md text-sm transition-colors"
              >
                <Database size={14} />
                <span>
                  {selectedDataSource 
                    ? dataSources.find(ds => ds.id === selectedDataSource)?.projectId || "Data Source"
                    : "Select Data Source"
                  }
                </span>
                <ArrowUp 
                  size={14} 
                  className={`transform transition-transform ${
                    showDataSourceSelector ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>
              
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs">Shift + Enter for new line</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomePage;