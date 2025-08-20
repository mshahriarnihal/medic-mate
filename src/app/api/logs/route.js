import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();


/* This will fetch official side effects from openFDA API that I am using for this project */
async function fetchSideEffects(drugName) {
    const url = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(
        drugName
    )}"&limit=20`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // For a bus testing, to see what's coming back
        console.log("openFDA API data:", JSON.stringify(data, null, 2));

        // Combine reactions from all results!
        const reactions = [];
        if (data.results && data.results.length > 0) {
            for (const result of data.results) {
                if (result.patient && result.patient.reaction) {
                    for (const r of result.patient.reaction) {
                        reactions.push(r.reactionmeddrapt.toLowerCase());
                    }
                }
            }
        }
        return reactions;
    } catch (e) {
        return [];
    }
}


/* GET all logs from db (for displaying previous logs) */
export async function GET() {
    try {
        // Get all logs from db, newest first
        const logs = await prisma.drugLog.findMany({
            orderBy: {date: 'desc'}
        });
        return new Response(
            JSON.stringify(logs),
            {
                status: 200,
                headers: {"Content-Type": "application/json"}
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({error: error.message}),
            {status: 400}
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {drugName, reaction, notes} = body;

        // Save user's log first
        const log = await prisma.drugLog.create({
            data: {drugName, reaction, notes},
        });

        // Here I am fetching official side effects
        const sideEffects = await fetchSideEffects(drugName);

        // Compare (keeping it case-insensitive so that it becomes easier for the user side)
        let match = false;
        let advice = '';
        if (sideEffects.length > 0) {
            match = sideEffects.some((se) =>
                se.includes(reaction.trim().toLowerCase())
            );
        }

        if (match) {
            advice = `✅ Your reaction matches a known side effect of ${drugName}. Here are other common side effects: ${sideEffects
                .filter((s) => s !== reaction.trim().toLowerCase())
                .slice(0, 5)
                .join(', ')}`;
        } else {
            advice = `⚠️ Your reaction ("${reaction}") is not listed as a common side effect of ${drugName}. If symptoms persist, please consult a doctor.`;
        }

        // Responding with log and advice
        return new Response(
            JSON.stringify({...log, officialSideEffects: sideEffects, advice}),
            {status: 201}
        );
    } catch (error) {
        return new Response(
            JSON.stringify({error: error.message}),
            {status: 400}
        );
    }
}

export async function DELETE(request) {
    try {
        /* This will "Get" id from the request body (later might change it and use query if necessary) */
        const body = await request.json();
        const {id} = body;

        if (!id) {
            return new Response(JSON.stringify({error: "Missing id"}), {status: 400});
        }

        // Deleting log from db
        await prisma.drugLog.delete({where: {id: Number(id)}});

        return new Response(JSON.stringify({success: true}), {status: 200});
    } catch (error) {
        return new Response(JSON.stringify({error: error.message}), {status: 400});
    }
}
