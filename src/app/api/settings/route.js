export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';
import { apiErrorResponse, readJsonObject, requireSession } from '@/lib/api-route';
import { validateSettings } from '@/lib/api-validation';

const SINGLETON_ID = 1;

// Return the settings row, creating it with schema defaults on first access.
export async function GET(request) {
    try {
        requireSession(request);
        const settings = await prisma.setting.upsert({
            where: { id: SINGLETON_ID },
            update: {},
            create: { id: SINGLETON_ID }
        });
        return Response.json(settings);
    } catch (error) {
        return apiErrorResponse(error, 'Get settings');
    }
}

// Update the configurable labels. Only known fields are persisted.
export async function PUT(request) {
    try {
        requireSession(request);
        const body = await readJsonObject(request);
        const data = validateSettings(body);

        const settings = await prisma.setting.upsert({
            where: { id: SINGLETON_ID },
            update: data,
            create: { id: SINGLETON_ID, ...data }
        });
        return Response.json(settings);
    } catch (error) {
        return apiErrorResponse(error, 'Update settings');
    }
}
