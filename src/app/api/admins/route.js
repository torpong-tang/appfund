export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

// List all admin users (no password hashes).
export async function GET(request) {
    const session = getSessionUser(request);
    if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const admins = await prisma.adminUser.findMany({
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { id: 'asc' },
    });
    return NextResponse.json(admins);
}

// Create a new admin user.
export async function POST(request) {
    try {
        const session = getSessionUser(request);
        if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

        const { email, name, password } = await request.json();
        const cleanEmail = String(email || '').trim().toLowerCase();
        if (!cleanEmail || !password || String(password).length < 8) {
            return NextResponse.json({ error: "กรุณากรอกอีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
        }

        const existing = await prisma.adminUser.findUnique({ where: { email: cleanEmail } });
        if (existing) return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });

        const created = await prisma.adminUser.create({
            data: { email: cleanEmail, name: String(name || '').trim(), passwordHash: hashPassword(password) },
            select: { id: true, email: true, name: true },
        });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
