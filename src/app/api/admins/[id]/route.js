export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

// Update an admin (name, and optionally reset password).
export async function PUT(request, { params }) {
    try {
        const session = getSessionUser(request);
        if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

        const id = parseInt((await params).id);
        const { name, password } = await request.json();
        const data = {};
        if (typeof name === 'string') data.name = name.trim();
        if (password) {
            if (String(password).length < 8) {
                return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
            }
            data.passwordHash = hashPassword(password);
        }

        const updated = await prisma.adminUser.update({
            where: { id },
            data,
            select: { id: true, email: true, name: true },
        });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete an admin. Refuses to delete yourself or the last remaining admin.
export async function DELETE(request, { params }) {
    try {
        const session = getSessionUser(request);
        if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

        const id = parseInt((await params).id);
        if (id === session.uid) {
            return NextResponse.json({ error: "ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่" }, { status: 400 });
        }
        const count = await prisma.adminUser.count();
        if (count <= 1) {
            return NextResponse.json({ error: "ต้องมีผู้ดูแลอย่างน้อย 1 คน" }, { status: 400 });
        }

        await prisma.adminUser.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
