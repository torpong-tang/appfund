
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function Dashboard() {
  const [stats, setStats] = useState({ income: 0, expense: 0, members: [] });
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);

  // Modals state
  const [modals, setModals] = useState({
    receive: false,
    spend: false,
    report: false,
    incomeDetail: false,
    breakdown: false,
    slip: false,
    deleteConfirm: false,
    deleteCode: false,
    ai: false,
    passcode: false
  });

  // Data for modals
  const [activeTx, setActiveTx] = useState(null);
  const [txToDelete, setTxToDelete] = useState(null);
  const [slipData, setSlipData] = useState(null);
  const [formData, setFormData] = useState({ memberId: '', amount: '', note: '', slip: null });
  const [filters, setFilters] = useState({ reportSearch: '', breakdownSearch: '', breakdownTier: null });
  const [toast, setToast] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Constants
  const INCOME_TARGET = 500000;
  const MASTER_DEL_PASS = "1234";

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const [statsRes, txRes, memRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/transactions'),
        fetch('/api/members')
      ]);
      const statsData = await statsRes.json();
      const txData = await txRes.json();
      const memData = await memRes.json();

      setStats(statsData);
      setTransactions(txData);
      setMembers(memData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers ---
  const toggleModal = (name, open = true) => {
    setModals(prev => ({ ...prev, [name]: open }));
    if (!open && name === 'slip') setSlipData(null);
  };

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  /* --- Utilities --- */
  const showModal = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("hidden");
      el.style.display = "flex";
    }
  };
  const hideModal = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
      el.style.display = "none";
    }
  };

  /* --- AI Analysis --- */
  const handleAIAnalysis = async () => {
    toggleModal('ai', true);
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        setAiResponse(`Error: ${data.error}`);
      } else {
        setAiResponse(data.analysis);
      }
    } catch (e) {
      setAiResponse("Connection Error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, slip: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Form Handlers ---
  const handleTxSubmit = async (type) => { // type: 'receive' | 'spend'
    if (!formData.memberId || !formData.amount || !formData.slip) {
      showToast("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }

    const memberName = members.find(m => m.id === parseInt(formData.memberId))?.name || "Unknown";
    const amount = parseFloat(formData.amount);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txId: 'TX' + Date.now().toString().slice(-6),
          memberName, // Simplified: storing name directly as per original schema
          income: type === 'receive' ? amount : 0,
          expense: type === 'spend' ? amount : 0, // Using same API route logic
          note: formData.note || (type === 'receive' ? 'รับสมทบ' : 'จ่ายห้อง'),
          slipUrl: formData.slip
        })
      });

      if (res.ok) {
        showToast("บันทึกสำเร็จ");
        toggleModal(type, false);
        setFormData({ memberId: '', amount: '', note: '', slip: null });
        fetchData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  };

  const prepareDelete = (tx) => {
    setTxToDelete(tx);
    toggleModal('slip', false);
    toggleModal('deleteConfirm', true);
  };

  const confirmDelete = async () => {
    // Check passcode in a real app would be better server-side or more secure, 
    // but replicating original client-side check for now
    const input = document.getElementById('del_pass_input')?.value;
    if (input === MASTER_DEL_PASS) {
      try {
        await fetch(`/api/transactions/${txToDelete.id}`, { method: 'DELETE' });
        showToast("ลบรายการสำเร็จ");
        toggleModal('deleteCode', false);
        setTxToDelete(null);
        fetchData();
      } catch (error) {
        showToast("ลบรายการล้มเหลว", "error");
      }
    } else {
      showToast("รหัสผ่านไม่ถูกต้อง", "error");
    }
  };

  // --- Stats Logic ---
  const incomePercent = Math.min(100, (stats.income / INCOME_TARGET) * 100).toFixed(1);

  // Categorize members for Breakdown
  const breakdownData = React.useMemo(() => {
    let data = stats.members || [];
    if (filters.breakdownTier === 'bronze') data = data.filter(m => m.total <= 500);
    if (filters.breakdownTier === 'silver') data = data.filter(m => m.total > 500 && m.total <= 1500);
    if (filters.breakdownTier === 'gold') data = data.filter(m => m.total > 1500);
    if (filters.breakdownSearch) data = data.filter(m => m.name.toLowerCase().includes(filters.breakdownSearch.toLowerCase()));
    return data;
  }, [stats.members, filters.breakdownTier, filters.breakdownSearch]);

  const filteredTransactions = transactions.filter(t =>
    t.memberName.toLowerCase().includes(filters.reportSearch.toLowerCase()) ||
    t.note.toLowerCase().includes(filters.reportSearch.toLowerCase())
  );

  return (
    <div className="app-container min-h-screen p-6 md:p-10 font-sans text-slate-800">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="text-center mb-8 text-white">
        <h1 className="text-4xl md:text-5xl font-black drop-shadow-lg tracking-tight mb-3">เป๋าเรา Acc BA 34</h1>
        <div className="flex justify-center gap-3 font-bold text-[10px] uppercase">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30 shadow-sm">Stable V11</span>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-[10px] px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
            <i className="fas fa-sparkles"></i> Gemini AI
          </span>
        </div>
      </header>

      <div className="text-center mb-8">
        <div className="mx-auto w-24 h-24 bg-white/30 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-white text-4xl shadow-xl border-2 border-white/50 transform transition hover:rotate-12 hover:scale-105">
          <i className="fas fa-ship"></i>
        </div>
      </div>

      <section className="glass-panel p-6 mb-6 text-center max-w-2xl mx-auto border-t-white/60 text-white font-bold">
        <h2 className="text-lg mb-2 drop-shadow-md flex items-center justify-center gap-3">
          <i className="fas fa-university"></i> บัญชีธนาคารสำหรับโอนเงิน
        </h2>
        <p className="text-lg font-mono">
          ธนาคาร: <span className="text-cyan-200">กรุงเทพฯ (BBL)</span> | เลขที่:
          <span className="bg-indigo-900/40 px-4 py-1.5 rounded-xl tracking-[0.2em] border border-white/20 shadow-inner ml-2">123-4-56789-0</span>
        </p>
      </section>

      {/* Actions */}
      <section className="glass-panel p-8 mb-8 max-w-4xl mx-auto border-indigo-400/20">
        <div className="flex justify-between items-end mb-6 text-white">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <i className="fas fa-wallet text-indigo-300"></i> จัดการรายการเงินสมทบ
            </h2>
            <p className="text-indigo-100/70 text-sm italic mt-1">บันทึกข้อมูลและตรวจสอบการเงินของรุ่น</p>
          </div>
          <button onClick={handleAIAnalysis} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-2 rounded-xl text-sm font-black shadow-lg hover:scale-105 transition flex items-center gap-2 border border-white/30">
            <i className="fas fa-wand-magic-sparkles text-yellow-300"></i> วิเคราะห์ AI ✨
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button onClick={() => toggleModal('receive', true)} className="bg-gradient-to-r from-emerald-500 to-emerald-700 py-5 rounded-2xl text-xl active:scale-95 transition-all flex items-center justify-center border border-white/20 text-white font-bold shadow-lg hover:shadow-emerald-500/30">
            <i className="fas fa-plus-circle mr-3 text-2xl"></i> รับโอนเงิน
          </button>
          <button onClick={() => toggleModal('spend', true)} className="bg-gradient-to-r from-rose-500 to-rose-700 py-5 rounded-2xl text-xl active:scale-95 transition-all flex items-center justify-center border border-white/20 text-white font-bold shadow-lg hover:shadow-rose-500/30">
            <i className="fas fa-minus-circle mr-3 text-2xl"></i> ใช้จ่ายเงิน
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-white text-center">
        <div onClick={() => toggleModal('incomeDetail', true)} className="glass-panel glass-card-green p-6 transform transition">
          <p className="text-xs text-emerald-100 uppercase tracking-widest mb-1 opacity-80 font-bold">รายรับรวม</p>
          <p className="text-4xl font-black drop-shadow-md">{stats.income.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-100/70 mt-1 uppercase">Baht</p>
        </div>
        <div className="glass-panel glass-card-red p-6 transform transition">
          <p className="text-xs text-rose-100 uppercase tracking-widest mb-1 opacity-80 font-bold">รายจ่ายรวม</p>
          <p className="text-4xl font-black drop-shadow-md">{stats.expense.toLocaleString()}</p>
          <p className="text-[10px] text-rose-100/70 mt-1 uppercase">Baht</p>
        </div>
        <div className="glass-panel glass-card-sky p-6 transform transition">
          <p className="text-xs text-cyan-100 uppercase tracking-widest mb-1 opacity-80 font-bold">ยอดเงินคงเหลือ</p>
          <p className="text-4xl font-black drop-shadow-md">{(stats.income - stats.expense).toLocaleString()}</p>
          <p className="text-[10px] text-cyan-100/70 mt-1 uppercase">Baht</p>
        </div>
      </section>

      {/* Reports Links */}
      <section className="glass-panel p-8 max-w-4xl mx-auto mb-6 text-white">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <i className="fas fa-folder-open text-indigo-300"></i> รายงานเชิงลึก
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-lg font-bold">
          <button onClick={() => toggleModal('report', true)} className="bg-gradient-to-r from-sky-500 to-blue-600 py-4 rounded-xl transition flex items-center justify-center border border-white/20 shadow-lg hover:translate-y-[-2px]">
            <i className="fas fa-list-check mr-3 text-2xl"></i> รายการเดินบัญชีทั้งหมด
          </button>
          <Link href="/members" className="bg-gradient-to-r from-violet-500 to-purple-600 py-4 rounded-xl transition flex items-center justify-center border border-white/20 text-white shadow-lg hover:translate-y-[-2px]">
            <i className="fas fa-users-gear mr-3 text-2xl"></i> การจัดการสมาชิก
          </Link>
        </div>
      </section>

      {/* --- MODALS --- */}

      {/* Receive Modal */}
      <Modal isOpen={modals.receive} onClose={() => toggleModal('receive', false)} title="บันทึกรับเงินโอน">
        <div className="flex flex-col gap-4">
          <select
            className="w-full p-3 rounded-xl border border-indigo-200 bg-white"
            value={formData.memberId}
            onChange={e => setFormData({ ...formData, memberId: e.target.value })}
          >
            <option value="">เลือกสมาชิก...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input
            type="number"
            placeholder="จำนวนเงิน (บาท)"
            className="w-full p-4 text-2xl font-black text-right text-emerald-600 border border-indigo-200 rounded-xl bg-white"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />
          <div className="border-2 border-dashed border-indigo-200 p-4 rounded-xl text-center bg-indigo-50/50 cursor-pointer relative">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
            {formData.slip ? (
              <img src={formData.slip} className="h-40 mx-auto object-contain" alt="Slip" />
            ) : (
              <span className="text-slate-400 text-sm">คลิกเพื่ออัพโหลดสลิป</span>
            )}
          </div>
          <textarea
            placeholder="หมายเหตุ..."
            rows="2"
            className="w-full p-3 rounded-xl border border-indigo-200 bg-white"
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
          />
          <button onClick={() => handleTxSubmit('receive')} className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg mt-2">บันทึก</button>
        </div>
      </Modal>

      {/* Spend Modal */}
      <Modal isOpen={modals.spend} onClose={() => toggleModal('spend', false)} title="บันทึกรายการจ่ายเงิน">
        <div className="flex flex-col gap-4">
          <select
            className="w-full p-3 rounded-xl border border-indigo-200 bg-white"
            value={formData.memberId}
            onChange={e => setFormData({ ...formData, memberId: e.target.value })}
          >
            <option value="">เลือกผู้ทำรายการ...</option>
            {members.filter(m => m.canSpend).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input
            type="number"
            placeholder="จำนวนเงิน (บาท)"
            className="w-full p-4 text-2xl font-black text-right text-red-600 border border-indigo-200 rounded-xl bg-white"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />
          <div className="border-2 border-dashed border-indigo-200 p-4 rounded-xl text-center bg-indigo-50/50 cursor-pointer relative">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
            {formData.slip ? (
              <img src={formData.slip} className="h-40 mx-auto object-contain" alt="Slip" />
            ) : (
              <span className="text-slate-400 text-sm">คลิกเพื่ออัพโหลดหลักฐาน</span>
            )}
          </div>
          <textarea
            placeholder="หมายเหตุ..."
            rows="2"
            className="w-full p-3 rounded-xl border border-indigo-200 bg-white"
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
          />
          <button onClick={() => handleTxSubmit('spend')} className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-lg mt-2">บันทึกรายจ่าย</button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={modals.report} onClose={() => toggleModal('report', false)} title="ตรวจสอบรายการบัญชี" maxWidth="max-w-6xl">
        <div className="flex flex-col h-[500px]">
          <input
            type="text"
            placeholder="ค้นหารายการ..."
            className="w-full p-3 mb-4 border border-indigo-200 rounded-xl"
            value={filters.reportSearch}
            onChange={e => setFilters({ ...filters, reportSearch: e.target.value })}
          />
          <div className="flex-1 overflow-auto border rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-900 text-white sticky top-0">
                <tr>
                  <th className="p-3">วันที่/เวลา</th>
                  <th className="p-3">สมาชิก</th>
                  <th className="p-3 text-right">รายรับ</th>
                  <th className="p-3 text-right">รายจ่าย</th>
                  <th className="p-3 text-center">หลักฐาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-orange-50 cursor-pointer transition-colors" onClick={() => { setSlipData(tx); toggleModal('slip', true); }}>
                    <td className="p-3">
                      {new Date(tx.timestamp).toLocaleDateString('th-TH')} <br />
                      <span className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('th-TH')}</span>
                    </td>
                    <td className="p-3 font-bold">{tx.memberName}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{tx.income > 0 ? tx.income.toLocaleString() : '-'}</td>
                    <td className="p-3 text-right font-bold text-red-600">{tx.expense > 0 ? tx.expense.toLocaleString() : '-'}</td>
                    <td className="p-3 text-center"><i className="fas fa-eye text-indigo-400"></i></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Slip Modal */}
      <Modal isOpen={modals.slip} onClose={() => toggleModal('slip', false)} title="รายละเอียดหลักฐาน" maxWidth="max-w-4xl">
        {slipData && (
          <div className="text-center">
            <div className="bg-indigo-50 p-4 rounded-xl mb-4 text-left border-l-4 border-indigo-500">
              <p><span className="font-bold">รหัสรายการ:</span> {slipData.txId}</p>
              <p><span className="font-bold">หมายเหตุ:</span> {slipData.note}</p>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden mb-6 flex items-center justify-center">
              <img src={slipData.slipUrl} className="max-h-[500px] object-contain" alt="Proof" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => prepareDelete(slipData)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow hover:bg-red-700">
                <i className="fas fa-trash-alt mr-2"></i> ลบรายการ
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={modals.deleteConfirm} onClose={() => toggleModal('deleteConfirm', false)} title="ยืนยันการลบ" maxWidth="max-w-md">
        <div className="text-center">
          <p className="text-red-500 mb-6">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
          <button onClick={() => { toggleModal('deleteConfirm', false); toggleModal('deleteCode', true); }} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold">ยืนยัน</button>
        </div>
      </Modal>

      {/* Delete Code */}
      <Modal isOpen={modals.deleteCode} onClose={() => toggleModal('deleteCode', false)} title="รหัสผ่าน (1234)" maxWidth="max-w-sm">
        <div className="text-center">
          <input type="password" id="del_pass_input" className="w-full text-center text-4xl p-4 border rounded-xl mb-6 tracking-widest font-mono" maxLength={4} />
          <button onClick={confirmDelete} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">ยืนยัน</button>
        </div>
      </Modal>

      {/* Income Detail Modal */}
      <Modal isOpen={modals.incomeDetail} onClose={() => toggleModal('incomeDetail', false)} title="วิเคราะห์รายรับ" maxWidth="max-w-5xl">
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-slate-500">ความคืบหน้า</span>
            <span className="font-black text-indigo-600">{incomePercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-600 transition-all duration-1000" style={{ width: `${incomePercent}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {['admin', 'bronze', 'silver', 'gold'].map(tier => (
            <div
              key={tier}
              onClick={() => { setFilters({ ...filters, breakdownTier: tier }); toggleModal('breakdown', true); toggleModal('incomeDetail', false); }}
              className={`p-6 rounded-3xl shadow-xl cursor-pointer hover:scale-105 transition border-2 ${tier === 'admin' ? 'bg-white border-slate-200' : tier === 'bronze' ? 'bg-[#CD7F32] text-white border-[#CD7F32]' : tier === 'silver' ? 'bg-[#C0C0C0] text-slate-800 border-[#C0C0C0]' : 'bg-[#FFD700] text-slate-800 border-[#FFD700]'}`}
            >
              <div className="font-black uppercase text-xs mb-2">{tier}</div>
              <div className="text-2xl font-black">คลิกดู</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Breakdown Modal */}
      <Modal isOpen={modals.breakdown} onClose={() => toggleModal('breakdown', false)} title={`รายชื่อกลุ่ม ${filters.breakdownTier || 'ทั้งหมด'}`}>
        <input
          type="text"
          placeholder="ค้นหาชื่อ..."
          className="w-full p-3 mb-4 border rounded-xl"
          value={filters.breakdownSearch}
          onChange={e => setFilters({ ...filters, breakdownSearch: e.target.value })}
        />
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <tbody>
              {breakdownData.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3 font-bold">{m.name}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{m.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* AI Modal */}
      <Modal isOpen={modals.ai} onClose={() => toggleModal('ai', false)} title="AI Analysis (Gemini 2.5)" maxWidth="max-w-4xl">
        <div className="bg-slate-50 p-6 rounded-2xl border border-indigo-100 min-h-[300px] overflow-y-auto">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center h-48 opacity-50">
              <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-indigo-500"></i>
              <p className="animate-pulse text-indigo-800 font-bold">Gemini กำลังวิเคราะห์ข้อมูลการเงินให้คุณ...</p>
            </div>
          ) : (
            <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed font-medium">
              {aiResponse ? (
                <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br>') }} />
              ) : (
                <p className="text-center text-slate-400">กดปุ่มเพื่อเริ่มวิเคราะห์</p>
              )}
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
