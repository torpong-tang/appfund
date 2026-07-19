export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { ApiError, apiErrorResponse, parseId, readJsonObject, requireSession } from '@/lib/api-route';
import { validateAdminUpdate } from '@/lib/api-validation';

// Update an admin (name, and optionally reset password).
export async function PUT(request, { params }) {
  try {
    requireSession(request);
    const id = parseId((await params).id);
    const body = validateAdminUpdate(await readJsonObject(request));
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.password !== undefined) data.passwordHash = hashPassword(body.password);

    const updated = await prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true },
    });
    return Response.json(updated);
  } catch (error) {
    return apiErrorResponse(error, 'Update admin');
  }
}

// Delete an admin. Refuses to delete yourself or the last remaining admin.
export async function DELETE(request, { params }) {
  try {
    const session = requireSession(request);
    const id = parseId((await params).id);
    if (id === session.uid) {
      throw new ApiError(400, 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่');
    }
    if (await prisma.adminUser.count() <= 1) {
      throw new ApiError(400, 'ต้องมีผู้ดูแลอย่างน้อย 1 คน');
    }

    await prisma.adminUser.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, 'Delete admin');
  }
}
