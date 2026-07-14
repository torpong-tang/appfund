
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import StatCard from '@/components/StatCard';
import TransactionModal from '@/components/TransactionModal';
import AdminUsersModal from '@/components/AdminUsersModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import ContributorCloud from '@/components/ContributorCloud';
import { api, apiJson } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ income: 0, expense: 0, members: [] });
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);

  // Auth
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Modals state
  const [modals, setModals] = useState({
    receive: false,
    spend: false,
    report: false,
    slip: false,
    deleteConfirm: false,
    ai: false,
    settings: false,
    admins: false,
    changePassword: false
  });

  // Data for modals
  const [txToDelete, setTxToDelete] = useState(null);
  const [slipData, setSlipData] = useState(null);
  const [formData, setFormData] = useState({ memberId: '', amount: '', note: '', slip: null });
  const [filters, setFilters] = useState({ reportSearch: '' });
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(20);
  const [reportSort, setReportSort] = useState({ key: 'timestamp', dir: 'desc' });
  const [toast, setToast] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Constants
  const DEFAULT_SETTINGS = {
    title: "เป๋าเรา Acc BA 34",
    subtitle: "",
    bankName: "กรุงเทพฯ (BBL)",
    accountNumber: "123-4-56789-0",
    incomeTarget: 500000
  };

  // App-wide configurable labels (persisted in the database via /api/settings)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const [statsData, txData, memData, settingsData] = await Promise.all([
        apiJson('/api/stats'),
        apiJson('/api/transactions'),
        apiJson('/api/members'),
        apiJson('/api/settings')
      ]);
      setStats(statsData);
      setTransactions(txData);
      setMembers(memData);
      if (settingsData && !settingsData.error) setSettings(settingsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Auth guard: require a logged-in admin, else go to /login ---
  useEffect(() => {
    let active = true;
    apiJson('/api/auth/me')
      .then(d => {
        if (!active) return;
        if (d && d.user) { setAuthUser(d.user); setAuthChecked(true); }
        else router.replace('/login');
      })
      .catch(() => { if (active) router.replace('/login'); });
    return () => { active = false; };
  }, [router]);

  const handleLogout = async () => {
    try { await fetch(api('/api/auth/logout'), { method: 'POST' }); } catch (e) { /* ignore */ }
    router.replace('/login');
  };

  // --- Settings ---
  const openSettings = () => {
    setSettingsForm({
      title: settings.title,
      subtitle: settings.subtitle || '',
      bankName: settings.bankName,
      accountNumber: settings.accountNumber,
      incomeTarget: settings.incomeTarget
    });
    toggleModal('settings', true);
  };

  const saveSettings = async () => {
    const target = Number(settingsForm.incomeTarget);
    const payload = {
      title: settingsForm.title.trim() || DEFAULT_SETTINGS.title,
      subtitle: settingsForm.subtitle.trim(),
      bankName: settingsForm.bankName.trim() || DEFAULT_SETTINGS.bankName,
      accountNumber: settingsForm.accountNumber.trim() || DEFAULT_SETTINGS.accountNumber,
      incomeTarget: !isNaN(target) && target > 0 ? target : DEFAULT_SETTINGS.incomeTarget
    };
    try {
      const saved = await apiJson('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (saved.error) throw new Error(saved.error);
      setSettings(saved);
      toggleModal('settings', false);
      showToast("บันทึกการตั้งค่าแล้ว");
    } catch (e) {
      showToast("บันทึกการตั้งค่าล้มเหลว", "error");
    }
  };

  // --- Helpers ---
  const toggleModal = (name, open = true) => {
    setModals(prev => ({ ...prev, [name]: open }));
    if (!open && name === 'slip') setSlipData(null);
  };

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  /* --- AI Analysis --- */
  const handleAIAnalysis = async () => {
    toggleModal('ai', true);
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch(api('/api/ai'), { method: 'POST' });
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
    // Spend is performed by the logged-in admin (no member selection).
    const needsMember = type === 'receive';
    if ((needsMember && !formData.memberId) || !formData.amount || !formData.slip) {
      showToast("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }

    const memberName = type === 'spend'
      ? (authUser?.name || authUser?.email || 'Admin')
      : (members.find(m => m.id === parseInt(formData.memberId))?.name || "Unknown");
    const amount = parseFloat(formData.amount);

    try {
      const res = await fetch(api('/api/transactions'), {
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
    try {
      await fetch(api(`/api/transactions/${txToDelete.id}`), { method: 'DELETE' });
      showToast("ลบรายการสำเร็จ");
      toggleModal('deleteConfirm', false);
      setTxToDelete(null);
      fetchData();
    } catch (error) {
      showToast("ลบรายการล้มเหลว", "error");
    }
  };

  // --- Stats Logic ---
  // Goal progress tracks the net balance (income - expense), matching the "ยอดเงินคงเหลือ" card.
  const balance = stats.income - stats.expense;
  const incomeTarget = settings.incomeTarget > 0 ? settings.incomeTarget : 0;
  const incomePercent = incomeTarget > 0 ? Math.min(100, Math.max(0, (balance / incomeTarget) * 100)).toFixed(1) : "0.0";
  const incomeRemaining = Math.max(0, incomeTarget - balance);

  const filteredTransactions = transactions.filter(t =>
    t.memberName.toLowerCase().includes(filters.reportSearch.toLowerCase()) ||
    t.note.toLowerCase().includes(filters.reportSearch.toLowerCase())
  );

  // Most recent ledger transaction (by timestamp)
  const latestTx = transactions.reduce(
    (latest, t) => (!latest || new Date(t.timestamp) > new Date(latest.timestamp) ? t : latest),
    null
  );

  // Contributors sized by total income (stats.members is grouped income per name), joined to avatars.
  const contributors = (stats.members || [])
    .filter(m => m.total > 0)
    .map(m => {
      const mem = members.find(x => x.name === m.name);
      return { name: m.name, total: m.total, memberId: mem?.memberId };
    })
    .sort((a, b) => b.total - a.total);

  // --- Report sorting ---
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const { key, dir } = reportSort;
    const sign = dir === 'asc' ? 1 : -1;
    if (key === 'timestamp') return sign * (new Date(a.timestamp) - new Date(b.timestamp));
    if (key === 'memberName') return sign * String(a.memberName || '').localeCompare(String(b.memberName || ''), 'th');
    return sign * ((a[key] || 0) - (b[key] || 0)); // income / expense
  });

  // --- Report pagination ---
  const reportTotal = sortedTransactions.length;
  const reportTotalPages = Math.max(1, Math.ceil(reportTotal / reportPageSize));
  const reportCurrentPage = Math.min(reportPage, reportTotalPages);
  const pagedTransactions = sortedTransactions.slice(
    (reportCurrentPage - 1) * reportPageSize,
    reportCurrentPage * reportPageSize
  );
  // Windowed page numbers (max 5, centered on current page)
  const reportPageNumbers = [];
  {
    const start = Math.max(1, reportCurrentPage - 2);
    const end = Math.min(reportTotalPages, start + 4);
    for (let i = Math.max(1, end - 4); i <= end; i++) reportPageNumbers.push(i);
  }
  const goToReportPage = (n) => setReportPage(Math.min(Math.max(1, n), reportTotalPages));

  // Toggle sort on a column (same key flips direction; new key starts ascending). Resets to page 1.
  const toggleSort = (key) => {
    setReportSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setReportPage(1);
  };
  const sortIcon = (key) => reportSort.key !== key
    ? <i className="fas fa-sort opacity-40 ml-1.5 text-xs"></i>
    : <i className={`fas fa-sort-${reportSort.dir === 'asc' ? 'up' : 'down'} ml-1.5 text-xs text-amber-300`}></i>;

  // Wait for the auth check before rendering the app (avoids flashing content pre-redirect).
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70">
        <i className="fas fa-circle-notch fa-spin text-3xl"></i>
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen p-6 md:p-10 font-sans text-white">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top-right toolbar: current user + admin management + settings */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-3">
        {/* Current user chip + dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="cursor-pointer flex items-center gap-2 pl-3 pr-3 py-2 rounded-full text-white/90 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all"
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-black">
              {(authUser?.name || authUser?.email || '?').charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:block max-w-[140px] truncate text-sm font-bold">{authUser?.name || authUser?.email}</span>
            <i className={`fas fa-chevron-down text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}></i>
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-56 glass-modal-content rounded-2xl p-2 z-50 shadow-2xl">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-sm font-bold truncate">{authUser?.name || '(ไม่มีชื่อ)'}</p>
                  <p className="text-xs text-slate-400 truncate">{authUser?.email}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); toggleModal('changePassword', true); }}
                  className="cursor-pointer w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-sm transition"
                >
                  <i className="fas fa-key text-amber-300 w-4"></i> เปลี่ยนรหัสผ่าน
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  className="cursor-pointer w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-500/15 flex items-center gap-3 text-sm text-red-300 transition"
                >
                  <i className="fas fa-right-from-bracket w-4"></i> ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>

        {/* Manage admin users */}
        <button
          onClick={() => toggleModal('admins', true)}
          aria-label="จัดการผู้ดูแล"
          title="จัดการผู้ดูแล"
          className="cursor-pointer w-12 h-12 rounded-full flex items-center justify-center text-white/90 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300"
        >
          <i className="fas fa-users text-lg"></i>
        </button>

        {/* Settings */}
        <button
          onClick={openSettings}
          aria-label="ตั้งค่า"
          title="ตั้งค่า"
          className="cursor-pointer w-12 h-12 rounded-full flex items-center justify-center text-white/90 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 hover:rotate-90 transition-all duration-300"
        >
          <i className="fas fa-gear text-xl"></i>
        </button>
      </div>

      {/* Logo */}
      <div className="text-center mb-5 fade-up" style={{ animationDelay: '0ms' }}>
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-white/30 to-white/5 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-[0_10px_40px_-8px_rgba(124,58,237,0.6)] border border-white/40 transform transition duration-500 hover:rotate-6 hover:scale-105 ring-1 ring-white/10">
          <i className="fas fa-ship"></i>
        </div>
      </div>

      {/* Header */}
      <header className="text-center mb-9 text-white fade-up" style={{ animationDelay: '80ms' }}>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-b from-white to-violet-200/80 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(124,58,237,0.4)]">{settings.title}</h1>
        {settings.subtitle && (
          <p className="text-violet-200/70 text-sm md:text-base font-medium">{settings.subtitle}</p>
        )}
      </header>

      <section className="glass-panel p-6 mb-6 text-center max-w-2xl mx-auto border-t-white/60 text-white font-bold fade-up" style={{ animationDelay: '160ms' }}>
        <h2 className="text-lg mb-2 drop-shadow-md flex items-center justify-center gap-3">
          <i className="fas fa-university"></i> บัญชีธนาคารสำหรับโอนเงิน
        </h2>
        <p className="text-lg font-mono">
          ธนาคาร: <span className="text-cyan-200">{settings.bankName}</span> | เลขที่:
          <span className="bg-indigo-900/40 px-4 py-1.5 rounded-xl tracking-[0.2em] border border-white/20 shadow-inner ml-2">{settings.accountNumber}</span>
        </p>
      </section>

      {/* Income Goal Progress */}
      <section className="glass-panel p-6 md:p-8 max-w-5xl mx-auto mb-8 text-white fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-3">
            <i className="fas fa-bullseye text-emerald-300"></i> เป้าหมายรายรับ
          </h2>
          <span className="text-2xl md:text-3xl font-black text-emerald-300 drop-shadow-md">{incomePercent}%</span>
        </div>
        <div className="w-full bg-white/10 h-5 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${incomePercent}%` }}></div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-emerald-200 font-bold">{balance.toLocaleString()} บาท</span>
          <span className="text-slate-400">เป้าหมาย {incomeTarget.toLocaleString()} บาท</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 text-center">
          <div className="bg-white/5 rounded-2xl py-3 border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">ยอดปัจจุบัน</p>
            <p className="text-lg md:text-xl font-black text-emerald-300">{balance.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-2xl py-3 border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">คงเหลืออีก</p>
            <p className="text-lg md:text-xl font-black text-amber-300">{incomeRemaining.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-2xl py-3 border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">เป้าหมาย</p>
            <p className="text-lg md:text-xl font-black text-indigo-300">{incomeTarget.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="text-xs text-slate-300/80 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <i className="fas fa-clock-rotate-left text-indigo-300"></i>
            <span>
              รายการเดินบัญชีล่าสุด:{' '}
              <span className="font-bold text-white">
                {latestTx
                  ? `${new Date(latestTx.timestamp).toLocaleDateString('th-TH')} ${new Date(latestTx.timestamp).toLocaleTimeString('th-TH')}`
                  : '—'}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-white text-center fade-up" style={{ animationDelay: '240ms' }}>
        <StatCard label="รายรับรวม" value={stats.income} tone="green" />
        <StatCard label="รายจ่ายรวม" value={stats.expense} tone="red" />
        <StatCard label="ยอดเงินคงเหลือ" value={stats.income - stats.expense} tone="sky" />
      </section>

      {/* Contributors word-cloud */}
      <ContributorCloud contributors={contributors} />

      {/* Actions */}
      <section className="glass-panel p-8 mb-8 max-w-4xl mx-auto border-indigo-400/20 fade-up" style={{ animationDelay: '300ms' }}>
        <div className="mb-6 text-white">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <i className="fas fa-wallet text-indigo-300"></i> จัดการรายการเงินสมทบ
          </h2>
          <p className="text-indigo-100/70 text-sm italic mt-1">บันทึกข้อมูลและตรวจสอบการเงินของรุ่น</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button onClick={() => toggleModal('receive', true)} className="cursor-pointer bg-gradient-to-r from-emerald-500 to-emerald-700 py-5 rounded-2xl text-xl active:scale-95 transition-all duration-300 flex items-center justify-center border border-white/20 text-white font-bold shadow-lg glow-emerald">
            <i className="fas fa-plus-circle mr-3 text-2xl"></i> รับโอนเงิน
          </button>
          <button onClick={() => toggleModal('spend', true)} className="cursor-pointer bg-gradient-to-r from-rose-500 to-rose-700 py-5 rounded-2xl text-xl active:scale-95 transition-all duration-300 flex items-center justify-center border border-white/20 text-white font-bold shadow-lg glow-rose">
            <i className="fas fa-minus-circle mr-3 text-2xl"></i> ใช้จ่ายเงิน
          </button>
        </div>
      </section>

      {/* Reports Links */}
      <section className="glass-panel p-8 max-w-4xl mx-auto mb-6 text-white fade-up" style={{ animationDelay: '400ms' }}>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <i className="fas fa-folder-open text-indigo-300"></i> รายละเอียดและการจัดการ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-lg font-bold">
          <button onClick={() => toggleModal('report', true)} className="cursor-pointer bg-gradient-to-r from-sky-500 to-blue-600 py-4 rounded-xl transition-all duration-300 flex items-center justify-center border border-white/20 shadow-lg hover:translate-y-[-2px] glow-sky">
            <i className="fas fa-list-check mr-3 text-2xl"></i> รายการเดินบัญชีทั้งหมด
          </button>
          <Link href="/members" className="cursor-pointer bg-gradient-to-r from-violet-500 to-purple-600 py-4 rounded-xl transition-all duration-300 flex items-center justify-center border border-white/20 text-white shadow-lg hover:translate-y-[-2px] glow-violet">
            <i className="fas fa-users-gear mr-3 text-2xl"></i> การจัดการสมาชิก
          </Link>
        </div>
      </section>

      {/* --- MODALS --- */}

      {/* Receive / Spend Modals */}
      <TransactionModal
        type="receive"
        isOpen={modals.receive}
        onClose={() => toggleModal('receive', false)}
        members={members}
        formData={formData}
        setFormData={setFormData}
        onFileChange={handleFileChange}
        onSubmit={() => handleTxSubmit('receive')}
      />
      <TransactionModal
        type="spend"
        isOpen={modals.spend}
        onClose={() => toggleModal('spend', false)}
        members={members}
        formData={formData}
        setFormData={setFormData}
        onFileChange={handleFileChange}
        onSubmit={() => handleTxSubmit('spend')}
        currentUser={authUser}
      />

      {/* Report Modal */}
      <Modal isOpen={modals.report} onClose={() => toggleModal('report', false)} title="ตรวจสอบรายการบัญชี" maxWidth="max-w-6xl">
        <div className="flex flex-col h-[500px]">
          <input
            type="text"
            placeholder="ค้นหารายการ..."
            className="w-full p-3 mb-4 border border-white/20 rounded-xl glass-input"
            value={filters.reportSearch}
            onChange={e => { setFilters({ ...filters, reportSearch: e.target.value }); setReportPage(1); }}
          />
          <div className="flex-1 overflow-auto border border-white/10 rounded-xl custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-violet-900 text-white sticky top-0 shadow-md">
                <tr>
                  <th className="p-3 cursor-pointer select-none hover:bg-violet-800 transition" onClick={() => toggleSort('timestamp')}>วันที่/เวลา {sortIcon('timestamp')}</th>
                  <th className="p-3 cursor-pointer select-none hover:bg-violet-800 transition" onClick={() => toggleSort('memberName')}>สมาชิก {sortIcon('memberName')}</th>
                  <th className="p-3">ผู้ทำรายการ</th>
                  <th className="p-3 text-right cursor-pointer select-none hover:bg-violet-800 transition" onClick={() => toggleSort('income')}>รายรับ {sortIcon('income')}</th>
                  <th className="p-3 text-right cursor-pointer select-none hover:bg-violet-800 transition" onClick={() => toggleSort('expense')}>รายจ่าย {sortIcon('expense')}</th>
                  <th className="p-3 text-center">หลักฐาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {pagedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5" onClick={() => { setSlipData(tx); toggleModal('slip', true); }}>
                    <td className="p-3">
                      {new Date(tx.timestamp).toLocaleDateString('th-TH')} <br />
                      <span className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('th-TH')}</span>
                    </td>
                    <td className="p-3 font-bold">{tx.memberName}</td>
                    <td className="p-3 text-slate-200">{tx.recordedBy || '-'}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{tx.income > 0 ? tx.income.toLocaleString() : '-'}</td>
                    <td className="p-3 text-right font-bold text-red-400">{tx.expense > 0 ? tx.expense.toLocaleString() : '-'}</td>
                    <td className="p-3 text-center"><i className="fas fa-eye text-indigo-400"></i></td>
                  </tr>
                ))}
                {pagedTransactions.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">ไม่พบรายการ</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span>Show</span>
              <select
                value={reportPageSize}
                onChange={e => { setReportPageSize(parseInt(e.target.value)); setReportPage(1); }}
                className="glass-input px-2 py-1.5 rounded-lg"
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n} className="bg-indigo-950 text-white">{n}</option>)}
              </select>
              <span>rows</span>
            </div>

            <p className="font-bold text-amber-400">พบจำนวนรายการทั้งสิ้น {reportTotal.toLocaleString()} รายการ</p>

            <div className="flex items-center gap-1.5">
              <button onClick={() => goToReportPage(1)} disabled={reportCurrentPage === 1}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 enabled:hover:bg-white/15 enabled:cursor-pointer transition">
                <i className="fas fa-angles-left text-xs"></i>
              </button>
              <button onClick={() => goToReportPage(reportCurrentPage - 1)} disabled={reportCurrentPage === 1}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 enabled:hover:bg-white/15 enabled:cursor-pointer transition">
                <i className="fas fa-angle-left text-xs"></i>
              </button>
              {reportPageNumbers.map(n => (
                <button key={n} onClick={() => goToReportPage(n)}
                  className={`w-9 h-9 rounded-lg border font-bold cursor-pointer transition ${n === reportCurrentPage
                    ? 'bg-amber-400 text-slate-900 border-amber-400'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/15'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => goToReportPage(reportCurrentPage + 1)} disabled={reportCurrentPage === reportTotalPages}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 enabled:hover:bg-white/15 enabled:cursor-pointer transition">
                <i className="fas fa-angle-right text-xs"></i>
              </button>
              <button onClick={() => goToReportPage(reportTotalPages)} disabled={reportCurrentPage === reportTotalPages}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 enabled:hover:bg-white/15 enabled:cursor-pointer transition">
                <i className="fas fa-angles-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Slip Modal */}
      <Modal isOpen={modals.slip} onClose={() => toggleModal('slip', false)} title="รายละเอียดหลักฐาน" maxWidth="max-w-4xl">
        {slipData && (
          <div className="text-center">
            <div className="bg-indigo-900/30 p-4 rounded-xl mb-4 text-left border-l-4 border-indigo-500 text-white">
              <p><span className="font-bold">รหัสรายการ:</span> {slipData.txId}</p>
              <p><span className="font-bold">ผู้ทำรายการ:</span> {slipData.recordedBy || '-'}</p>
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
          <p className="text-red-400 mb-6">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
          <div className="flex gap-3">
            <button onClick={() => toggleModal('deleteConfirm', false)} className="cursor-pointer glow-slate flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-xmark"></i> ยกเลิก</button>
            <button onClick={confirmDelete} className="cursor-pointer glow-rose flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-trash"></i> ลบรายการ</button>
          </div>
        </div>
      </Modal>

      {/* AI Modal */}
      <Modal isOpen={modals.ai} onClose={() => toggleModal('ai', false)} title="AI Analysis (Gemini 2.5)" maxWidth="max-w-4xl">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 min-h-[300px] overflow-y-auto custom-scrollbar">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center h-48 opacity-50">
              <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-indigo-500"></i>
              <p className="animate-pulse text-indigo-300 font-bold">Gemini กำลังวิเคราะห์ข้อมูลการเงินให้คุณ...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-indigo max-w-none text-slate-200 leading-relaxed font-medium">
              {aiResponse ? (
                <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br>') }} />
              ) : (
                <p className="text-center text-slate-400">กดปุ่มเพื่อเริ่มวิเคราะห์</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={modals.settings} onClose={() => toggleModal('settings', false)} title="ตั้งค่า" maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-bold">ชื่อหัวข้อ (Label)</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-white/20 glass-input"
              value={settingsForm.title}
              onChange={e => setSettingsForm({ ...settingsForm, title: e.target.value })}
              placeholder={DEFAULT_SETTINGS.title}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-bold">คำโปรย (Subtitle)</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-white/20 glass-input"
              value={settingsForm.subtitle}
              onChange={e => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
              placeholder="เว้นว่างเพื่อไม่แสดง"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-bold">ชื่อธนาคาร</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-white/20 glass-input"
                value={settingsForm.bankName}
                onChange={e => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                placeholder={DEFAULT_SETTINGS.bankName}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-bold">เลขที่บัญชี</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-white/20 glass-input font-mono"
                value={settingsForm.accountNumber}
                onChange={e => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                placeholder={DEFAULT_SETTINGS.accountNumber}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-bold">เป้าหมายรายรับ (บาท)</label>
            <input
              type="number"
              min="0"
              className="w-full p-3 rounded-xl border border-white/20 glass-input"
              value={settingsForm.incomeTarget}
              onChange={e => setSettingsForm({ ...settingsForm, incomeTarget: e.target.value })}
              placeholder={String(DEFAULT_SETTINGS.incomeTarget)}
            />
          </div>
          <p className="text-xs text-slate-400">เว้นว่างในช่องหัวข้อ/ธนาคาร/เลขบัญชี/เป้าหมายเพื่อใช้ค่าเริ่มต้น · บันทึกลงฐานข้อมูล (มีผลกับทุกคน)</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setSettingsForm({ ...DEFAULT_SETTINGS })}
              className="cursor-pointer glow-slate px-4 py-3 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <i className="fas fa-rotate-left"></i> รีเซ็ต
            </button>
            <button
              onClick={saveSettings}
              className="cursor-pointer glow-violet flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <i className="fas fa-floppy-disk"></i> บันทึก
            </button>
          </div>
        </div>
      </Modal>

      {/* Admin user management */}
      <AdminUsersModal
        isOpen={modals.admins}
        onClose={() => toggleModal('admins', false)}
        currentUserId={authUser?.id}
        showToast={showToast}
      />

      {/* Change password */}
      <ChangePasswordModal
        isOpen={modals.changePassword}
        onClose={() => toggleModal('changePassword', false)}
        showToast={showToast}
      />

    </div>
  );
}
