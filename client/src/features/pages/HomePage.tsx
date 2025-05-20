import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../../shared/types/sidebar";
import { MessageSquare, Send, Loader2 } from "lucide-react";


export default function HomePage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  

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
        { role: "bot", content: "שגיאה בחיבור לשרת" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="bg-white p-4 border-b border-gray-200 flex items-center">
          <MessageSquare size={20} className="text-gray-500 mr-2" />
          <h2 className="font-medium">שיחה חדשה</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className={`flex flex-col space-y-4 ${messages.length === 0 ? 'h-32' : 'min-h-0'}`}>
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>שלח הודעה כדי להתחיל את השיחה</p>
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


        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex items-center">
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
              className={`mr-2 p-3 rounded-full ${
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
          </form>
        </div>
      </div>
    </div>
  );
}