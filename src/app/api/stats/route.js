export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
    if (!getSessionUser(request)) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const income = await prisma.transaction.aggregate({
            _sum: { income: true }
        });
        const expense = await prisma.transaction.aggregate({
            _sum: { expense: true }
        });

        // Group by member for tier analysis
        const memberStats = await prisma.transaction.groupBy({
            by: ['memberName'],
            _sum: { income: true },
            where: { income: { gt: 0 } }
        });

        return NextResponse.json({
            income: income._sum.income || 0,
            expense: expense._sum.expense || 0,
            members: memberStats.map(m => ({
                name: m.memberName,
                total: m._sum.income || 0
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
