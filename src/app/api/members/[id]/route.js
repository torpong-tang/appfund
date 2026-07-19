export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { apiErrorResponse, parseId, readJsonObject, requireSession } from '@/lib/api-route';
import { validateMember } from '@/lib/api-validation';

export async function GET(request, { params }) {
    try {
        requireSession(request);
        const id = parseId((await params).id);
        const member = await prisma.member.findUnique({
            where: { id }
        });
        if (!member) return Response.json({ error: 'Record not found' }, { status: 404 });
        return Response.json(member);
    } catch (error) {
        return apiErrorResponse(error, 'Get member');
    }
}

export async function PUT(request, { params }) {
    try {
        requireSession(request);
        const id = parseId((await params).id);
        const body = await readJsonObject(request);
        const member = await prisma.member.update({
            where: { id },
            data: validateMember(body, { partial: true })
        });
        return Response.json(member);
    } catch (error) {
        return apiErrorResponse(error, 'Update member');
    }
}

export async function DELETE(request, { params }) {
    try {
        requireSession(request);
        const id = parseId((await params).id);
        await prisma.member.delete({
            where: { id }
        });
        return Response.json({ success: true });
    } catch (error) {
        return apiErrorResponse(error, 'Delete member');
    }
}
