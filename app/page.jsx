"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function Message({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`${
          true: "max-w-[85%] sm:max-w-[70%]"
        } bg-white border border-amber-200 rounded-2xl px-4 py-3 shadow-sm ${
          isAssistant ? "rounded-tl-none" : "rounded-tr-none bg-amber-100"
        }`}
      >
        <div className="text-xs text-neutral-500 mb-1">
          {isAssistant ? "Assistant" : "You"}
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
      </div>
    </div>
  );
}

function Pill({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs bg-amber-100 hover:bg-amber-200 border border-amber-200 transition"
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to McDonald's! I can help with menu questions, nutrition, and building an order. What are you in the mood for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  async function sendMessage(text) {
    if (!text.trim()) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, cart }),
      });
      const data = await res.json();
      if (data.cart) setCart(data.cart);
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function quickAsk(q) {
    sendMessage(q);
  }

  function updateQuantity(index, delta) {
    setCart((prev) => {
      const next = prev.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
      return next;
    });
  }

  function removeItem(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <section className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Pill onClick={() => quickAsk("Show me popular burgers")}>Popular burgers</Pill>
          <Pill onClick={() => quickAsk("I want a chicken sandwich under 500 calories")}>Chicken under 500 cal</Pill>
          <Pill onClick={() => quickAsk("Recommend a kids meal with apple slices")}>Kids meal</Pill>
          <Pill onClick={() => quickAsk("What are breakfast options with coffee?")}>Breakfast + coffee</Pill>
        </div>

        <div
          ref={listRef}
          className="h-[54vh] sm:h-[60vh] overflow-y-auto space-y-3 pr-2 border border-amber-200 rounded-xl bg-white p-3"
        >
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}
          {loading && <div className="text-xs text-neutral-500 px-2">Thinking?</div>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the menu, nutrition, deals, or say 'add Big Mac'"
            className="flex-1 rounded-xl border border-amber-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
          <button
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>

      <aside className="bg-white border border-amber-200 rounded-xl p-4 h-fit sticky top-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Your Order</h2>
          <button
            className="text-xs text-amber-700 underline"
            onClick={() => setCart([])}
          >
            Clear
          </button>
        </div>
        <div className="space-y-2">
          {cart.length === 0 && (
            <div className="text-sm text-neutral-500">Cart is empty. Ask to add items.</div>
          )}
          {cart.map((item, i) => (
            <div key={i} className="border border-amber-100 rounded-lg p-2">
              <div className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-neutral-500">${item.price.toFixed(2)} each</div>
                </div>
                <div className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button className="px-2 py-1 rounded bg-amber-100" onClick={() => updateQuantity(i, -1)}>-</button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button className="px-2 py-1 rounded bg-amber-100" onClick={() => updateQuantity(i, 1)}>+</button>
                <button className="ml-auto text-xs text-amber-700 underline" onClick={() => removeItem(i)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-amber-200 mt-3 pt-3 flex justify-between">
          <div className="text-sm">Subtotal</div>
          <div className="font-bold">${subtotal.toFixed(2)}</div>
        </div>
        <button className="mt-3 w-full py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600">
          Checkout (Demo)
        </button>
      </aside>
    </div>
  );
}
