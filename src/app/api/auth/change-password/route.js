export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { ApiError, apiErrorResponse, readJsonObject, requireSession } from '@/lib/api-route';

export async function POST(request) {
    try {
        const session = requireSession(request);
        const body = await readJsonObject(request);
        const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
        const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
        if (newPassword.length < 8) throw new ApiError(400, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');

        const user = await prisma.adminUser.findUnique({ where: { id: session.uid } });
        if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
            throw new ApiError(400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
        }

        await prisma.adminUser.update({
            where: { id: user.id },
            data: { passwordHash: hashPassword(newPassword) },
        });
        return Response.json({ ok: true });
    } catch (error) {
        return apiErrorResponse(error, 'Change admin password');
    }
}
