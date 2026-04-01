// lib/rate-limit.ts
// Simple in-memory rate limiter for API routes.
// Works per-server-instance; for multi-instance deployments swap the store for Redis.

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically purge expired entries to prevent unbounded memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 5 * 60 * 1000); // every 5 minutes

/**
 * Returns true if the request is within the allowed limit, false if it should
 * be rejected. Modifies the store in place.
 *
 * @param key        Unique key (e.g. IP + route)
 * @param max        Max allowed requests in the window
 * @param windowMs   Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= max) return false;

    entry.count++;
    return true;
}

/**
 * Extract caller IP from a Next.js Request object.
 */
export function getClientIp(req: Request): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

/**
 * Return a 429 Response with a Retry-After header.
 */
export function rateLimitResponse(retryAfterSeconds = 60): Response {
    return Response.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
}
