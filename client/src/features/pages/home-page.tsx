import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../../shared/app-layout";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_DATA_SOURCES } from "../../graphql/data-sources";

export const HomePage = () => {
  const location = useLocation();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
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
          
          if (result.result && result.result.length > 0) {
            answer = `I found ${result.result.length} result${result.result.length === 1 ? '' : 's'} for your question.\n\n`;
            
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
            answer = "I found no results for your query. The data might be empty or the query conditions might be too restrictive.";
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

  return (
    <AppLayout
      title="New Conversation"
      subtitle="Ask anything about your data"
      icon={<MessageSquare className="text-white" size={24} />}
      titleClickable={true}
      onTitleClick={clearChat}
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
        {dataSources.length > 0 && (
          <div className="p-4 bg-white border-b border-slate-200">
            <div className="max-w-4xl mx-auto">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Data Source
              </label>
              <select
                value={selectedDataSource || ""}
                onChange={(e) => setSelectedDataSource(e.target.value)}
                className="w-full max-w-md p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose your data source...</option>
                {dataSources.map((ds: any) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.projectId} ({ds.database})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-4xl mx-auto h-full">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center text-slate-700 space-y-8 -mt-20">
                  <div className="text-center space-y-2">
                    <p className="animate__animated animate__fadeInUp animate__delay-1 text-xl font-medium text-slate-700">
                      Send a message to start conversation
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 max-w-2xl w-full mx-auto px-4 md:px-0">
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
                  <div className="w-full max-w-2xl px-4 md:px-0">
                    <MessageInput
                      input={input}
                      setInput={setInput}
                      handleSubmit={handleSubmit}
                      loading={loading}
                      disabled={!selectedDataSource}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[calc(100vh-200px)] overflow-hidden -ml-[9%]">
                <div className="max-w-2xl mx-auto h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  <div className="pt-4 space-y-4 flex flex-col px-4" style={{minWidth: 0, width: '100%'}}>
                    {messages.map((msg, idx) => (
                      <div key={idx} className="animate-fade-in mb-4 w-full">
                        {msg.role === "user" ? (
                          <div className="flex justify-end mb-2">
                            <div className="bg-indigo-300 text-white p-3.5 rounded-xl text-sm max-w-[85%] md:max-w-full break-all hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', minWidth: 0}}>
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end md:justify-end mb-2">
                            <div className="text-slate-700 p-3.5 text-sm max-w-[85%] md:max-w-full break-all hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', minWidth: 0}}>
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 md:absolute md:bottom-6 md:left-1/2 md:transform md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-4">
            <MessageInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              loading={loading}
              disabled={!selectedDataSource}
            />
          </div>
        )}
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
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e?: React.FormEvent) => void;
  loading: boolean;
  disabled?: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 216; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  return (
    <div
      className="rounded-xl p-[1px] transition-all duration-300 relative"
      style={{ background: "rgb(199 210 254)" }}
      id="input-container-bottom"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {textareaRef.current && textareaRef.current.scrollHeight > 216 && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white via-white to-transparent z-10" />
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Please select a data source first..." : "Type your message..."}
            disabled={loading || disabled}
            rows={1}
            className={`w-full py-6 px-4 pr-14 rounded-xl bg-white text-slate-900 
              placeholder-slate-600 border-none outline-none shadow-lg transition-all 
              text-base resize-none max-h-[216px] overflow-y-auto
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onFocus={() => {
              if (!disabled) {
                const container = document.getElementById("input-container-bottom");
                if (container)
                  container.style.background =
                    "linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)";
              }
            }}
            onBlur={() => {
              const container = document.getElementById("input-container-bottom");
              if (container) container.style.background = "rgb(199 210 254)";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !disabled) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim() || disabled}
          className="absolute right-4 top-6 text-slate-900 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Send className="w-6 h-6" />
          )}
        </button>
      </form>
    </div>
  );
};

export default HomePage;