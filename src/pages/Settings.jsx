import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Trash2, Edit2, Plus, Search, Eye, EyeOff, X,
  RefreshCw, Loader2, Users, UserCheck, UserPlus,
  ShieldCheck, MapPin, Building2
} from 'lucide-react';
import { getAuthUser } from '../utils/storageManager';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;

const branches = [
  'Head Office', 'Mumbai Branch', 'Delhi Branch', 'Bangalore Branch',
  'Chennai Branch', 'Hyderabad Branch', 'Kolkata Branch', 'Pune Branch'
];

const departments = [
  'Accounts', 'Sales', 'Operations', 'HR', 'IT', 'Marketing', 'Admin', 'Finance'
];

const availablePages = [
  'Dashboard', 'Entry', 'Approval Panel', 'Expense List',
  'Petty Cash', 'Reports', 'Head Master', 'Settings'
];

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '', id: '', password: '', role: 'USER',
    branch: 'Head Office', department: 'Accounts', pageAccess: []
  });

  const fetchUsers = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch(APPSCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'readSetting' }) });
      const json = await res.json();
      if (json.success) {
        const mapped = (json.data || []).map(row => ({
          name: row['user'] || '', id: row['user name'] || '', password: row['password'] || '',
          role: (row['role'] || 'USER').toUpperCase(), branch: row['branch'] || 'Head Office',
          department: row['department'] || 'Accounts',
          pageAccess: row['Page access'] ? row['Page access'].split(',').map(s => s.trim()) : []
        })).filter(u => u.id);
        setUsers(mapped);
      }
    } catch { toast.error('Error loading user data'); } finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchUsers(); setAuthUser(getAuthUser()); }, [fetchUsers]);

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.id?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.id || !newUser.password) return toast.error('Fill required fields');
    setSubmitting(true);
    const toastId = toast.loading('Saving...');
    try {
      const payload = { 'user': newUser.name, 'user name': newUser.id, 'password': newUser.password, 'role': newUser.role, 'branch': newUser.branch, 'department': newUser.department, 'Page access': newUser.pageAccess.join(',') };
      let res;
      if (editingUserId) {
        res = await fetch(APPSCRIPT_URL, { method:'POST', body:JSON.stringify({ action:'updateSetting', data: { oldValue: {'user name': editingUserId}, newValue: payload }})});
      } else {
        if (users.some(u => u.id === newUser.id)) { toast.error('Username exists', { id: toastId }); return; }
        res = await fetch(APPSCRIPT_URL, { method:'POST', body:JSON.stringify({ action:'createSetting', data: payload })});
      }
      const json = await res.json();
      if (json.success) { toast.success('User updated', { id: toastId }); setIsModalOpen(false); fetchUsers(); }
    } catch { toast.error('Save failed', { id: toastId }); } finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Permanently remove this user?')) return;
    setDeletingId(userId);
    try {
      const res = await fetch(APPSCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteSetting', data: { 'user name': userId } })});
      const json = await res.json();
      if (json.success) { toast.success('User removed'); fetchUsers(); }
    } catch { toast.error('Delete failed'); } finally { setDeletingId(null); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2">
      
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage user access and system permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="p-2 bg-white border border-slate-300 rounded-md text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={18} className={fetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setEditingUserId(null); setNewUser({name:'', id:'', password:'', role:'USER', branch:'Head Office', department:'Accounts', pageAccess:[]}); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-bold hover:bg-slate-800 shadow-sm flex items-center gap-2">
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Administrators</p>
          <p className="text-xl font-bold text-blue-600">{users.filter(u=>u.role==='ADMIN').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Branches</p>
          <p className="text-xl font-bold text-emerald-600">{branches.length}</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search size={14} className="text-slate-400" />
          <input type="text" placeholder="Search by name or username..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="text-xs font-medium text-slate-700 bg-transparent outline-none w-full" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-3 font-bold">User</th>
                <th className="px-6 py-3 font-bold">Username</th>
                <th className="px-6 py-3 font-bold">Role</th>
                <th className="px-6 py-3 font-bold">Branch / Dept</th>
                <th className="px-6 py-3 font-bold">Access</th>
                <th className="px-6 py-3 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">{u.name.charAt(0)}</div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-blue-600">@{u.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${u.role==='ADMIN'?'bg-blue-50 border-blue-100 text-blue-600':'bg-slate-50 border-slate-200 text-slate-500'}`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-[11px]">{u.branch}</span>
                      <span className="text-[10px] text-slate-400">{u.department}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.pageAccess.slice(0,3).map(p=><span key={p} className="text-[9px] px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-400">{p}</span>)}
                      {u.pageAccess.length > 3 && <span className="text-[9px] text-slate-300">+{u.pageAccess.length - 3} more</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={()=> { setEditingUserId(u.id); setNewUser(u); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14}/></button>
                      <button onClick={()=> handleDeleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">{editingUserId ? 'Edit User' : 'Register New User'}</h2>
              <button onClick={()=> setIsModalOpen(false)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
                  <input disabled={!!editingUserId} value={newUser.id} onChange={e=>setNewUser({...newUser, id:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none disabled:bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                  <button onClick={()=> setShowPassword(!showPassword)} className="absolute right-3 top-2 text-slate-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role</label>
                  <select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none">
                    <option value="USER">Standard User</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Branch</label>
                  <select value={newUser.branch} onChange={e=>setNewUser({...newUser, branch:e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none">
                    {branches.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Module Access</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {availablePages.map(page => (
                    <label key={page} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-all ${newUser.pageAccess.includes(page) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                      <input type="checkbox" className="hidden" checked={newUser.pageAccess.includes(page)} onChange={()=>{
                        const upd = newUser.pageAccess.includes(page) ? newUser.pageAccess.filter(p=>p!==page) : [...newUser.pageAccess, page];
                        setNewUser({...newUser, pageAccess: upd});
                      }} />
                      <span className="text-[11px] font-bold">{page}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={handleSaveUser} disabled={submitting} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold text-sm hover:bg-slate-800 disabled:opacity-50">Save Changes</button>
              <button onClick={()=> setIsModalOpen(false)} className="px-6 bg-white border border-slate-300 text-slate-500 py-2 rounded font-bold text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
