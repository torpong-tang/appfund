
"use client";
import React, { useEffect } from 'react';
import { UserSquare, User, Mail, Phone, MapPin, Hash, PhoneOutgoing, Pencil, Trash2 } from 'lucide-react';

export default function MemberCard({ member, onEdit, onDelete }) {
    // Use lucide-react directly instead of the generic Icon component from the HTML version
    return (
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full group relative overflow-hidden transition-all hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] bg-white/5 border border-white/10 backdrop-blur-md">
            {/* Decorative Background Icon */}
            <div className="absolute -right-6 -top-6 opacity-[0.03] pointer-events-none rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110 duration-700">
                <UserSquare size={180} />
            </div>

            <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center space-x-4">
                        <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-teal-400 rounded-lg blur opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
                            <img
                                src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`}
                                alt={member.name}
                                className="w-16 h-16 rounded-lg border-2 border-white/10 object-cover shadow-lg relative z-10"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight font-sarabun">{member.name}</h3>
                            <p className="text-white/50 text-xs mt-1 flex items-center gap-1 font-outfit tracking-wide">
                                <Mail size={12} /> {member.email}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mt-4 relative z-10 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Phone Number - Clickable */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/40 flex items-center gap-2 text-xs uppercase tracking-wider font-semibold"><Phone size={12} /> เบอร์โทรศัพท์</span>
                        <a href={`tel:${member.phone}`} className="font-bold text-teal-300 text-base hover:text-teal-200 transition-colors flex items-center gap-1 bg-teal-400/10 px-2 py-1 rounded-md hover:bg-teal-400/20">
                            {member.phone} <PhoneOutgoing size={12} />
                        </a>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col text-sm gap-2 pt-3 border-t border-white/5">
                        <span className="text-white/40 flex items-center gap-2 text-xs uppercase tracking-wider font-semibold"><MapPin size={12} /> ที่อยู่ปัจจุบัน</span>
                        <span className="font-medium text-white/80 pl-0 text-sm leading-relaxed font-sarabun bg-black/20 p-2 rounded-lg min-h-[60px] text-xs">
                            {member.address || "-"}
                        </span>
                    </div>

                    {/* Student ID */}
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5 mt-1">
                        <span className="text-white/40 flex items-center gap-2 text-xs uppercase tracking-wider font-semibold"><Hash size={12} /> รหัสนักศึกษา</span>
                        <span className="font-mono text-amber-300/80 tracking-widest text-xs font-bold">{member.memberId}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-0 flex justify-end items-center relative z-10 gap-2">
                <button onClick={() => onEdit(member)} className="cursor-pointer glow-teal flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-teal-200 transition-all duration-300 flex items-center justify-center gap-2 text-xs font-medium border border-white/5 hover:border-teal-500/30">
                    <Pencil size={14} /> แก้ไข
                </button>
                <button onClick={() => onDelete(member)} className="cursor-pointer glow-rose flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-300 transition-all duration-300 flex items-center justify-center gap-2 text-xs font-medium border border-white/5 hover:border-red-500/30">
                    <Trash2 size={14} /> ลบ
                </button>
            </div>
        </div>
    );
}
