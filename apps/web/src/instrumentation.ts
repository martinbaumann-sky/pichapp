import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        Sentry.init({
            dsn: process.env.SENTRY_DSN || undefined,
            enabled: Boolean(process.env.SENTRY_DSN),
            environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
            tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
            profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.0),
            integrations: [Sentry.extraErrorDataIntegration(), Sentry.httpIntegration()],
        });
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        Sentry.init({
            dsn: process.env.SENTRY_DSN || undefined,
            enabled: Boolean(process.env.SENTRY_DSN),
            environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
            tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        });
    }
}
