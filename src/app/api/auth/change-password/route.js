export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = getSessionUser(request);
        if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

        const { currentPassword, newPassword } = await request.json();
        if (!newPassword || String(newPassword).length < 8) {
            return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
        }

        const user = await prisma.adminUser.findUnique({ where: { id: session.uid } });
        if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
            return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
        }

        await prisma.adminUser.update({
            where: { id: user.id },
            data: { passwordHash: hashPassword(newPassword) },
        });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
