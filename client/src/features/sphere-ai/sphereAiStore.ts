import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { isAxiosError } from "axios";

export interface SphereAiMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    isError?: boolean;
}

const STORAGE_KEY = "socialsphere_sphere_ai_chat_v1";

export const INITIAL_SPHERE_AI_MESSAGE: SphereAiMessage = {
    id: "welcome-1",
    role: "assistant",
    content: "👋 Hi! I'm **Sphere AI**, your official assistant for SocialSphere.\n\nI'm here to help you:\n- ✍️ **Draft & polish engaging posts**\n- 🚀 **Discover hashtags & trending topics**\n- 💎 **Explore Premium tiers & character limits**\n- 💡 **Learn all features of SocialSphere**\n\nHow can I help you today?",
    timestamp: new Date().toISOString(),
};

export const SPHERE_AI_PROMPTS = [
    { label: "💡 Draft a viral post", prompt: "Draft a punchy, high-engagement post about AI innovations in tech with hashtags." },
    { label: "💎 Explain plans", prompt: "Explain the differences between Free, Plus, and Pro plans on SocialSphere." },
    { label: "🔍 How to search tags", prompt: "How do I search for hashtags and user accounts on SocialSphere?" },
    { label: "🚀 Growth tips", prompt: "Give me 4 actionable tips to grow my followers and engagement on SocialSphere." },
];

// In-memory state and listener dispatch for instant cross-component sync
let memoryMessages: SphereAiMessage[] = (() => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // fallback
    }
    return [INITIAL_SPHERE_AI_MESSAGE];
})();

const listeners = new Set<() => void>();

const notifyListeners = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryMessages));
    } catch {
        // non-blocking
    }
    listeners.forEach((listener) => listener());
};

async function fetchDirectOpenRouterChat(
    message: string,
    history: Array<{ role: string; content: string }>
): Promise<string> {
    const directApiKey = (import.meta.env.VITE_OPENROUTER_API_KEY || "").trim();
    if (!directApiKey) {
        throw new Error("Sphere AI backend service is updating. Please deploy the latest backend on Render.");
    }

    const systemPrompt = `You are Sphere AI, the intelligent, charismatic, and versatile AI assistant for SocialSphere — the modern next-generation social communication platform with Obsidian Dark design, real-time feeds, rich media, and AI tools.

Knowledge Base of SocialSphere:
- Posts & Feeds: Users can publish posts, attach up to 4 images, videos, or GIFs, like, repost, bookmark, and reply in threaded conversations.
- Search & Discovery: Instant search for #hashtags (e.g. #tech, #design), @usernames, or user IDs.
- Subscription Plans: Free (20 AI credits/mo, 280 chars), Plus (300 credits/mo, 2,000 chars, Blue badge), Pro (1,000 credits/mo, 10,000 chars, Blue badge).
- Personality: Knowledgeable, friendly, witty, encouraging. Help brainstorm post ideas, write viral hooks, review drafts, suggest hashtags, and chat conversationally. Format responses with clean Markdown. Never refer to SocialSphere as a clone or mention Twitter/X.`;

    const openRouterMessages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map((h) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.content,
        })),
        { role: "user", content: message },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${directApiKey}`,
            "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://socialsphere.com",
            "X-Title": "SocialSphere",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: openRouterMessages,
            temperature: 0.75,
            max_tokens: 650,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenRouter returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
        throw new Error("Empty response received from AI model.");
    }
    return reply;
}

export const useSphereAi = () => {
    const [messages, setMessages] = useState<SphereAiMessage[]>(memoryMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleChange = () => {
            setMessages([...memoryMessages]);
        };
        listeners.add(handleChange);
        return () => {
            listeners.delete(handleChange);
        };
    }, []);

    const sendMessage = useCallback(async (userPrompt: string) => {
        const trimmed = userPrompt.trim();
        if (!trimmed || isLoading) return;

        const userMessage: SphereAiMessage = {
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            role: "user",
            content: trimmed,
            timestamp: new Date().toISOString(),
        };

        memoryMessages = [...memoryMessages, userMessage];
        notifyListeners();
        setIsLoading(true);
        setError(null);

        try {
            // Send recent history for context
            const history = memoryMessages.slice(-7).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            let replyContent = "";

            try {
                const { data } = await api.post("/ai/sphere-chat", {
                    message: trimmed,
                    history,
                });
                replyContent = data.reply || "";
            } catch (apiErr) {
                // If backend route is not found (404) or server is temporarily unavailable (502/503),
                // transparently fall back to direct OpenRouter API
                if (
                    isAxiosError(apiErr) &&
                    (apiErr.response?.status === 404 ||
                        apiErr.response?.status === 502 ||
                        apiErr.response?.status === 503)
                ) {
                    console.info("Backend sphere-chat endpoint pending deploy; using direct Sphere AI fallback.");
                    replyContent = await fetchDirectOpenRouterChat(trimmed, history);
                } else {
                    throw apiErr;
                }
            }

            if (!replyContent) {
                replyContent = "I'm here to help! Could you please elaborate?";
            }

            const assistantMessage: SphereAiMessage = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                role: "assistant",
                content: replyContent,
                timestamp: new Date().toISOString(),
            };

            memoryMessages = [...memoryMessages, assistantMessage];
            notifyListeners();
        } catch (err) {
            console.error("Sphere AI error:", err);
            let errorMessage = "Sphere AI is currently unavailable. Please try again in a moment.";
            if (isAxiosError(err) && typeof err.response?.data?.error === "string") {
                if (err.response.status === 404) {
                    errorMessage = "The Sphere AI backend endpoint is not deployed yet. Please trigger 'Manual Deploy' on your Render backend service.";
                } else {
                    errorMessage = err.response.data.error;
                }
            } else if (isAxiosError(err) && err.code === "ECONNABORTED") {
                errorMessage = "Request timed out. Please try sending your message again.";
            } else if (err instanceof Error && err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);

            const fallbackErrorMsg: SphereAiMessage = {
                id: `err-${Date.now()}`,
                role: "assistant",
                content: `⚠️ *${errorMessage}*`,
                timestamp: new Date().toISOString(),
                isError: true,
            };
            memoryMessages = [...memoryMessages, fallbackErrorMsg];
            notifyListeners();
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const clearMessages = useCallback(() => {
        memoryMessages = [INITIAL_SPHERE_AI_MESSAGE];
        notifyListeners();
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
    };
};
