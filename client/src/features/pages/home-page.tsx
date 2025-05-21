import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../../shared/sidebar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks"; 
import { setUser } from "../../store/auth-slice"; 

export default function HomePage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    localStorage.removeItem("user");
    dispatch(setUser(null));
    navigate("/login");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="bg-slate-800/80 backdrop-blur-sm p-4 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare size={24} className="text-indigo-100 mr-2" />
            <h2 className="font-medium text-indigo-100">New Conversation</h2>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm bg-[#7B7EF4] text-white rounded-full hover:bg-[#6B6EE4] transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-indigo-50/90 to-slate-50/90">
          <div className={`flex flex-col space-y-4 ${messages.length === 0 ? 'h-32' : 'min-h-0'}`}>
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-indigo-300">
                <p>Send a message to start conversation</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg backdrop-blur-sm ${
                      msg.role === "user"
                        ? "bg-[#7B7EF4] text-white"
                        : "bg-white/80 text-indigo-600 border border-indigo-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white/80 backdrop-blur-sm border-t border-indigo-100">
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 p-3 rounded-lg bg-white/60 border border-indigo-100 text-indigo-600 placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-[#7B7EF4] focus:border-transparent"
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
          </div>
        </form>
      </div>
    </div>
  );
}
