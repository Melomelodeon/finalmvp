import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

import { API_BASE } from "../config";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm PeerConnect AI. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const messageToSend = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chatbot/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();
      let botText = "Sorry, I couldn't understand that.";
      if (data?.raw) {
        const parsed = JSON.parse(data.raw);
        botText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || botText;
      }
      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Oops! Something went wrong." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white px-5 py-3 rounded-full shadow-xl hover:scale-105 transform transition flex items-center gap-2"
      >
        <MessageCircle size={24} /> Chat with AI
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-5 w-80 h-[500px] bg-white shadow-2xl rounded-2xl border flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 flex justify-between items-center rounded-t-2xl shadow-md">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2">
              🤖 PeerConnect AI
            </h2>
            <X
              onClick={() => setOpen(false)}
              className="cursor-pointer hover:text-gray-200 transition"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 max-w-[80%] text-sm ${
                  msg.sender === "user" ? "ml-auto justify-end" : "mr-auto"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs shadow">
                    🤖
                  </div>
                )}
                <div
                  className={`p-2 rounded-2xl shadow-md ${
                    msg.sender === "user"
                      ? "bg-blue-100 hover:bg-blue-200 transition"
                      : "bg-white hover:bg-gray-100 transition"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 mr-auto max-w-[60%]">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs shadow">
                  🤖
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounceAnimation delay-0"></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounceAnimation delay-200"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounceAnimation delay-400"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-gray-50 rounded-b-2xl">
            <form
              className="flex gap-2 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                type="text"
                className="flex-1 border rounded-2xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className="bg-gradient-to-br from-blue-500 to-blue-700 text-white px-4 rounded-2xl text-sm hover:scale-105 transform transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating dots animation */}
      <style>{`
        @keyframes bounceAnimation {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .animate-bounceAnimation { animation: bounceAnimation 1s infinite; }
        .delay-0 { animation-delay: 0s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </>
  );
}