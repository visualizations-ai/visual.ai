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
    <div className="flex h-screen">
      {/* סיידבר */}
      <Sidebar />

      {/* אזור הצ'אט */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare size={20} className="text-gray-500 mr-2" />
            <h2 className="font-medium">new conversion</h2>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className={`flex flex-col space-y-4 ${messages.length === 0 ? 'h-32' : 'min-h-0'}`}>
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>send a message to start conversion</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
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

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              dir="rtl"
            />
            <button
              type="submit"
              className={`ml-2 p-3 rounded-full ${
                loading || !input.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 size={20} className="text-white animate-spin" />
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
