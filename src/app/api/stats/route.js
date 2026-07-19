export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { apiErrorResponse, requireSession } from '@/lib/api-route';

export async function GET(request) {
    try {
        requireSession(request);
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

        return Response.json({
            income: income._sum.income || 0,
            expense: expense._sum.expense || 0,
            members: memberStats.map(m => ({
                name: m.memberName,
                total: m._sum.income || 0
            }))
        });
    } catch (error) {
        return apiErrorResponse(error, 'Load dashboard statistics');
    }
}
