import { apiDelay } from "../utils/delay";
import { upsertOfferFromApi, type ApiJob } from "./offerIngestion.js";

export type GetJobsParams = {
    page?: number;
    size?: number;
};
import process from "process";

export async function getJobs(params: GetJobsParams = {}) {
    await apiDelay();

    const page = Number.isFinite(params.page) ? params.page : 0;
    const size = Number.isFinite(params.size) ? params.size : 10;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is missing");
    }

    const url = new URL("https://epi-api.welovedevs.com/v1");
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "X-API-Key": apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const payload = await response.json();
    const jobs: ApiJob[] = Array.isArray(payload?.values) ? payload.values : [];

    for (const job of jobs) {
        await upsertOfferFromApi(job);
    }

    return payload;
}