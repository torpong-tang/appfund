export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { apiErrorResponse, parseId, requireSession } from '@/lib/api-route';

export async function GET(request, { params }) {
    try {
        requireSession(request);
        const id = parseId((await params).id);
        const tx = await prisma.transaction.findUnique({
            where: { id }
        });
        if (!tx) return Response.json({ error: 'Record not found' }, { status: 404 });
        return Response.json(tx);
    } catch (error) {
        return apiErrorResponse(error, 'Get transaction');
    }
}

export async function DELETE(request, { params }) {
    try {
        requireSession(request);
        const id = parseId((await params).id);
        await prisma.transaction.delete({
            where: { id }
        });
        return Response.json({ success: true });
    } catch (error) {
        return apiErrorResponse(error, 'Delete transaction');
    }
}
