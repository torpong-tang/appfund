export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signSession, sessionCookieOptions, SESSION_COOKIE, ensureDefaultAdmin } from '@/lib/auth';
import { ApiError, apiErrorResponse, readJsonObject } from '@/lib/api-route';

export async function POST(request) {
    try {
        await ensureDefaultAdmin();
        const body = await readJsonObject(request);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!email || !password) throw new ApiError(400, 'กรุณากรอกอีเมลและรหัสผ่าน');

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user || !verifyPassword(password, user.passwordHash)) {
            return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        const token = signSession({ uid: user.id, email: user.email, name: user.name });
        const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
        res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
        return res;
    } catch (error) {
        return apiErrorResponse(error, 'Admin login');
    }
}
