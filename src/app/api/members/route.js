export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    try {
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
        return NextResponse.json(members);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const json = await request.json();
        const member = await prisma.member.create({
            data: json
        });
        return NextResponse.json(member);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
