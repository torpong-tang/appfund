export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
    if (!getSessionUser(request)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    try {
        const transactions = await prisma.transaction.findMany({
            where: search ? {
                OR: [
                    { memberName: { contains: search } },
                    { note: { contains: search } },
                    { txId: { contains: search } }
                ]
            } : undefined,
            orderBy: { timestamp: 'desc' }
        });
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const session = getSessionUser(request);
    if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const json = await request.json();
        const tx = await prisma.transaction.create({
            data: {
                ...json,
                recordedBy: session.name || session.email, // who performed it (from session, not client)
                timestamp: new Date() // Always set server timestamp
            }
        });
        return NextResponse.json(tx);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
