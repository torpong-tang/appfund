"use client";
import Modal from "./Modal";

// Shared modal for recording an income ("receive") or expense ("spend") transaction.
// The two flows are identical apart from these per-type details.
const CONFIG = {
  receive: {
    title: "บันทึกรับเงินโอน",
    memberPlaceholder: "เลือกสมาชิก...",
    filterMembers: () => true,
    amountColor: "text-emerald-400",
    uploadLabel: "คลิกเพื่ออัพโหลดสลิป",
    submitLabel: "บันทึก",
    submitColor: "bg-emerald-600",
    glow: "glow-emerald",
  },
  spend: {
    title: "บันทึกรายการจ่ายเงิน",
    memberPlaceholder: "เลือกผู้ทำรายการ...",
    filterMembers: (m) => m.canSpend,
    amountColor: "text-red-400",
    uploadLabel: "คลิกเพื่ออัพโหลดหลักฐาน",
    submitLabel: "บันทึกรายจ่าย",
    submitColor: "bg-red-600",
    glow: "glow-rose",
  },
};

export default function TransactionModal({ type, isOpen, onClose, members, formData, setFormData, onFileChange, onSubmit, currentUser }) {
  const cfg = CONFIG[type];
  const performerName = currentUser?.name || currentUser?.email || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cfg.title}>
      <div className="flex flex-col gap-4">
        {type === 'spend' ? (
          // The person spending is the logged-in admin — shown read-only, not selectable.
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">ผู้ทำรายการ</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><i className="fas fa-user-shield"></i></span>
              <input
                type="text"
                readOnly
                value={performerName}
                className="w-full p-3 pl-10 rounded-xl border border-white/20 glass-input cursor-default opacity-90"
              />
            </div>
          </div>
        ) : (
          <select
            className="w-full p-3 rounded-xl border border-white/20 glass-input"
            value={formData.memberId}
            onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
          >
            <option value="" className="bg-indigo-950 text-white">{cfg.memberPlaceholder}</option>
            {members.filter(cfg.filterMembers).map((m) => (
              <option key={m.id} value={m.id} className="bg-indigo-950 text-white">{m.name}</option>
            ))}
          </select>
        )}
        <input
          type="number"
          placeholder="จำนวนเงิน (บาท)"
          className={`w-full p-4 text-2xl font-black text-right ${cfg.amountColor} border border-white/20 rounded-xl glass-input`}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
        <div className="border-2 border-dashed border-white/20 p-4 rounded-xl text-center bg-white/5 cursor-pointer relative">
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFileChange} />
          {formData.slip ? (
            <img src={formData.slip} className="h-40 mx-auto object-contain" alt="Slip" />
          ) : (
            <span className="text-slate-400 text-sm">{cfg.uploadLabel}</span>
          )}
        </div>
        <textarea
          placeholder="หมายเหตุ..."
          rows="2"
          className="w-full p-3 rounded-xl border border-white/20 glass-input"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        />
        <button onClick={onSubmit} className={`cursor-pointer ${cfg.glow} w-full py-4 ${cfg.submitColor} text-white font-black rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2 transition-all duration-300`}>
          <i className="fas fa-floppy-disk"></i> {cfg.submitLabel}
        </button>
      </div>
    </Modal>
  );
}
