import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit2, X, Check, RefreshCcw,
  Layers, Box, Subtitles, Search, Loader2, FilterX
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
          'Vendor': String(r['Vendor'] || r['Vendors'] || '').trim(),
        })).filter(r => r['Group Head'] || r['Expense Head'] || r['Sub Head'] || r['Vendor']);
        setMasterData(formatted);
      }
    } catch { toast.error('Error loading Master data'); } finally { if (!silent) setFetching(false); }
  }, []);

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);

  // Logic: If a group is selected, filter expenses. If an expense is selected, filter subs.
  // BUT: Show all unique items in each column if no parent is selected.
  
  const groupHeads = useMemo(() => {
    return [...new Set(masterData.map(d => d['Group Head']).filter(Boolean))]
      .filter(gh => gh.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, searchTerm]);

  const expenseHeads = useMemo(() => {
    let base = masterData;
    if (selectedGroup) {
      base = base.filter(d => d['Group Head'] === selectedGroup);
    }
    return [...new Set(base.map(d => d['Expense Head']).filter(Boolean))]
      .filter(eh => eh.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, selectedGroup, searchTerm]);

  const subHeads = useMemo(() => {
    let base = masterData;
    if (selectedGroup) base = base.filter(d => d['Group Head'] === selectedGroup);
    if (selectedExpense) base = base.filter(d => d['Expense Head'] === selectedExpense);
    return [...new Set(base.map(d => d['Sub Head']).filter(Boolean))]
      .filter(sh => sh.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, selectedGroup, selectedExpense, searchTerm]);

  const vendors = useMemo(() => {
    let base = masterData;
    if (selectedGroup) base = base.filter(d => d['Group Head'] === selectedGroup);
    if (selectedExpense) base = base.filter(d => d['Expense Head'] === selectedExpense);
    return [...new Set(base.map(d => d['Vendor']).filter(Boolean))]
      .filter(v => v.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [masterData, selectedGroup, selectedExpense, searchTerm]);

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
        const payload = activeAction.level === 'group' ? { 'Group Head': val, 'Expense Head': '', 'Sub Head': '', 'Vendor': '' } :
                        activeAction.level === 'expense' ? { 'Group Head': selectedGroup || '', 'Expense Head': val, 'Sub Head': '', 'Vendor': '' } :
                        activeAction.level === 'sub' ? { 'Group Head': selectedGroup || '', 'Expense Head': selectedExpense || '', 'Sub Head': val, 'Vendor': '' } :
                        { 'Group Head': selectedGroup || '', 'Expense Head': selectedExpense || '', 'Sub Head': '', 'Vendor': val };
        await callApi('createMaster', payload);
      } else {
        const { level, oldValue } = activeAction;
        const oldV = level === 'group' ? { 'Group Head': oldValue } : 
                    level === 'expense' ? { 'Group Head': selectedGroup, 'Expense Head': oldValue } : 
                    level === 'sub' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Sub Head': oldValue } :
                    { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Vendor': oldValue };
        
        const newV = level === 'group' ? { 'Group Head': val } : 
                    level === 'expense' ? { 'Group Head': selectedGroup, 'Expense Head': val } : 
                    level === 'sub' ? { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Sub Head': val } :
                    { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Vendor': val };
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
                   { 'Group Head': selectedGroup, 'Expense Head': selectedExpense, 'Vendor': value };
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

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Level 1: Groups */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[550px] shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-blue-600" />
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Group Heads</span>
            </div>
            <button onClick={() => { setActiveAction({type:'add', level:'group'}); setInputValue(''); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'group' && activeAction.type === 'add' && (
               <div className="p-2 border border-blue-200 rounded-md bg-blue-50/30 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" placeholder="New Group..." />
                <button disabled={saving} onClick={handleCommit} className="p-1.5 bg-blue-600 text-white rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                <button disabled={saving} onClick={() => setActiveAction(null)} className="p-1.5 text-slate-400 disabled:opacity-50"><X size={14}/></button>
               </div>
            )}
            {groupHeads.map(gh => (
              <div key={gh} onClick={() => {setSelectedGroup(selectedGroup === gh ? null : gh); setSelectedExpense(null);}} className={`group flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-all ${selectedGroup === gh ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}`}>
                <span className="text-xs font-bold">{gh}</span>
                <div className={`flex gap-1 ${selectedGroup === gh ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button onClick={e => {e.stopPropagation(); setActiveAction({type:'edit', level:'group', oldValue:gh}); setInputValue(gh);}} className="p-1 hover:bg-white/10 rounded"><Edit2 size={12}/></button>
                  <button onClick={e => {e.stopPropagation(); handleDelete('group', gh);}} className="p-1 hover:bg-rose-500 rounded"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 2: Expense Heads */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[550px] shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Box size={14} className="text-blue-600" />
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Expense Heads</span>
            </div>
            <button onClick={() => { setActiveAction({type:'add', level:'expense'}); setInputValue(''); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'expense' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded-md bg-blue-50/30 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" placeholder="New Expense..." />
                <button disabled={saving} onClick={handleCommit} className="p-1.5 bg-blue-600 text-white rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                <button disabled={saving} onClick={() => setActiveAction(null)} className="p-1.5 text-slate-400 disabled:opacity-50"><X size={14}/></button>
              </div>
            )}
            {expenseHeads.map(eh => (
              <div key={eh} onClick={() => setSelectedExpense(selectedExpense === eh ? null : eh)} className={`group flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-all ${selectedExpense === eh ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}`}>
                <span className="text-xs font-bold">{eh}</span>
                <div className={`flex gap-1 ${selectedExpense === eh ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button onClick={e => {e.stopPropagation(); setActiveAction({type:'edit', level:'expense', oldValue:eh}); setInputValue(eh);}} className="p-1 hover:bg-white/10 rounded"><Edit2 size={12}/></button>
                  <button onClick={e => {e.stopPropagation(); handleDelete('expense', eh);}} className="p-1 hover:bg-rose-500 rounded"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 3: Sub Heads */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[550px] shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <Subtitles size={14} className="text-blue-600" />
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Sub Heads</span>
            </div>
            <button onClick={() => { setActiveAction({type:'add', level:'sub'}); setInputValue(''); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'sub' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded-md bg-blue-50/30 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" placeholder="New Sub..." />
                <button disabled={saving} onClick={handleCommit} className="p-1.5 bg-blue-600 text-white rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                <button disabled={saving} onClick={() => setActiveAction(null)} className="p-1.5 text-slate-400 disabled:opacity-50"><X size={14}/></button>
              </div>
            )}
            {subHeads.map(sh => (
              <div key={sh} className="group flex items-center justify-between px-4 py-3 rounded-md transition-all hover:bg-slate-50 text-slate-700 border border-transparent">
                <span className="text-xs font-bold">{sh}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {setActiveAction({type:'edit', level:'sub', oldValue:sh}); setInputValue(sh);}} className="p-1 hover:bg-indigo-50 text-indigo-600 rounded"><Edit2 size={12}/></button>
                  <button onClick={() => handleDelete('sub', sh)} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level 4: Vendors */}
        <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-[550px] shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <User size={14} className="text-blue-600" />
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Vendors</span>
            </div>
            <button onClick={() => { setActiveAction({type:'add', level:'vendor'}); setInputValue(''); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeAction?.level === 'vendor' && activeAction.type === 'add' && (
              <div className="p-2 border border-blue-200 rounded-md bg-blue-50/30 flex gap-1">
                <input disabled={saving} autoFocus value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" placeholder="New Vendor..." />
                <button disabled={saving} onClick={handleCommit} className="p-1.5 bg-blue-600 text-white rounded shadow-sm disabled:opacity-50"><Check size={14}/></button>
                <button disabled={saving} onClick={() => setActiveAction(null)} className="p-1.5 text-slate-400 disabled:opacity-50"><X size={14}/></button>
              </div>
            )}
            {vendors.map(v => (
              <div key={v} className="group flex items-center justify-between px-4 py-3 rounded-md transition-all hover:bg-slate-50 text-slate-700 border border-transparent">
                <span className="text-xs font-bold">{v}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {setActiveAction({type:'edit', level:'vendor', oldValue:v}); setInputValue(v);}} className="p-1 hover:bg-blue-50 text-blue-600 rounded"><Edit2 size={12}/></button>
                  <button onClick={() => handleDelete('vendor', v)} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 size={12}/></button>
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
