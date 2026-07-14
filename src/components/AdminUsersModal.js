"use client";
import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { api, apiJson } from '@/lib/api';

export default function AdminUsersModal({ isOpen, onClose, currentUserId, showToast }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', name: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiJson('/api/admins');
      setAdmins(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      load();
      setShowAdd(false);
      setAddForm({ email: '', name: '', password: '' });
      setResetId(null);
      setResetPw('');
    }
  }, [isOpen]);

  const addAdmin = async () => {
    try {
      const res = await fetch(api('/api/admins'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เพิ่มไม่สำเร็จ');
      showToast('เพิ่มผู้ดูแลสำเร็จ');
      setShowAdd(false);
      setAddForm({ email: '', name: '', password: '' });
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const resetPassword = async (id) => {
    try {
      const res = await fetch(api(`/api/admins/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ตั้งรหัสผ่านไม่สำเร็จ');
      showToast('ตั้งรหัสผ่านใหม่สำเร็จ');
      setResetId(null);
      setResetPw('');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const deleteAdmin = async (id, email) => {
    if (!confirm(`ลบผู้ดูแล ${email}?`)) return;
    try {
      const res = await fetch(api(`/api/admins/${id}`), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');
      showToast('ลบผู้ดูแลสำเร็จ');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="จัดการผู้ดูแลระบบ" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-300">ผู้ดูแลทั้งหมด {admins.length} คน</p>
          <button
            onClick={() => setShowAdd(s => !s)}
            className="cursor-pointer glow-teal flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold shadow-lg transition-all duration-300"
          >
            <UserPlus size={16} /> เพิ่มผู้ดูแล
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <input type="email" placeholder="อีเมล" className="glass-input w-full p-2.5 rounded-xl"
              value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
            <input type="text" placeholder="ชื่อ (ถ้ามี)" className="glass-input w-full p-2.5 rounded-xl"
              value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
                className="glass-input w-full p-2.5 pr-11 rounded-xl"
                value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button onClick={addAdmin} className="cursor-pointer glow-teal py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-user-plus"></i> บันทึกผู้ดูแลใหม่</button>
          </div>
        )}

        {/* List */}
        <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <p className="text-center text-slate-400 py-6">กำลังโหลด...</p>
          ) : admins.map(a => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-200 flex items-center justify-center shrink-0"><ShieldCheck size={18} /></div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{a.name || '(ไม่มีชื่อ)'} {a.id === currentUserId && <span className="text-xs text-emerald-300">(คุณ)</span>}</p>
                    <p className="text-xs text-slate-400 truncate">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setResetId(resetId === a.id ? null : a.id); setResetPw(''); }}
                    title="ตั้งรหัสผ่านใหม่"
                    className="cursor-pointer w-9 h-9 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition"><KeyRound size={16} /></button>
                  {a.id !== currentUserId && (
                    <button onClick={() => deleteAdmin(a.id, a.email)} title="ลบ"
                      className="cursor-pointer w-9 h-9 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-300 flex items-center justify-center transition"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
              {resetId === a.id && (
                <div className="mt-3 flex gap-2">
                  <input type="text" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)" className="glass-input flex-1 p-2.5 rounded-xl text-sm"
                    value={resetPw} onChange={e => setResetPw(e.target.value)} />
                  <button onClick={() => resetPassword(a.id)} className="cursor-pointer glow-amber px-4 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-500 transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-key"></i> ตั้งรหัส</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
