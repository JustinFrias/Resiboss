import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Check, X, Sparkles, ShoppingCart, Edit2, ScanLine } from 'lucide-react';
import {
  fetchShoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem,
} from '../lib/supabase';
import { getSmartShoppingList } from '../utils/spendingIntelligence';
import { soundFx } from '../utils/soundEffects';

export const ShoppingListView = () => {
  const { documents, user, setActiveTab, theme } = useApp();

  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const addInputRef = useRef(null);

  const suggestions = useMemo(() => getSmartShoppingList(documents), [documents]);
  const userItems = items.filter((i) => !i.is_suggestion);
  const suggestedItems = items.filter((i) => i.is_suggestion);

  // Load list from Supabase / localStorage
  useEffect(() => {
    const loadList = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const data = await fetchShoppingList(user.id);
          setItems(data || []);
        } else {
          const saved = localStorage.getItem('resiboss_shopping_v1');
          if (saved) setItems(JSON.parse(saved));
        }
      } catch (e) {
        const saved = localStorage.getItem('resiboss_shopping_v1');
        if (saved) setItems(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, [user?.id]);

  // Persist to localStorage when no user
  useEffect(() => {
    if (!user?.id) {
      localStorage.setItem('resiboss_shopping_v1', JSON.stringify(items));
    }
  }, [items, user?.id]);

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    soundFx?.playClick?.();
    const newItem = { id: `local-${Date.now()}`, name: text, completed: false, is_suggestion: false };
    setItems((prev) => [newItem, ...prev]);
    setNewText('');
    addInputRef.current?.focus();
    if (user?.id) {
      try {
        const saved = await addShoppingItem(user.id, text, false);
        if (saved) {
          setItems((prev) => prev.map((i) => i.id === newItem.id ? { ...saved, id: saved.id } : i));
        }
      } catch (e) {}
    }
  };

  const handleAddSuggestion = async (suggestion) => {
    soundFx?.playClick?.();
    const newItem = { id: `local-${Date.now()}`, name: suggestion.name, completed: false, is_suggestion: true };
    setItems((prev) => [newItem, ...prev]);
    if (user?.id) {
      try {
        const saved = await addShoppingItem(user.id, suggestion.name, true);
        if (saved) {
          setItems((prev) => prev.map((i) => i.id === newItem.id ? { ...saved } : i));
        }
      } catch (e) {}
    }
  };

  const handleToggle = async (item) => {
    soundFx?.playClick?.();
    const updated = { ...item, completed: !item.completed };
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
    if (user?.id && !String(item.id).startsWith('local-')) {
      try { await updateShoppingItem(item.id, { completed: !item.completed }); } catch (e) {}
    }
  };

  const handleDelete = async (itemId) => {
    soundFx?.playClick?.();
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (user?.id && !String(itemId).startsWith('local-')) {
      try { await deleteShoppingItem(itemId); } catch (e) {}
    }
  };

  const handleSaveEdit = async (item) => {
    const text = editText.trim();
    if (!text) { setEditingId(null); return; }
    soundFx?.playClick?.();
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name: text } : i));
    setEditingId(null);
    if (user?.id && !String(item.id).startsWith('local-')) {
      try { await updateShoppingItem(item.id, { name: text }); } catch (e) {}
    }
  };

  const handleClearCompleted = () => {
    soundFx?.playClick?.();
    const completedIds = items.filter((i) => i.completed).map((i) => i.id);
    setItems((prev) => prev.filter((i) => !i.completed));
    if (user?.id) {
      completedIds.forEach((id) => {
        if (!String(id).startsWith('local-')) {
          deleteShoppingItem(id).catch(() => {});
        }
      });
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const pendingSuggestions = suggestions.filter((s) => !items.some((i) => i.name.toLowerCase() === s.name.toLowerCase()));

  const ItemRow = ({ item }) => {
    const isEditing = editingId === item.id;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 12,
        background: item.completed ? 'transparent' : 'var(--bg-surface)',
        border: `1px solid ${item.completed ? 'transparent' : 'var(--glass-border)'}`,
        transition: 'all 0.15s ease',
        animation: 'rb-fade-up 0.2s ease',
        opacity: item.completed ? 0.5 : 1,
      }}>
        {/* Checkbox */}
        <button
          onClick={() => handleToggle(item)}
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            border: item.completed ? 'none' : '1.5px solid var(--glass-border)',
            background: item.completed ? 'var(--emerald-glow)' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {item.completed && <Check size={13} color="#000" strokeWidth={3} />}
        </button>

        {/* Name / Edit input */}
        {isEditing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(item); if (e.key === 'Escape') setEditingId(null); }}
            onBlur={() => handleSaveEdit(item)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
        ) : (
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
            textDecoration: item.completed ? 'line-through' : 'none',
          }}>
            {item.name}
          </span>
        )}

        {/* Suggestion badge */}
        {item.is_suggestion && !item.completed && (
          <span className="rb-badge rb-badge-ai" style={{ fontSize: 10 }}>
            <Sparkles size={9} /> Suggested
          </span>
        )}

        {/* Actions */}
        {!item.completed && !isEditing && (
          <button
            onClick={() => { setEditingId(item.id); setEditText(item.name); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            <Edit2 size={13} />
          </button>
        )}
        <button
          onClick={() => handleDelete(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={13} />
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 100px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="rb-page-header">
        <h1 className="rb-page-title">Shopping List</h1>
        <p className="rb-page-subtitle">
          {items.length === 0
            ? 'Add items to your shopping list.'
            : `${items.filter(i => !i.completed).length} items remaining`}
        </p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── ADD ITEM ── */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={addInputRef}
              className="rb-input"
              type="text"
              placeholder="Add an item…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              style={{ paddingRight: newText ? 40 : 14 }}
            />
            {newText && (
              <button
                onClick={() => setNewText('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={handleAdd} disabled={!newText.trim()} className="rb-btn rb-btn-primary">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* ── RESIBOSS SUGGESTIONS ── */}
        {pendingSuggestions.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={13} color="var(--cyan-glow)" />
              <span className="rb-label">Suggested by Resiboss</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Based on your purchase history</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pendingSuggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleAddSuggestion(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 20,
                    background: 'var(--cyan-subtle)',
                    border: '1px solid rgba(0,242,254,0.2)',
                    color: 'var(--cyan-glow)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyan-glow)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0,242,254,0.2)'}
                >
                  <Plus size={12} /> {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ITEMS ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            <div className="rb-dots"><span /><span /><span /></div>
          </div>
        ) : items.length === 0 ? (
          <div className="rb-empty">
            <div className="rb-empty-icon">🛒</div>
            <div className="rb-empty-title">Your list is empty</div>
            <p className="rb-empty-body">Add items above, or scan more receipts for smart suggestions.</p>
            {documents.length === 0 && (
              <button onClick={() => { soundFx?.playClick?.(); setActiveTab('scanner'); }} className="rb-btn rb-btn-secondary" style={{ marginTop: 8 }}>
                <ScanLine size={14} /> Scan a Receipt
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pending items */}
            {userItems.filter(i => !i.completed).length > 0 && (
              <div>
                <div className="rb-label" style={{ marginBottom: 8 }}>Your List</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userItems.filter(i => !i.completed).map((item) => <ItemRow key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {/* Suggested items (added) */}
            {suggestedItems.filter(i => !i.completed).length > 0 && (
              <div>
                <div className="rb-label" style={{ marginBottom: 8 }}>Added from Suggestions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {suggestedItems.filter(i => !i.completed).map((item) => <ItemRow key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedCount > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="rb-label">Done ({completedCount})</div>
                  <button onClick={handleClearCompleted} className="rb-btn rb-btn-ghost rb-btn-sm" style={{ color: '#ef4444' }}>
                    <Trash2 size={12} /> Clear done
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.filter(i => i.completed).map((item) => <ItemRow key={item.id} item={item} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
