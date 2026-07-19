export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { apiErrorResponse, readJsonObject, requireSession } from '@/lib/api-route';
import { validateTransaction } from '@/lib/api-validation';

export async function GET(request) {
    try {
        requireSession(request);
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') || '').trim().slice(0, 200);
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
        return Response.json(transactions);
    } catch (error) {
        return apiErrorResponse(error, 'List transactions');
    }
}

export async function POST(request) {
    try {
        const session = requireSession(request);
        const body = await readJsonObject(request);
        const tx = await prisma.transaction.create({
            data: {
                ...validateTransaction(body),
                recordedBy: session.name || session.email,
                timestamp: new Date()
            }
        });
        return Response.json(tx, { status: 201 });
    } catch (error) {
        return apiErrorResponse(error, 'Create transaction');
    }
}
