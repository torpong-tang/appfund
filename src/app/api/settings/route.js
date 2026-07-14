export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

const SINGLETON_ID = 1;

// Return the settings row, creating it with schema defaults on first access.
export async function GET(request) {
    if (!getSessionUser(request)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const settings = await prisma.setting.upsert({
            where: { id: SINGLETON_ID },
            update: {},
            create: { id: SINGLETON_ID }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update the configurable labels. Only known fields are persisted.
export async function PUT(request) {
    if (!getSessionUser(request)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const body = await request.json();
        const data = {};
        for (const key of ['title', 'subtitle', 'bankName', 'accountNumber']) {
            if (typeof body[key] === 'string') data[key] = body[key];
        }
        if (body.incomeTarget !== undefined && body.incomeTarget !== '' && !isNaN(Number(body.incomeTarget))) {
            data.incomeTarget = Math.max(0, Number(body.incomeTarget));
        }

        const settings = await prisma.setting.upsert({
            where: { id: SINGLETON_ID },
            update: data,
            create: { id: SINGLETON_ID, ...data }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
