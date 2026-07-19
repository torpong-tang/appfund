export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { ApiError, apiErrorResponse, requireSession } from '@/lib/api-route';

export async function GET(request) {
    try {
        const session = requireSession(request);
        const user = await prisma.adminUser.findUnique({
            where: { id: session.uid },
            select: { id: true, email: true, name: true },
        });
        if (!user) throw new ApiError(401, 'unauthenticated');
        return Response.json({ user });
    } catch (error) {
        return apiErrorResponse(error, 'Load current admin');
    }
}
