
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, UserPlus, Users, Loader, ArrowLeft, Camera, Upload, AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import MemberCard from '@/components/MemberCard';
import Toast from '@/components/Toast';
import { api, apiJson } from '@/lib/api';

export default function MembersPage() {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [toast, setToast] = useState(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    // Form State
    const initialForm = { memberId: "", name: "", email: "", phone: "", address: "", avatar: "" };
    const [formData, setFormData] = useState(initialForm);

    // --- API ---
    const fetchMembers = async () => {
        try {
            setLoading(true);
            setMembers(await apiJson('/api/members'));
        } catch (e) {
            console.error(e);
            setToast({ message: "Failed to load members", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // --- Auth guard: admin only ---
    useEffect(() => {
        let active = true;
        apiJson('/api/auth/me')
            .then(d => {
                if (!active) return;
                if (d && d.user) setAuthChecked(true);
                else router.replace('/login');
            })
            .catch(() => { if (active) router.replace('/login'); });
        return () => { active = false; };
    }, [router]);

    // --- Handlers ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingMember ? 'PUT' : 'POST';
            const url = editingMember ? api(`/api/members/${editingMember.id}`) : api('/api/members');

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Action failed');

            setToast({ message: editingMember ? "อัพเดทข้อมูลสำเร็จ" : "เพิ่มสมาชิกสำเร็จ", type: "success" });
            closeModal();
            fetchMembers();
        } catch (e) {
            setToast({ message: "เกิดข้อผิดพลาด", type: "error" });
        }
    };

    const confirmDelete = async () => {
        if (memberToDelete) {
            try {
                await fetch(api(`/api/members/${memberToDelete.id}`), { method: 'DELETE' });
                setToast({ message: "ลบสมาชิกสำเร็จ", type: "success" });
                setMemberToDelete(null);
                setIsDeleteModalOpen(false);
                fetchMembers();
            } catch (e) {
                setToast({ message: "ลบไม่สำเร็จ", type: "error" });
            }
        }
    };

    const openAddModal = () => {
        setEditingMember(null);
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModal = (member) => {
        setEditingMember(member);
        setFormData({
            memberId: member.memberId,
            name: member.name,
            email: member.email,
            phone: member.phone,
            address: member.address,
            avatar: member.avatar
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMember(null);
    };

    // --- Derived State ---
    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId.toString().includes(searchTerm) ||
        (m.phone && m.phone.includes(searchTerm))
    );

    const stats = useMemo(() => {
        return {
            total: members.length
        };
    }, [members]);

    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white/70">
                <Loader className="animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 lg:p-12 relative z-10 ambient-light text-white font-sarabun">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Ambient Orbs */}
            <div className="orb orb-1 fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/20 blur-[100px] animate-[float_20s_infinite_ease-in-out_alternate]"></div>
            <div className="orb orb-2 fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/20 blur-[100px] animate-[float_25s_infinite_ease-in-out_alternate-reverse]"></div>

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 relative z-20">
                <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} /> กลับสู่หน้าหลัก
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">ทำเนียบศิษย์เก่า</h1>
                        <p className="text-lg text-white/50 font-light">ระบบจัดการฐานข้อมูลติดต่อศิษย์เก่าสัมพันธ์</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass-dark-panel text-sm text-white/70">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            Database Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto mb-12 relative z-20">
                <div className="glass-dark-panel rounded-2xl p-6 flex items-center gap-4 w-full sm:w-auto sm:inline-flex">
                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-200"><Users size={24} /></div>
                    <div><p className="text-white/40 text-sm">ศิษย์เก่าในระบบ</p><p className="text-2xl font-bold">{stats.total} คน</p></div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto relative z-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400 transition-colors"><Search size={20} /></div>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
                            className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={openAddModal} className="px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 w-full md:w-auto justify-center bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/20 hover:scale-105 transition">
                        <UserPlus size={20} /> เพิ่มข้อมูลศิษย์เก่า
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-white/30" size={48} /></div>
                ) : filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMembers.map(m => (
                            <MemberCard key={m.id} member={m} onEdit={openEditModal} onDelete={(mem) => { setMemberToDelete(mem); setIsDeleteModalOpen(true); }} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 glass-dark-panel rounded-3xl">
                        <p className="text-white/40">ไม่พบข้อมูลศิษย์เก่า</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingMember ? "แก้ไขข้อมูลศิษย์เก่า" : "เพิ่มศิษย์เก่าใหม่"}>
                <form onSubmit={handleSubmit} className="space-y-4 font-sarabun text-white">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative group cursor-pointer w-28 h-28">
                            <div className="w-full h-full rounded-full border-4 border-white/10 overflow-hidden relative z-10 bg-black/20 shadow-xl group-hover:border-teal-400/50 transition-colors">
                                {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-white/30"><Camera size={24} /></div>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-30" />
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity pointer-events-none text-white"><Upload size={24} /></div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs opacity-60 mb-1">รหัสนักศึกษา</label>
                            <input required type="text" disabled={!!editingMember} value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })} className="glass-input w-full p-2.5 rounded-xl" placeholder="6XXXXXX" />
                        </div>
                        <div>
                            <label className="block text-xs opacity-60 mb-1">เบอร์โทรศัพท์</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="glass-input w-full p-2.5 rounded-xl" placeholder="0xx-xxx-xxxx" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs opacity-60 mb-1">ชื่อ-นามสกุล</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="glass-input w-full p-2.5 rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-xs opacity-60 mb-1">อีเมล</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="glass-input w-full p-2.5 rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-xs opacity-60 mb-1">ที่อยู่</label>
                        <textarea rows="3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="glass-input w-full p-2.5 rounded-xl"></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={closeModal} className="cursor-pointer glow-slate flex-1 py-3 rounded-xl bg-slate-700 text-white transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-xmark"></i> ยกเลิก</button>
                        <button type="submit" className="cursor-pointer glow-teal flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-floppy-disk"></i> บันทึก</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="ยืนยันการลบ">
                <div className="text-center p-4">
                    <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                    <p className="text-lg mb-6 text-white">คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ &quot;{memberToDelete?.name}&quot;?</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="cursor-pointer glow-slate flex-1 py-3 bg-slate-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-xmark"></i> ยกเลิก</button>
                        <button onClick={confirmDelete} className="cursor-pointer glow-rose flex-1 py-3 bg-red-600 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2"><i className="fas fa-trash"></i> ลบข้อมูล</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
