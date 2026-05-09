import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Check, X, Pause, Trash2, RotateCcw, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCcw, User, Building2
} from 'lucide-react';
import { formatCurrency, formatDate, getGoogleSheetTimestamp } from '../utils/helpers';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;

const EXPENSE_TABS = [
  { key: 'pending',  label: 'Pending',  color: 'amber'   },
  { key: 'hold',     label: 'Hold',     color: 'orange'  },
  { key: 'rejected', label: 'Rejected', color: 'rose'    },
  { key: 'history',  label: 'History',  color: 'slate'   },
];

const DELETE_TABS = [
  { key: 'delete-pending', label: 'Pending Delete', color: 'rose'  },
  { key: 'deleted',        label: 'Deleted History', color: 'slate' },
];

export default function ApprovalPanel() {
  const [mainTab,    setMainTab]    = useState('expense');   
  const [expenseTab, setExpenseTab] = useState('pending');
  const [deleteTab,  setDeleteTab]  = useState('delete-pending');

  const [records,  setRecords]  = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionType, setActionType]   = useState('');
  const [remark,    setRemark]    = useState('');

  const fetchRecords = async () => {
    try {
      setFetching(true);
      const res  = await fetch(APPSCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'read' }) });
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
    } catch { toast.error('Connection error'); }
    finally   { setFetching(false); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const expenseCounts = {
    pending:  records.filter(r => r.Status === 'PENDING' && r['Delete Status'] !== 'DELETED' && r.Flow !== 'IN').length,
    hold:     records.filter(r => r.Status === 'HOLD' && r['Delete Status'] !== 'DELETED' && r.Flow !== 'IN').length,
    rejected: records.filter(r => r.Status === 'REJECTED' && r['Delete Status'] !== 'DELETED' && r.Flow !== 'IN').length,
    history:  records.filter(r => r.Status === 'APPROVED' && r['Delete Status'] !== 'DELETED' && r.Flow !== 'IN').length,
  };

  const deleteCounts = {
    'delete-pending': records.filter(r => r['Delete Status'] === 'PENDING_DELETE').length,
    'deleted':        records.filter(r => r['Delete Status'] === 'DELETED').length,
  };

  const filteredRecords = records.filter(r => {
    if (mainTab === 'expense') {
      if (r['Delete Status'] === 'DELETED') return false;
      if (r.Flow === 'IN') return false; 
      if (expenseTab === 'pending')  return r.Status === 'PENDING';
      if (expenseTab === 'hold')     return r.Status === 'HOLD';
      if (expenseTab === 'rejected') return r.Status === 'REJECTED';
      if (expenseTab === 'history')  return r.Status === 'APPROVED';
    } else {
      if (deleteTab === 'delete-pending') return r['Delete Status'] === 'PENDING_DELETE';
      if (deleteTab === 'deleted')        return r['Delete Status'] === 'DELETED';
    }
    return false;
  });

  const handleAction = async (record, status, customRemark = '') => {
    try {
      toast.loading('Processing...', { id: 'act' });
      let dStatus = record['Delete Status'];
      if (status === 'DELETED') dStatus = 'DELETED';
      if (status === 'RESTORE') dStatus = 'ACTIVE';
      
      const payload = {
        action:'update', sn:record.SN, status: (status==='DELETED'||status==='RESTORE')?record.Status:status,
        remark:customRemark||remark, timestamp:getGoogleSheetTimestamp(), deleteStatus:dStatus, isDeleteAction: status==='DELETED'
      };
      const res = await fetch(APPSCRIPT_URL, { method:'POST', body:JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error();
      toast.success('Done', { id:'act' }); setShowModal(false); fetchRecords();
    } catch { toast.error('Action failed', { id:'act' }); }
  };

  const openModal = (record, type) => { setSelectedRecord(record); setActionType(type); setRemark(''); setShowModal(true); };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2">
      
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approval Panel</h1>
          <p className="text-sm text-slate-500">Review and authorize cash transactions</p>
        </div>
        <button onClick={fetchRecords} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
          <RefreshCcw size={16} /> Sync Data
        </button>
      </div>

      {/* Main Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
        <button onClick={() => setMainTab('expense')} className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mainTab === 'expense' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <ShieldCheck size={16} /> Expense Approval {expenseCounts.pending > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{expenseCounts.pending}</span>}
        </button>
        <button onClick={() => setMainTab('delete')} className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mainTab === 'delete' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <ShieldAlert size={16} /> Delete Approval {deleteCounts['delete-pending'] > 0 && <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{deleteCounts['delete-pending']}</span>}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(mainTab === 'expense' ? EXPENSE_TABS : DELETE_TABS).map(tab => {
          const isActive = (mainTab === 'expense' ? expenseTab : deleteTab) === tab.key;
          return (
            <button key={tab.key} onClick={() => mainTab === 'expense' ? setExpenseTab(tab.key) : setDeleteTab(tab.key)} className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab.label} ({(mainTab === 'expense' ? expenseCounts : deleteCounts)[tab.key]})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {fetching ? (
          <div className="py-20 flex justify-center"><RefreshCcw className="animate-spin text-slate-300" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium italic">No pending requests in this category</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-3 font-bold">Voucher</th>
                  <th className="px-6 py-3 font-bold">Date</th>
                  <th className="px-6 py-3 font-bold">Category Hierarchy</th>
                  <th className="px-6 py-3 font-bold">Paid To / Description</th>
                  <th className="px-6 py-3 font-bold">By (User / Branch)</th>
                  <th className="px-6 py-3 font-bold text-right">Amount / Mode</th>
                  {(expenseTab === 'history' || deleteTab === 'deleted') ? (
                    <th className="px-6 py-3 font-bold text-center">Status</th>
                  ) : (
                    <th className="px-6 py-3 font-bold text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r, idx) => {
                  const year = r.Date ? String(r.Date).substring(0, 4) : '';
                  const sn = String(r.SN || '').padStart(3, '0');
                  const voucher = `VCH-${year}-${sn}`;
                  const isHistory = (expenseTab === 'history' || deleteTab === 'deleted');
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-indigo-700 text-xs">{voucher}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(r.Date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[11px] uppercase">{r['Group Head']}</span>
                          <span className="text-[10px] text-slate-400">{r['Expense Head']} / {r['Sub Head']}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs truncate">{r['Paid To']}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{r['Description / Reason']}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 font-bold text-slate-600 text-xs"><User size={10}/>{r['user']}</span>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><Building2 size={10}/>{r['Branch']}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900">{formatCurrency(r['Amount (INR)'])}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{r['Payment mode']}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {isHistory ? (
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${r.Status==='APPROVED'?'bg-emerald-50 border-emerald-100 text-emerald-600':'bg-rose-50 border-rose-100 text-rose-600'}`}>{r.Status}</span>
                          ) : mainTab === 'expense' ? (
                            <>
                              <button onClick={() => handleAction(r, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"><Check size={14} /></button>
                              <button onClick={() => openModal(r, 'REJECT')} className="p-1.5 bg-rose-50 text-rose-600 rounded border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"><X size={14} /></button>
                              <button onClick={() => openModal(r, 'HOLD')} className="p-1.5 bg-amber-50 text-amber-600 rounded border border-amber-100 hover:bg-amber-600 hover:text-white transition-all"><Pause size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openModal(r, 'DELETED')} className="p-1.5 bg-rose-50 text-rose-600 rounded border border-rose-100 hover:bg-rose-600 hover:text-white transition-all" title="Approve Delete"><Trash2 size={14} /></button>
                              <button onClick={() => handleAction(r, 'RESTORE')} className="p-1.5 bg-slate-50 text-slate-600 rounded border border-slate-200 hover:bg-slate-800 hover:text-white transition-all" title="Restore"><RotateCcw size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-900">
              {actionType === 'DELETED' ? 'Confirm Deletion' : `${actionType} Request`}
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Provide a remark for this action. This will be visible in the audit history.</p>
              <textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Enter remark..." className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-indigo-500 text-sm font-medium resize-none" rows="3" />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => handleAction(selectedRecord, actionType)} className={`flex-1 text-white py-2 rounded font-bold text-sm transition-all ${actionType==='REJECT'||actionType==='DELETED'?'bg-rose-600 hover:bg-rose-700':'bg-indigo-600 hover:bg-indigo-700'}`}>Confirm Action</button>
              <button onClick={() => setShowModal(false)} className="px-6 bg-white border border-slate-300 text-slate-500 py-2 rounded font-bold text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
