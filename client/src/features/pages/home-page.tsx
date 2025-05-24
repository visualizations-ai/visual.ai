import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../../shared/sidebar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks"; 
import { setUser } from "../../store/auth-slice"; 

export const HomePage = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Sample questions for quick access
  const sampleQuestions = [
    "What is the current stock level of our best-selling products",
    "Which customers haven't made a purchase in the last three months ",
    "Are there any budget overruns in this month's expenses",
    "Which products should we reorder this week based on sales forecasts"
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    dispatch(setUser(null));
    navigate("/login");
  };

  useEffect(() => {
    // Always scroll to show only the latest question-answer pair
    if (messages.length > 0) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        // Calculate how much content we have
        const containerHeight = messagesContainer.clientHeight;
        const scrollHeight = messagesContainer.scrollHeight;
        
        // If content is more than container, scroll to show only latest messages
        if (scrollHeight > containerHeight) {
          // Scroll to bottom minus a bit to show only the latest conversation
          messagesContainer.scrollTop = scrollHeight - containerHeight + 100;
        }
      }
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();
      const botMessage = { role: "bot", content: data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "error: " + (err as Error).message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Set sample question and submit immediately
  const setAndSubmitQuestion = (question: string) => {
    if (loading) return;
    setInput(question);
    
    setTimeout(() => {
      const userMessage = { role: "user", content: question };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        fetch("http://localhost:3000/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        })
          .then(res => res.json())
          .then(data => {
            const botMessage = { role: "bot", content: data.answer };
            setMessages((prev) => [...prev, botMessage]);
          })
          .catch(err => {
            setMessages((prev) => [
              ...prev,
              { role: "bot", content: "error: " + (err as Error).message },
            ]);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "error: " + (err as Error).message },
        ]);
        setLoading(false);
      }
    }, 0);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-indigo-50/90 to-slate-50/90">
          <div className="flex items-center">
            <MessageSquare size={24} className="text-indigo-700 mr-2" />
            <h2 className="font-medium text-indigo-800">New Conversation</h2>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm bg-[#7B7EF4] text-white rounded-full hover:bg-[#6B6EE4] transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Messages Area - Fixed height with scroll */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-50/90 to-slate-50/90 pb-24">
          <div className="max-w-2xl mx-auto w-3/4 px-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-indigo-800 space-y-5">
                <p className="text-lg font-medium">Send a message to start conversation</p>
                
                <div className="flex flex-wrap justify-center gap-3 max-w-2xl w-full">
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setAndSubmitQuestion(question)}
                      className="p-2 bg-white border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50/80 hover:border-indigo-200 transition-colors text-xs text-indigo-700 text-center w-[130px] h-[70px] flex items-center justify-center"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-4 space-y-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className="mb-1" data-message-index={idx}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end mb-1">
                        <div className="bg-indigo-300 text-white p-2 rounded-lg text-sm max-w-[80%]">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="text-indigo-700 text-sm mb-2">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 max-w-2xl">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              className="flex-1 p-3 rounded-3xl bg-white text-indigo-600 placeholder-indigo-400 border border-indigo-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              dir="rtl"
            />
            <button
              type="submit"
              className={`ml-2 p-3 rounded-full transition-colors ${
                loading || !input.trim()
                  ? "bg-[#7B7EF4]/50 cursor-not-allowed"
                  : "bg-[#7B7EF4] hover:bg-[#6B6EE4]"
              }`}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 size={20} className="text-white/80 animate-spin" />
              ) : (
                <Send size={20} className="text-white" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}