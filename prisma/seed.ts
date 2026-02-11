
import { PrismaClient } from '../src/generated/prisma/client.ts';
import path from 'node:path';

// Set environment variable explicitly for the process
const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient();

async function main() {
    console.log(`Seeding database at ${process.env.DATABASE_URL}...`);

    // Clear existing data
    try {
        await prisma.transaction.deleteMany();
        await prisma.member.deleteMany();
        console.log('Cleared existing data.');
    } catch (e) {
        console.log('Error clearing data (might be empty db):', e.message);
    }

    const members = [
        { memberId: 'R001', name: 'นายสมชาย เจริญสุข', canSpend: true, avatar: 'https://placehold.co/100x100/1E3A8A/FFFFFF?text=SMC' },
        { memberId: 'R002', name: 'นางสาวสมหญิง รักดี', canSpend: false, avatar: 'https://placehold.co/100x100/DB2777/FFFFFF?text=SYR' },
        { memberId: 'R003', name: 'นายวีรยุทธ กล้าหาญ', canSpend: true, avatar: 'https://placehold.co/100x100/059669/FFFFFF?text=VYK' },
        { memberId: 'R004', name: 'นางพัชรี สุขเสมอ', canSpend: true, avatar: 'https://placehold.co/100x100/F97316/FFFFFF?text=PSS' },
        { memberId: 'R005', name: 'โครงการส่วนกลาง', canSpend: true, avatar: 'https://placehold.co/100x100/6B7280/FFFFFF?text=CENT' },
    ];

    for (const m of members) {
        await prisma.member.create({ data: m });
    }

    const alumni = [
        { memberId: '6201015', name: 'สมชาย ใจดี', email: 'somchai.j@alumni.ac.th', phone: '081-234-5678', address: '123 ถ.สุขุมวิท เขตวัฒนา กทม. 10110', avatar: 'https://i.pravatar.cc/150?u=10' },
        { memberId: '6102340', name: 'อลิษา สุขสันต์', email: 'alisa.s@design.co', phone: '089-987-6543', address: '456 ถ.พหลโยธิน เขตจตุจักร กทม. 10900', avatar: 'https://i.pravatar.cc/150?u=11' },
        { memberId: '6305501', name: 'ธนพล มั่นคง', email: 'tanapon@tech.io', phone: '090-111-2222', address: '789 ถ.เพชรเกษม เขตบางแค กทม. 10160', avatar: 'https://i.pravatar.cc/150?u=12' },
        { memberId: '6008912', name: 'พิมพ์ลภัส วงศ์ไทย', email: 'pim.w@uni.ac.th', phone: '086-555-4444', address: '101 ถ.ลาดพร้าว เขตห้วยขวาง กทม. 10310', avatar: 'https://i.pravatar.cc/150?u=13' },
        { memberId: '6401122', name: 'จิรายุ รักเรียน', email: 'jirayu@edu.com', phone: '092-333-8888', address: '222 ถ.พระราม 9 เขตสวนหลวง กทม. 10250', avatar: 'https://i.pravatar.cc/150?u=14' },
    ];

    for (const a of alumni) {
        await prisma.member.create({ data: a });
    }

    const names = ['กิตติภพ', 'ชัชวาล', 'ทศพล', 'นพดล', 'ปองพล', 'วรพงษ์', 'อภิสิทธิ์', 'สุกัญญา', 'วิชุดา', 'ปาริฉัตร'];
    for (let i = 0; i < names.length; i++) {
        await prisma.transaction.create({
            data: {
                txId: 'TXS' + i,
                timestamp: new Date(),
                memberName: names[i],
                income: (i + 1) * 500,
                expense: 0,
                note: i === 0 ? 'Admin Initial' : 'สมทบห้อง',
                slipUrl: 'https://placehold.co/400x600/6366F1/FFFFFF?text=SLIP',
            },
        });
    }

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
