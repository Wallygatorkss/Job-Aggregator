import { getJobs } from "../src/services/getJobs.js";
import { prisma } from "../src/utils/prisma.js";

const run = async () => {
    const params: { page?: number; size?: number } = {};
    const pageEnv = process.env.INGEST_PAGE;
    const sizeEnv = process.env.INGEST_SIZE;

    if (pageEnv !== undefined) {
        const page = Number.parseInt(pageEnv, 10);
        if (Number.isFinite(page)) params.page = page;
    }

    if (sizeEnv !== undefined) {
        const size = Number.parseInt(sizeEnv, 10);
        if (Number.isFinite(size)) params.size = size;
    }

    let page = 0;
    const size = Number(process.env.INGEST_SIZE ?? 100);

    let total = 0;

    while (true) {
        const payload = await getJobs({ page, size });
        const values = Array.isArray(payload?.values) ? payload.values : [];
        total += values.length;

        console.log(`page=${page} size=${size} fetched=${values.length} total=${total}`);

        if (values.length === 0) break;
        if (values.length < size) break;
        page += 1;
    }

    console.log("===== Done ! =====");
    console.log(`total: ${total}`);
};

run()
    .catch((error) => {
        console.error("ingest failed:", error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
