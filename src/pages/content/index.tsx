import { createRoot } from "react-dom/client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { runtime, storage } from "webextension-polyfill";
import Logo from "@assets/img/icon-128.png";
import "@assets/styles/tailwind.css";

type BasicAnalysis = {
    trust: number;
    score: number;
};
type DetailedAnalysis = {
    allocatedTime: "Not enough" | "Enough";
    workload: "High" | "Medium" | "Low";
    offering: "Generous" | "Correct" | "Low";
    seriousness: "Scam or unrealistic" | "Serious";
};
type Analysis = BasicAnalysis | DetailedAnalysis;
type Platform = "upwork" | null;

// Scraping configuration for different platforms
const PLATFORM_CONFIG = {
    upwork: {
        contentClass: "air3-card-sections",
        checkInterval: 2000,
    },
} as const;

function detectPlatform(): Platform {
    const domain = window.location.hostname;
    if (domain.includes("upwork.com")) return "upwork";
    return null;
}

function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number,
): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
}

function extractAllTexts(fromClass: string): string[] {
    const parentElement = document.querySelector(`.${fromClass}`);
    if (!parentElement) return [];

    const walker = document.createTreeWalker(
        parentElement,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                const text = node.textContent?.trim();
                return text && text.length > 3
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            },
        },
    );

    const texts: string[] = [];
    let node: Node | null;

    while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text) {
            texts.push(text);
        }
    }

    return [...new Set(texts)].filter((text) => text.length > 5);
}

function ScoreIndicator({ score, max = 100 }: { score: number; max?: number }) {
    const percentage = (score / max) * 100;
    const colorClass =
        percentage >= 70
            ? "bg-success"
            : percentage >= 40
              ? "bg-warning"
              : "bg-error";

    return (
        <div className="flex items-center gap-2">
            <div className="w-full bg-base-300 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${colorClass} transition-all duration-300`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="text-xs font-medium">
                {score}/{max}
            </span>
        </div>
    );
}

function TrustBadge({ trust }: { trust: number }) {
    const getBadgeClass = () => {
        if (trust >= 8) return "text-success";
        if (trust >= 5) return "text-warning";
        return "badge-error";
    };
    const getTrustLabel = () => {
        if (trust >= 8) return "Highly Trusted";
        if (trust >= 5) return "Moderately Trusted";
        return "Low Trust";
    };

    return (
        <div className={`${getBadgeClass()} text-sm`}>
            {getTrustLabel()}
        </div>
    );
}

