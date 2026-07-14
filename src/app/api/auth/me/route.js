export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
    const session = getSessionUser(request);
    if (!session) {
        return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    // Return fresh data from DB (name may have changed); fall back to token if the row is gone.
    const user = await prisma.adminUser.findUnique({
        where: { id: session.uid },
        select: { id: true, email: true, name: true },
    });
    if (!user) {
        return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    return NextResponse.json({ user });
}
