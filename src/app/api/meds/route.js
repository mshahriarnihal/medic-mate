import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function startOfUTC(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function parseDoseTimes(input) {
    // Accept array or comma-separated string; normalize to ["HH:MM", ...]
    if (!input) return [];
    if (Array.isArray(input)) {
        return input
            .map(String)
            .map(s => s.trim())
            .filter(Boolean);
    }
    return String(input)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

// GET: list meds + today’s taken/required + expiry info
export async function GET() {
    try {
        const today = startOfUTC();
        const meds = await prisma.medication.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                doseLogs: { where: { date: today } },
            },
        });

        const result = meds.map(m => {
            const log = m.doseLogs[0] || null;
            const taken = log ? log.takenCount : 0;
            const required = m.timesPerDay;

            let daysToExpiry = null;
            let expiringSoon = false;
            if (m.expiryDate) {
                const diffMs = new Date(m.expiryDate).getTime() - today.getTime();
                daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                expiringSoon = daysToExpiry <= 14;
            }

            return {
                id: m.id,
                name: m.name,
                dosage: m.dosage,
                timesPerDay: m.timesPerDay,
                doseTimes: m.doseTimes || [],           // <<<<<<<<<< new
                startDate: m.startDate,
                expiryDate: m.expiryDate,
                notes: m.notes,
                takenToday: taken,
                requiredToday: required,
                daysToExpiry,
                expiringSoon,
            };
        });

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

// POST: create a medication
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            name,
            dosage,
            timesPerDay,
            startDate,
            expiryDate,
            notes,
            doseTimes, // can be array or comma string
        } = body;

        if (!name || !String(name).trim()) {
            return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
        }

        const tpd = Number(timesPerDay || 1);
        if (isNaN(tpd) || tpd < 1 || tpd > 24) {
            return new Response(JSON.stringify({ error: 'timesPerDay must be between 1 and 24' }), { status: 400 });
        }

        const normalizedDoseTimes = parseDoseTimes(doseTimes);
        // Optional sanity: if user provides times, keep tpd in sync with count
        // (non-blocking; you can enforce instead if you prefer)
        // const finalTPD = normalizedDoseTimes.length > 0 ? normalizedDoseTimes.length : tpd;

        const med = await prisma.medication.create({
            data: {
                name: String(name).trim(),
                dosage: dosage || null,
                timesPerDay: tpd,
                startDate: startDate ? new Date(startDate) : undefined,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes: notes || null,
                doseTimes: normalizedDoseTimes, // <<<<<<<<<< new
            },
        });

        return new Response(JSON.stringify(med), { status: 201 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

// DELETE: delete a medication (and its dose logs)
export async function DELETE(request) {
    try {
        const body = await request.json();
        const { id } = body;
        if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

        await prisma.doseLog.deleteMany({ where: { medicationId: Number(id) } });
        await prisma.medication.delete({ where: { id: Number(id) } });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
