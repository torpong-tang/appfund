export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
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
    try {
        const json = await request.json();
        const tx = await prisma.transaction.create({
            data: {
                ...json,
                timestamp: new Date() // Always set server timestamp
            }
        });
        return NextResponse.json(tx);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
