export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request, { params }) {
    if (!getSessionUser(request)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const { id } = await params;
    try {
        const tx = await prisma.transaction.findUnique({
            where: { id: parseInt(id) }
        });
        if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(tx);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    if (!getSessionUser(request)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const { id } = await params;
    try {
        await prisma.transaction.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
