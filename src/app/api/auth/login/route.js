export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signSession, sessionCookieOptions, SESSION_COOKIE, ensureDefaultAdmin } from '@/lib/auth';

export async function POST(request) {
    try {
        await ensureDefaultAdmin();
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
        }

        const user = await prisma.adminUser.findUnique({ where: { email: String(email).trim().toLowerCase() } });
        if (!user || !verifyPassword(password, user.passwordHash)) {
            return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        const token = signSession({ uid: user.id, email: user.email, name: user.name });
        const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
        res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
        return res;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
