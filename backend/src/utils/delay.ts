export const delay = (ms: number) : Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const apiDelay = (): Promise<void> => {
    const ms = parseInt(process.env.API_DELAY ?? '1000', 10);
    return delay(ms);
}