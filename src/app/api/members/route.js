export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { apiErrorResponse, readJsonObject, requireSession } from '@/lib/api-route';
import { validateMember } from '@/lib/api-validation';

export async function GET(request) {
    try {
        requireSession(request);
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') || '').trim().slice(0, 200);
        const members = await prisma.member.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { memberId: { contains: search } },
                    { phone: { contains: search } }
                ]
            } : undefined,
            orderBy: { createdAt: 'desc' }
        });
        return Response.json(members);
    } catch (error) {
        return apiErrorResponse(error, 'List members');
    }
}

export async function POST(request) {
    try {
        requireSession(request);
        const body = await readJsonObject(request);
        const member = await prisma.member.create({
            data: validateMember(body)
        });
        return Response.json(member, { status: 201 });
    } catch (error) {
        return apiErrorResponse(error, 'Create member');
    }
}
