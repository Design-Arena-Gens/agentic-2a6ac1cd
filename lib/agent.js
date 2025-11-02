import menu from "../data/menu.json" assert { type: "json" };

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findItemsByKeywords(keywords) {
  const results = [];
  for (const cat of menu.categories) {
    for (const item of cat.items) {
      const hay = normalize(`${item.name} ${item.tags?.join(" ") ?? ""}`);
      if (keywords.every((k) => hay.includes(k))) {
        results.push({ ...item, category: cat.name });
      }
    }
  }
  return results;
}

function allItems() {
  const items = [];
  for (const cat of menu.categories) {
    for (const item of cat.items) items.push({ ...item, category: cat.name });
  }
  return items;
}

function getPopular(limit = 6) {
  return allItems()
    .filter((i) => i.popular)
    .slice(0, limit);
}

function filterByCalories(maxCalories) {
  return allItems().filter((i) => i.calories <= maxCalories);
}

function asBulleted(items) {
  if (!items.length) return "- No matching items found.";
  return items
    .slice(0, 8)
    .map((i) => `- ${i.name} ? $${i.price.toFixed(2)} (${i.calories} cal)`) 
    .join("\n");
}

function tryParseAddCommand(text) {
  // Examples: "add big mac", "add 2 cheeseburgers", "remove fries", "remove 1 apple pie"
  const t = normalize(text);
  const addMatch = t.match(/^(?:please\s+)?add\s+(\d+)?\s*(.+)$/);
  const removeMatch = t.match(/^(?:please\s+)?remove\s+(\d+)?\s*(.+)$/);
  if (addMatch) return { op: "add", qty: Number(addMatch[1] || 1), query: addMatch[2] };
  if (removeMatch) return { op: "remove", qty: Number(removeMatch[1] || 1), query: removeMatch[2] };
  return null;
}

function fuzzyFindItem(query) {
  const q = normalize(query);
  let best = null;
  let bestScore = 0;
  for (const item of allItems()) {
    const hay = normalize(`${item.name} ${item.tags?.join(" ") ?? ""}`);
    let score = 0;
    if (hay.includes(q)) score += 5;
    const words = q.split(" ");
    score += words.filter((w) => hay.includes(w)).length;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

export function respond({ messages, cart }) {
  const last = messages[messages.length - 1]?.content ?? "";
  const t = normalize(last);

  // Add/remove shortcuts
  const cmd = tryParseAddCommand(last);
  if (cmd) {
    const item = fuzzyFindItem(cmd.query);
    if (!item) {
      return {
        reply: `I couldn't find an item like "${cmd.query}". Try being more specific.`,
        cart,
      };
    }
    if (cmd.op === "add") {
      const idx = cart.findIndex((c) => c.id === item.id);
      const quantity = cmd.qty || 1;
      let next;
      if (idx >= 0) {
        next = cart.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + quantity } : c));
      } else {
        next = [...cart, { id: item.id, name: item.name, price: item.price, quantity }];
      }
      return {
        reply: `Added ${quantity} ? ${item.name} to your order.`,
        cart: next,
      };
    } else {
      // remove
      const idx = cart.findIndex((c) => c.id === item.id);
      if (idx < 0) {
        return { reply: `${item.name} isn't in your cart.`, cart };
      }
      const quantity = cmd.qty || 1;
      const next = cart
        .map((c, i) => (i === idx ? { ...c, quantity: Math.max(0, c.quantity - quantity) } : c))
        .filter((c) => c.quantity > 0);
      return { reply: `Removed ${quantity} ? ${item.name}.`, cart: next };
    }
  }

  // Intent classification
  if (/\b(popular|recommend|suggest|best|famous)\b/.test(t)) {
    const items = getPopular();
    return {
      reply: `Here are some popular picks:\n${asBulleted(items)}\n\nSay things like "add Big Mac" or "what's under 500 calories".`,
      cart,
    };
  }

  const calMatch = t.match(/(under|below|less than)\s+(\d{2,4})\s*(?:cal|calories)?/);
  if (calMatch) {
    const max = Number(calMatch[2]);
    const items = filterByCalories(max).slice(0, 8);
    return {
      reply: `Options under ${max} calories:\n${asBulleted(items)}`,
      cart,
    };
  }

  if (/\b(breakfast|morning|coffee)\b/.test(t)) {
    const items = findItemsByKeywords(["breakfast"]).concat(findItemsByKeywords(["coffee"]))
      .slice(0, 8);
    return {
      reply: `Breakfast ideas:\n${asBulleted(items)}`,
      cart,
    };
  }

  if (/\b(kid|happy meal|kids)\b/.test(t)) {
    const items = findItemsByKeywords(["kids"]).slice(0, 6);
    return { reply: `Kids options:\n${asBulleted(items)}`, cart };
  }

  // Query by category or keyword
  const keywords = t.split(" ").filter((w) => w.length > 2);
  if (keywords.length) {
    const matches = findItemsByKeywords(keywords).slice(0, 8);
    if (matches.length) {
      return {
        reply: `Here is what I found:\n${asBulleted(matches)}\n\nYou can say "add <item name>" to add to cart.`,
        cart,
      };
    }
  }

  // Default help
  return {
    reply:
      "I can help with menu suggestions, nutrition filters, and ordering. Try: 'popular burgers', 'under 500 calories', or 'add Big Mac'.",
    cart,
  };
}