function DetailedMetrics({ analysis }: { analysis: DetailedAnalysis }) {
    const metrics = [
        {
            key: "allocatedTime",
            label: "Time Allocation",
            value: analysis.allocatedTime,
            icon: "⏱️",
            colorClass:
                analysis.allocatedTime === "Enough"
                    ? "text-success"
                    : "text-error",
        },
        {
            key: "workload",
            label: "Workload",
            value: analysis.workload,
            icon: "💼",
            colorClass:
                analysis.workload === "Low"
                    ? "text-success"
                    : analysis.workload === "Medium"
                      ? "text-warning"
                      : "text-error",
        },
        {
            key: "offering",
            label: "Payment",
            value: analysis.offering,
            icon: "💰",
            colorClass:
                analysis.offering === "Generous"
                    ? "text-success"
                    : analysis.offering === "Correct"
                      ? "text-warning"
                      : "text-error",
        },
        {
            key: "legitimacy",
            label: "Legitimacy",
            value: analysis.seriousness,
            icon: "🎯",
            colorClass:
                analysis.seriousness === "Serious"
                    ? "text-success"
                    : "text-error",
        },
    ];

    return (
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2">
            {metrics.map(({ key, label, value, icon, colorClass }) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                    <span className="text-base-content/70">{icon}</span>
                    <div>
                        <div className="font-medium text-xs">{label}</div>
                        <div className={`text-xs ${colorClass}`}>{value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function AnalysisWidget(props: { analysis: Analysis | null; loading: boolean }) {
    const isDetailed = props.analysis && "allocatedTime" in props.analysis;
    const url = runtime.getURL(Logo);

    if (props.loading || props.analysis === null)
        return <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 max-w-sm min-w-[275px]">
            <div className="p-3 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={url} height={18} width={10} />
                    <span className="font-semibold text-sm">Job Analysis</span>
                    {props.loading && (
                        <span className="loading loading-spinner loading-xs"></span>
                    )}
                </div>
            </div>
    </div>

    return (
        <div className="collapse bg-base-100 rounded-lg shadow-lg border border-base-300 max-w-sm min-w-[275px]">
            <input type="checkbox" />
            <div className="collapse-title p-3 border-b border-base-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={url} className="w-[14px]" />
                    <span className="font-semibold text-sm">Job Analysis</span>
                </div>
            </div>
            <div className="collapse-content p-0 flex flex-col justify-center items-between">
                {!isDetailed ? (
                    <div className="p-4 pb-0">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-base-content/70">
                                Overall Score
                            </span>
                        </div>
                        <ScoreIndicator
                            score={(props.analysis as BasicAnalysis).score}
                        />
                    </div>
                        <div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm text-base-content/70">
                                    Trust Level
                                </span>
                                <TrustBadge
                                    trust={
                                        (props.analysis as BasicAnalysis).trust
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4">
                            <DetailedMetrics
                                analysis={props.analysis as DetailedAnalysis}
                            />
                        </div>
                        <div className="p-4 pb-0 border-t border-base-300 w-full">
                            <div className="text-xs text-base-content/60">
                                Analysis based on job content, requirements, and
                                market standards
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PlatformRenderer() {
    const platform = useMemo(() => detectPlatform(), []);
    const [lastPath, setLastPath] = useState<string>("");
    const [location, setLocation] = useState(window.location.pathname);
    const [key, setKey] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const config = useMemo(
        () => (platform ? PLATFORM_CONFIG[platform] : null),
        [platform],
    );

    const extractContent = useCallback(async (): Promise<string[] | null> => {
        if (!config) return null;

        try {
            const content = extractAllTexts(config.contentClass);
            return content.length > 0 ? content : null;
        } catch (err) {
            console.error("Content extraction failed:", err);
            setError("Failed to extract content");
            return null;
        }
    }, [config]);

    const analyzeContent = useCallback(
        async (content: string[], apiKey: string) => {
            const maxRetries = 2;
            let lastError: Error | null = null;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const res = await fetch(
                        "https://www.badclients.app/api/jobs/analysis",
                        {
                            credentials: "include",
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${apiKey}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                input: content.join("\n"),
                            }),
                        },
                    );

                    if (res.status !== 200)
                        throw new Error(
                            `API request failed: ${res.status} ${res.statusText}`,
                        );
                    return await res.json();
                } catch (err) {
                    lastError = err as Error;

                    if (attempt < maxRetries - 1) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000 * (attempt + 1)),
                        );
                    }
                }
            }

            throw lastError;
        },
        [],
    );

    const performAnalysis = useCallback(
        debounce(async () => {
            if (!config || !key || location === lastPath) return;

            setLoading(true);
            setError(null);

            try {
                const content = await extractContent();
                
                if (!content) {
                    setLoading(false);
                    return;
                }
                setLastPath(location);
                
                const output = await analyzeContent(content, key);

                setAnalysis(output.flags);

                if (output.nextKey) {
                    await storage.local.set({ rot_key: output.nextKey });
                    setKey(output.nextKey);
                }
            } catch (err) {
                console.error("Analysis failed:", err);
                setError("Analysis failed. Please try again.");
                setAnalysis(null);
            } finally {
                setLoading(false);
            }
        }, 1000),
        [config, key, location, lastPath, extractContent, analyzeContent],
    );

    const initializeKey = useCallback(async () => {
        try {
            const result = await storage.local.get("rot_key");

            if (result.rot_key)
               setKey(result.rot_key as string);
            else
                setError("API key not found. Please configure the extension.");
        } catch (err) {
            console.error("Failed to get API key:", err);
            setError("Failed to load configuration");
            setKey(null);
        }
    }, []);

    useEffect(() => {
        if (!config) return;

        const interval = setInterval(() => {
            const currentPath = window.location.pathname;
            
            if (currentPath !== location) {
                setLocation(currentPath);
            }
        }, config.checkInterval);

        return () => clearInterval(interval);
    }, [config, location]);

    useEffect(() => {
        initializeKey();
    }, [initializeKey]);

    useEffect(() => {
        if (key && location) {
            performAnalysis();
        }
    }, [key, location, performAnalysis]);

    if (!platform || !config) return null;

    if (error) {
        return (
            <div className="fixed bottom-4 left-4 z-50 text-white">
                <div className="alert alert-error shadow-lg max-w-sm">
                    <span className="text-sm">{error}</span>
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setError(null)}
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 mx-4 z-500 animate-fade-in text-white">
            <AnalysisWidget analysis={analysis} loading={loading} />
        </div>
    );
}

function initializeExtension() {
    try {
        if (document.querySelector("#badclients_ext")) {
            console.log("Extension already initialized");
            return;
        }

        const div = document.createElement("div");
        div.id = "badclients_ext";
        div.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            user-select: none;
        `;

        document.body.appendChild(div);

        const rootContainer = document.querySelector("#badclients_ext");
        
        if (!rootContainer) {
            throw new Error("Failed to create root element");
        }

        createRoot(rootContainer).render(<PlatformRenderer />);
        console.log("BadClients extension initialized successfully");
    } catch (err) {
        console.error("Extension initialization failed:", err);
    }
}

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initializeExtension);
else
    setTimeout(initializeExtension, 100);

