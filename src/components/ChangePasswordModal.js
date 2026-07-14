"use client";
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from './Modal';
import { api } from '@/lib/api';

export default function ChangePasswordModal({ isOpen, onClose, showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false });

  useEffect(() => {
    if (isOpen) { setForm({ currentPassword: '', newPassword: '', confirm: '' }); setShow({ current: false, next: false }); }
  }, [isOpen]);

  const submit = async () => {
    if (form.newPassword.length < 8) return showToast('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
    if (form.newPassword !== form.confirm) return showToast('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน', 'error');
    try {
      const res = await fetch(api('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      showToast('เปลี่ยนรหัสผ่านสำเร็จ');
      onClose();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const field = (label, key, showKey) => (
    <div>
      <label className="block text-sm text-slate-300 mb-2 font-bold">{label}</label>
      <div className="relative">
        <input
          type={showKey && show[showKey] ? 'text' : 'password'}
          className="glass-input w-full p-3 pr-11 rounded-xl"
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
        />
        {showKey && (
          <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer">
            {show[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="เปลี่ยนรหัสผ่าน" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        {field('รหัสผ่านปัจจุบัน', 'currentPassword', 'current')}
        {field('รหัสผ่านใหม่', 'newPassword', 'next')}
        {field('ยืนยันรหัสผ่านใหม่', 'confirm', null)}
        <button onClick={submit} className="cursor-pointer glow-violet mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
          <i className="fas fa-floppy-disk"></i> บันทึกรหัสผ่านใหม่
        </button>
      </div>
    </Modal>
  );
}
