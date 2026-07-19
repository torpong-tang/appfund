export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { apiErrorResponse, readJsonObject, requireSession } from '@/lib/api-route';
import { validateAdminCreate } from '@/lib/api-validation';

export async function GET(request) {
  try {
    requireSession(request);
    const admins = await prisma.adminUser.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
    return Response.json(admins);
  } catch (error) {
    return apiErrorResponse(error, 'List admins');
  }
}

export async function POST(request) {
  try {
    requireSession(request);
    const body = await readJsonObject(request);
    const { email, name, password } = validateAdminCreate(body);

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) return Response.json({ error: 'email is already in use' }, { status: 409 });

    const created = await prisma.adminUser.create({
      data: { email, name, passwordHash: hashPassword(password) },
      select: { id: true, email: true, name: true },
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Create admin');
  }
}
