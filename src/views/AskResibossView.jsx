import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { extractWithGemini, getActiveGeminiKey, isValidGeminiKey } from '../utils/geminiOcr';
import {
  upsertAiConversationToSupabase,
  fetchAiConversationFromSupabase,
} from '../lib/supabase';
import { buildQueryContext } from '../utils/spendingIntelligence';
import { soundFx } from '../utils/soundEffects';
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Trash2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const CONV_STORAGE_KEY_PREFIX = 'resiboss_ask_conv_';
const getConvKey = (userId) => `${CONV_STORAGE_KEY_PREFIX}${userId || 'guest'}`;

function loadLocalMessages(userId) {
  try {
    const raw = localStorage.getItem(getConvKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch { return []; }
}

function saveLocalMessages(userId, messages) {
  try {
    localStorage.setItem(getConvKey(userId), JSON.stringify(messages.slice(-50)));
  } catch {}
}

const EXAMPLE_QUESTIONS = [
  'How much did I spend this month?',
  'What is my top spending category?',
  'Which store do I visit most?',
  'What was my most expensive purchase?',
  'How much did I spend on groceries?',
  'How much have I spent this year?',
];

// ─────────────────────────────────────────────────────────────────────────────
// DB-FIRST QUERY ENGINE
// Returns a structured answer from the data before asking Gemini to format it.
// ─────────────────────────────────────────────────────────────────────────────

function answerFromData(question, ctx, formatCurrency) {
  const q = question.toLowerCase();

  // Spending amounts
  if (q.includes('this month') || q.includes('month')) {
    return `Your total spending this month is **${formatCurrency(ctx.monthSpend)}** across ${ctx.receiptCount} receipts.`;
  }
  if (q.includes('this week') || q.includes('last 7') || q.includes('week')) {
    return `You spent **${formatCurrency(ctx.weekSpend)}** in the past 7 days.`;
  }
  if (q.includes('this year') || q.includes('year')) {
    return `You have spent **${formatCurrency(ctx.yearSpend)}** so far this year.`;
  }
  if (q.includes('total') || q.includes('all time') || q.includes('everything')) {
    return `Your total recorded spending across all receipts is **${formatCurrency(ctx.totalSpend)}**.`;
  }

  // Category spending
  if (q.includes('categor') || q.includes('top spending')) {
    if (ctx.categorySpending.length === 0) return 'No category data found. Scan more receipts!';
    const top = ctx.categorySpending.slice(0, 3)
      .map((c) => `**${c.category}** — ${formatCurrency(c.total)}`)
      .join(', ');
    return `Your top spending categories are: ${top}.`;
  }

  const groceryMatch = q.includes('groceries') || q.includes('grocery') || q.includes('supermarket');
  const foodMatch = q.includes('food') || q.includes('restaurant') || q.includes('eat');
  if (groceryMatch || foodMatch) {
    const catName = groceryMatch ? 'Groceries' : 'Food';
    const found = ctx.categorySpending.find((c) => c.category.toLowerCase() === catName.toLowerCase());
    if (found) return `You spent **${formatCurrency(found.total)}** on ${catName}.`;
    return `No ${catName} receipts found. Try scanning a grocery receipt!`;
  }

  // Store questions
  if (q.includes('store') || q.includes('shop') || q.includes('visit') || q.includes('frequent') || q.includes('favourite') || q.includes('most')) {
    if (ctx.topStore) {
      return `Your most visited store is **${ctx.topStore.merchant}** with ${ctx.topStore.count} visit${ctx.topStore.count !== 1 ? 's' : ''}, totalling ${formatCurrency(ctx.topStore.totalSpend)}.`;
    }
    return 'Not enough store data yet. Keep scanning receipts!';
  }

  // Most expensive
  if (q.includes('expensive') || q.includes('biggest') || q.includes('largest') || q.includes('highest')) {
    if (ctx.mostExpensiveReceipt) {
      const r = ctx.mostExpensiveReceipt;
      return `Your most expensive receipt was at **${r.merchant}** on ${r.date} for **${formatCurrency(r.total)}**.`;
    }
    return 'No receipts found yet.';
  }

  // Recent receipts
  if (q.includes('recent') || q.includes('last receipt') || q.includes('latest')) {
    if (ctx.recentReceipts.length === 0) return 'No receipts found yet.';
    const r = ctx.recentReceipts[0];
    return `Your most recent receipt is from **${r.merchant}** on ${r.date} for **${formatCurrency(r.total)}**.`;
  }

  // Receipt count
  if (q.includes('how many') && (q.includes('receipt') || q.includes('scan'))) {
    return `You have **${ctx.receiptCount}** receipt${ctx.receiptCount !== 1 ? 's' : ''} saved in Resiboss.`;
  }

  return null; // Let Gemini handle
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD GEMINI PROMPT
// ─────────────────────────────────────────────────────────────────────────────

function buildGeminiPrompt(question, ctx, formatCurrency) {
  return `You are Resiboss AI, a friendly personal spending assistant.
Answer the user's question using ONLY the data below. 
Do NOT invent amounts, dates, or store names.
If there is not enough data, say so honestly.
Keep your answer short — 2 to 4 sentences maximum.
Use simple, friendly language. Do not use accounting jargon.

SPENDING DATA:
- Total all-time spending: ${formatCurrency(ctx.totalSpend)}
- Spending this month: ${formatCurrency(ctx.monthSpend)}
- Spending this week: ${formatCurrency(ctx.weekSpend)}
- Spending this year: ${formatCurrency(ctx.yearSpend)}
- Total receipts: ${ctx.receiptCount}
- Top category: ${ctx.topCategory ? `${ctx.topCategory.category} (${formatCurrency(ctx.topCategory.total)})` : 'none'}
- Category breakdown: ${ctx.categorySpending.slice(0, 5).map((c) => `${c.category}: ${formatCurrency(c.total)}`).join(', ') || 'none'}
- Most visited store: ${ctx.topStore ? `${ctx.topStore.merchant} (${ctx.topStore.count} visits, ${formatCurrency(ctx.topStore.totalSpend)})` : 'none'}
- Most expensive receipt: ${ctx.mostExpensiveReceipt ? `${ctx.mostExpensiveReceipt.merchant} on ${ctx.mostExpensiveReceipt.date} — ${formatCurrency(ctx.mostExpensiveReceipt.total)}` : 'none'}
- Recent receipts: ${ctx.recentReceipts.map((r) => `${r.merchant} (${formatCurrency(r.total)}, ${r.date})`).join('; ') || 'none'}

USER QUESTION: ${question}

ANSWER:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';

  // Render **bold** markdown
  const renderText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p
    );
  };

  return (
    <div style={{
      display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end', marginBottom: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: 10, flexShrink: 0,
        background: isUser ? 'var(--cyan-subtle)' : 'var(--violet-subtle)',
        border: `1px solid ${isUser ? 'var(--glass-border-glow)' : 'rgba(168,85,247,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User size={14} color="var(--cyan-glow)" />
          : <Sparkles size={14} color="var(--violet-glow)" />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--cyan-subtle)' : 'var(--bg-surface)',
        border: `1px solid ${isUser ? 'var(--glass-border-glow)' : 'var(--glass-border)'}`,
        fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)',
      }}>
        {msg.isLoading ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--violet-glow)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <span>{renderText(msg.content)}</span>
        )}
        {msg.timestamp && !msg.isLoading && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
            {new Date(msg.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────────────
export const AskResibossView = () => {
  const { userProfile, documents, formatCurrency, isOnline, theme } = useApp();
  const isLight = theme === 'light';
  const userId = userProfile?.id || null;

  const [messages, setMessages] = useState(() => loadLocalMessages(userId));
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const convId = useRef(`conv-${userId || 'guest'}-main`);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist messages
  useEffect(() => {
    saveLocalMessages(userId, messages);
  }, [messages, userId]);

  // Send a question
  const handleSend = useCallback(async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || isTyping) return;

    soundFx.playClick();
    setInput('');
    setIsTyping(true);

    const userMsg = { id: generateId(), role: 'user', content: q, timestamp: Date.now() };
    const loadingMsg = { id: generateId(), role: 'assistant', content: '', isLoading: true, timestamp: Date.now() };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const ctx = buildQueryContext(documents, q);

      // DB-first: try to answer directly from data
      const directAnswer = answerFromData(q, ctx, formatCurrency);

      let answerText = directAnswer;

      // Fallback to Gemini for complex/unrecognised questions
      if (!answerText) {
        const geminiKey = getActiveGeminiKey();
        if (isValidGeminiKey(geminiKey) && isOnline) {
          try {
            const prompt = buildGeminiPrompt(q, ctx, formatCurrency);
            // Use Gemini text generation (not vision)
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
              }),
            });
            if (response.ok) {
              const data = await response.json();
              answerText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
            }
          } catch (e) {
            // Gemini failed — fall back to canned response
          }
        }
      }

      if (!answerText) {
        answerText = documents.length === 0
          ? "You haven't scanned any receipts yet. Scan your first receipt and I'll be able to answer questions about your spending!"
          : "I'm not sure how to answer that from your receipt data. Try asking about your monthly spending, top category, most visited store, or most expensive purchase.";
      }

      const assistantMsg = {
        id: generateId(),
        role: 'assistant',
        content: answerText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [
        ...prev.filter((m) => !m.isLoading),
        assistantMsg,
      ]);

      // Sync to Supabase
      if (isOnline && userId) {
        const fullMessages = [...messages.filter((m) => !m.isLoading), userMsg, assistantMsg];
        upsertAiConversationToSupabase({
          id: convId.current,
          user_id: userId,
          title: q.slice(0, 60),
          messages: fullMessages.slice(-50),
        }).catch(() => {});
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => !m.isLoading),
        { id: generateId(), role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, documents, formatCurrency, isOnline, userId, messages]);

  const handleClear = () => {
    soundFx.playClick();
    setMessages([]);
    saveLocalMessages(userId, []);
  };

  const isFirstVisit = messages.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.02em' }}>
              Ask Resiboss
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Questions answered from your own receipt data
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {isFirstVisit ? (
          <div>
            {/* Welcome state */}
            <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'var(--violet-subtle)',
                border: '1px solid rgba(168,85,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Sparkles size={28} color="var(--violet-glow)" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                Ask me anything about your spending
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                I answer from your actual receipts — no guessing.
              </div>
            </div>

            {/* Example questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-bright)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  {q}
                  <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: 16 }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '12px 20px 24px', flexShrink: 0,
        borderTop: '1px solid var(--glass-border)',
        background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          display: 'flex', gap: 10,
          padding: '8px 8px 8px 16px',
          background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about your spending…"
            disabled={isTyping}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: input.trim() && !isTyping ? 'var(--violet-glow)' : 'var(--bg-surface-hover)',
              border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            {isTyping
              ? <RefreshCw size={16} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={16} color={input.trim() ? '#fff' : 'var(--text-muted)'} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Answers are based on your saved receipts only.
        </div>
      </div>
    </div>
  );
};
