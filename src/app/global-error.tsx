"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console in dev; swap for Sentry/Vercel monitoring in prod
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <html>
            <body>
                <main
                    style={{
                        minHeight: "100vh",
                        background: "#f5f5f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem",
                        fontFamily: "system-ui, sans-serif",
                    }}
                >
                    <div style={{ textAlign: "center", maxWidth: 420 }}>
                        <div style={{ fontSize: 56, marginBottom: 8 }}>⚠️</div>
                        <h1
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: "0.75rem",
                            }}
                        >
                            Something went wrong
                        </h1>
                        <p
                            style={{
                                color: "#6b7280",
                                marginBottom: "2rem",
                                lineHeight: 1.6,
                            }}
                        >
                            An unexpected error occurred. Our team has been notified.
                            {error.digest && (
                                <span style={{ display: "block", fontSize: "0.75rem", marginTop: "0.5rem", color: "#9ca3af" }}>
                                    Error ID: {error.digest}
                                </span>
                            )}
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    background: "#111827",
                                    color: "#fff",
                                    fontWeight: 700,
                                    borderRadius: "0.75rem",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "0.9rem",
                                }}
                            >
                                Try again
                            </button>
                            <a
                                href="/"
                                style={{
                                    padding: "0.75rem 1.5rem",
                                    background: "#bef264",
                                    color: "#111827",
                                    fontWeight: 700,
                                    borderRadius: "0.75rem",
                                    textDecoration: "none",
                                    fontSize: "0.9rem",
                                }}
                            >
                                Go home
                            </a>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    );
}
