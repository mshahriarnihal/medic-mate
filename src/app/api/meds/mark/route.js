import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function startOfUTC(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

// POST: { medId } → increments today's takenCount up to timesPerDay
export async function POST(request) {
    try {
        const body = await request.json();
        const { medId } = body;
        if (!medId) return new Response(JSON.stringify({ error: 'Missing medId' }), { status: 400 });

        const med = await prisma.medication.findUnique({ where: { id: Number(medId) } });
        if (!med) return new Response(JSON.stringify({ error: 'Medication not found' }), { status: 404 });

        const today = startOfUTC();

        // Ensure a row exists for today
        let log = await prisma.doseLog.findUnique({
            where: { medicationId_date: { medicationId: med.id, date: today } }
        });

        if (!log) {
            log = await prisma.doseLog.create({
                data: { medicationId: med.id, date: today, takenCount: 0 }
            });
        }

        if (log.takenCount >= med.timesPerDay) {
            return new Response(JSON.stringify({ message: 'All doses already marked for today.' }), { status: 200 });
        }

        const updated = await prisma.doseLog.update({
            where: { medicationId_date: { medicationId: med.id, date: today } },
            data: { takenCount: { increment: 1 } }
        });

        return new Response(JSON.stringify({
            medicationId: med.id,
            takenToday: updated.takenCount,
            requiredToday: med.timesPerDay
        }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
