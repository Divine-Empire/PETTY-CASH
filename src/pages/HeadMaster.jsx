import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, X, Check, RefreshCcw,
  Layers, Box, Subtitles, Search, Loader2, FilterX, User, Building2
} from 'lucide-react';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;

export default function HeadMaster() {
  const [masterData, setMasterData] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const fetchMasterData = useCallback(async (silent = false) => {
    if (!silent) setFetching(true);
    try {
      const res = await fetch(APPSCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'readMaster' }) });
      const json = await res.json();
      if (json.success) {
        const formatted = (json.data || []).map(r => ({
          'Group Head': String(r['Group Head'] || r['Group Heads'] || '').trim(),
          'Expense Head': String(r['Expense Head'] || r['Expense Heads'] || '').trim(),
          'Sub Head': String(r['Sub Head'] || r['Sub Heads'] || '').trim(),
          'Vendore': String(r['Vendore'] || r['Vendor'] || r['Vendors'] || '').trim(),
          'Branch': String(r['Branch'] || r['Branches'] || '').trim(),
        })).filter(r => r['Group Head'] || r['Expense Head'] || r['Sub Head'] || r['Vendore'] || r['Branch']);
        setMasterData(formatted);
      }
    } catch { toast.error('Error loading Master data'); } finally { if (!silent) setFetching(false); }
  }, []);

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);

  const groupHeads = useMemo(() => {
    return [...new Set(masterData.map(d => d['Group Head']).filter(Boolean))]
      .filter(g => g.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, searchTerm]);

  const expenseHeads = useMemo(() => {
    return [...new Set(masterData.map(d => d['Expense Head']).filter(Boolean))]
      .filter(e => e.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, searchTerm]);

  const subHeads = useMemo(() => {
    return [...new Set(masterData.map(d => d['Sub Head']).filter(Boolean))]
      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, searchTerm]);

  const vendors = useMemo(() => {
    return [...new Set(masterData.map(d => d['Vendore']).filter(Boolean))]
      .filter(v => v.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, searchTerm]);

  const branchesMaster = useMemo(() => {
    return [...new Set(masterData.map(d => d['Branch']).filter(Boolean))]
      .filter(b => b.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, searchTerm]);

  const callApi = async (action, data) => {
    setSaving(true);
    try {
      const res = await fetch(APPSCRIPT_URL, { method: 'POST', body: JSON.stringify({ action, data }) });
      const json = await res.json();
      if (json.success) return json;
      throw new Error();
    } catch { toast.error('Action failed'); throw new Error(); } finally { setSaving(false); }
  };

  const handleCommit = async () => {
    const val = inputValue.trim();
    if (!val) return;
    try {
      if (activeAction.type === 'add') {
        const payload = activeAction.level === 'group' ? { 'Group Head': val, 'Expense Head': '', 'Sub Head': '', 'Vendor': '', 'Branch': '' } :
                        activeAction.level === 'expense' ? { 'Group Head': selectedGroup || '', 'Expense Head': val, 'Sub Head': '', 'Vendore': '', 'Branch': '' } :
                        activeAction.level === 'sub' ? { 'Group Head': selectedGroup || '', 'Expense Head': selectedExpense || '', 'Sub Head': val, 'Vendore': '', 'Branch': '' } :
                        activeAction.level === 'vendor' ? { 'Group Head': selectedGroup || '', 'Expense Head': selectedExpense || '', 'Sub Head': '', 'Vendore': val, 'Branch': '' } :
                        { 'Group Head': '', 'Expense Head': '', 'Sub Head': '', 'Vendor': '', 'Branch': val };
        await callApi('createMaster', payload);
      } else {
        const { level, oldValue } = activeAction;
        const oldV = level === 'group' ? { 'Group Head': oldValue } : 
                    level === 'expense' ? { 'Group Head': selectedGroup, 'Expense Head': oldValue } : 
                    level === 'sub' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Sub Head': oldValue } :
                    level === 'vendor' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Vendore': oldValue } :
                    { 'Branch': oldValue };
        
        const newV = level === 'group' ? { 'Group Head': val } : 
                    level === 'expense' ? { 'Group Head': selectedGroup, 'Expense Head': val } : 
                    level === 'sub' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Sub Head': val } :
                    level === 'vendor' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Vendore': val } :
                    { 'Branch': val };
        await callApi('updateMaster', { level, oldValue: oldV, newValue: newV });
      }
      toast.success('Updated'); setActiveAction(null); setInputValue(''); fetchMasterData(true);
    } catch {}
  };

  const handleDelete = async (level, value) => {
    if (!window.confirm('Delete this item and all linked records?')) return;
    const payload = level === 'group' ? { 'Group Head': value } : 
                   level === 'expense' ? { 'Group Head': selectedGroup, 'Expense Head': value } : 
                   level === 'sub' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Sub Head': value } :
                   level === 'vendor' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Vendore': value } :
                   { 'Branch': value };
    try { await callApi('deleteMaster', payload); toast.success('Deleted'); fetchMasterData(true); } catch {}
  };

  const clearFilters = () => { setSelectedGroup(null); setSelectedExpense(null); };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2">
      
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Head Master</h1>
          <p className="text-sm text-slate-500">Full hierarchical control of transaction categories</p>
        </div>
        <div className="flex gap-3">
          {(selectedGroup || selectedExpense) && (
            <button onClick={clearFilters} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-200 shadow-sm border border-slate-200">
              <FilterX size={12} /> Clear Filter
            </button>
          )}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-3 py-1.5 min-w-[200px]">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Search across all levels..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-xs font-medium text-slate-700 bg-transparent outline-none w-full" />
          </div>
          <button onClick={() => fetchMasterData()} className="p-2 bg-white border border-slate-300 rounded-md text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCcw size={18} className={fetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Columns Grid - Industrial Flat UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Level 1: Groups */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[500px] shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Group Heads</span>
            </div>
            <button 
              onClick={() => { setActiveAction({type:'add', level:'group'}); setInputValue(''); }} 
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'group' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded bg-blue-50/50 flex gap-1">
                <input 
                  disabled={saving} 
                  autoFocus 
                  value={inputValue} 
                  onChange={e => setInputValue(e.target.value)} 
                  className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-500 bg-white" 
                  placeholder="New..." 
                />
                <button onClick={handleCommit} className="p-1 bg-blue-600 text-white rounded shadow-sm"><Check size={14}/></button>
                <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400"><X size={14}/></button>
              </div>
            )}
            {groupHeads.map(g => (
              <div 
                key={g} 
                onClick={() => {setSelectedGroup(g);}} 
                className={`group flex items-center justify-between px-3 py-2 rounded transition-all cursor-pointer border ${
                  selectedGroup === g 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-semibold truncate flex-1">{g}</span>
                <div className={`flex gap-0.5 transition-all ${selectedGroup === g ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button onClick={(e) => {e.stopPropagation(); setActiveAction({type:'edit', level:'group', oldValue:g}); setInputValue(g);}} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit2 size={12}/></button>
                  <button onClick={(e) => {e.stopPropagation(); handleDelete('group', g);}} className="p-1 hover:bg-rose-100 rounded text-rose-600"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 2: Expenses */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[500px] shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Box size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Expense Heads</span>
            </div>
            <button 
              disabled={!selectedGroup}
              onClick={() => { setActiveAction({type:'add', level:'expense'}); setInputValue(''); }} 
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'expense' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded bg-blue-50/50 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-500 bg-white" placeholder="New..." />
                <button onClick={handleCommit} className="p-1 bg-blue-600 text-white rounded shadow-sm"><Check size={14}/></button>
                <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400"><X size={14}/></button>
              </div>
            )}
            {expenseHeads.map(e => (
              <div 
                key={e} 
                onClick={() => setSelectedExpense(e)} 
                className={`group flex items-center justify-between px-3 py-2 rounded transition-all cursor-pointer border ${
                  selectedExpense === e 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-semibold truncate flex-1">{e}</span>
                <div className={`flex gap-0.5 transition-all ${selectedExpense === e ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button onClick={(ev) => {ev.stopPropagation(); setActiveAction({type:'edit', level:'expense', oldValue:e}); setInputValue(e);}} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit2 size={12}/></button>
                  <button onClick={(ev) => {ev.stopPropagation(); handleDelete('expense', e);}} className="p-1 hover:bg-rose-100 rounded text-rose-600"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 3: Sub Heads */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[500px] shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Subtitles size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Sub Heads</span>
            </div>
            <button 
              disabled={!selectedExpense}
              onClick={() => { setActiveAction({type:'add', level:'sub'}); setInputValue(''); }} 
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'sub' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded bg-blue-50/50 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-500 bg-white" placeholder="New..." />
                <button onClick={handleCommit} className="p-1 bg-blue-600 text-white rounded shadow-sm"><Check size={14}/></button>
                <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400"><X size={14}/></button>
              </div>
            )}
            {subHeads.map(s => (
              <div 
                key={s} 
                className={`group flex items-center justify-between px-3 py-2 rounded transition-all border bg-white border-transparent text-slate-600 hover:bg-slate-50`}
              >
                <span className="text-xs font-semibold truncate flex-1">{s}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => {setActiveAction({type:'edit', level:'sub', oldValue:s}); setInputValue(s);}} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"><Edit2 size={12}/></button>
                  <button onClick={() => handleDelete('sub', s)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 4: Vendors */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[500px] shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Vendore</span>
            </div>
            <button 
              disabled={!selectedExpense}
              onClick={() => { setActiveAction({type:'add', level:'vendor'}); setInputValue(''); }} 
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'vendor' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded bg-blue-50/50 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-500 bg-white" placeholder="New..." />
                <button onClick={handleCommit} className="p-1 bg-blue-600 text-white rounded shadow-sm"><Check size={14}/></button>
                <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400"><X size={14}/></button>
              </div>
            )}
            {vendors.map(v => (
              <div key={v} className="group flex items-center justify-between px-3 py-2 rounded transition-all border bg-white border-transparent text-slate-600 hover:bg-slate-50">
                <span className="text-xs font-semibold truncate flex-1">{v}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => {setActiveAction({type:'edit', level:'vendor', oldValue:v}); setInputValue(v);}} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"><Edit2 size={12}/></button>
                  <button onClick={() => handleDelete('vendor', v)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 5: Branches */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[500px] shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Branches</span>
            </div>
            <button 
              onClick={() => { setActiveAction({type:'add', level:'branch'}); setInputValue(''); }} 
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'branch' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded bg-blue-50/50 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 outline-none focus:border-blue-500 bg-white" placeholder="New..." />
                <button onClick={handleCommit} className="p-1 bg-blue-600 text-white rounded shadow-sm"><Check size={14}/></button>
                <button onClick={() => setActiveAction(null)} className="p-1 text-slate-400"><X size={14}/></button>
              </div>
            )}
            {branchesMaster.map(b => (
              <div key={b} className="group flex items-center justify-between px-3 py-2 rounded transition-all border bg-white border-transparent text-slate-600 hover:bg-slate-50">
                <span className="text-xs font-semibold truncate flex-1">{b}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => {setActiveAction({type:'edit', level:'branch', oldValue:b}); setInputValue(b);}} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"><Edit2 size={12}/></button>
                  <button onClick={() => handleDelete('branch', b)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {saving && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Syncing Master...</span>
        </div>
      )}
    </div>
  );
}
