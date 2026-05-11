import React from 'react';
import { User, Shield, MapPin, Building2, Lock, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user } = useAuthStore();

  if (!user) return null;

  const infoFields = [
    { label: 'Full Name', value: user.name, icon: <User className="text-slate-400" size={16} /> },
    { label: 'Employee ID', value: user.id, icon: <Lock className="text-slate-400" size={16} /> },
    { label: 'Access Level', value: user.role, icon: <Shield className="text-slate-400" size={16} />, highlight: true },
    { label: 'Current Branch', value: user.branch || 'Head Office', icon: <MapPin className="text-slate-400" size={16} /> },
    { label: 'Department', value: user.department || 'Management', icon: <Building2 className="text-slate-400" size={16} /> },
    { label: 'Reporting Authority', value: user.reportedBy || 'Super Admin', icon: <UserCheck className="text-slate-400" size={16} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 font-sans">
      
      {/* Refined Header Section */}
      <div className="bg-white border-b border-slate-200 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
            <User size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {user.role}
              </span>
              <span className="text-[10px] font-medium text-slate-400 border-l border-slate-200 pl-2">
                System Identity: {user.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {infoFields.map((field, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-[0.1em]">{field.label}</p>
                <p className={`text-sm font-semibold ${field.highlight ? 'text-blue-600' : 'text-slate-800'}`}>
                  {field.value}
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                {field.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subtle Information Note */}
      <div className="pt-4 border-t border-slate-100 mt-8">
        <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl italic">
          * Account configuration is managed by the central administration. Roles and reporting hierarchies are locked to ensure system integrity. For modification requests, please contact your designated supervisor or the Super Admin.
        </p>
      </div>

      {/* Branding Footer */}
      <div className="pt-12 text-center opacity-40">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.5em]">
          Powered By Botivate
        </p>
      </div>

    </div>
  );
}
