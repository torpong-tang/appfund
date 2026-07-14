export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUBLIC (no auth): aggregate fund summary shown on the landing page.
// Exposes only totals + goal + branding — no member or transaction details.
export async function GET() {
    try {
        const inc = await prisma.transaction.aggregate({ _sum: { income: true } });
        const exp = await prisma.transaction.aggregate({ _sum: { expense: true } });
        const income = inc._sum.income || 0;
        const expense = exp._sum.expense || 0;
        const balance = income - expense;

        const setting = await prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
        const target = setting.incomeTarget || 0;

        const latest = await prisma.transaction.findFirst({
            orderBy: { timestamp: 'desc' },
            select: { timestamp: true },
        });

        // Contributors (income only), aggregated per name, joined to student id.
        // Only memberId + total are exposed publicly (no names).
        const grouped = await prisma.transaction.groupBy({
            by: ['memberName'],
            _sum: { income: true },
            where: { income: { gt: 0 } },
        });
        const memberByName = new Map(
            (await prisma.member.findMany({ select: { name: true, memberId: true } }))
                .map(m => [m.name, m.memberId])
        );
        const contributors = grouped
            .map(g => ({ memberId: memberByName.get(g.memberName) || null, total: g._sum.income || 0 }))
            .filter(c => c.memberId) // only those with a student id
            .sort((a, b) => b.total - a.total);

        return NextResponse.json({
            contributors,
            income,
            expense,
            balance,
            target,
            remaining: Math.max(0, target - balance),
            percent: target > 0 ? Math.min(100, Math.max(0, (balance / target) * 100)) : 0,
            latestTimestamp: latest?.timestamp || null,
            title: setting.title,
            subtitle: setting.subtitle,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
