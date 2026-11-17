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

            const { data } = await api.post("/ai/sphere-chat", {
                message: trimmed,
                history,
            });

            const assistantMessage: SphereAiMessage = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                role: "assistant",
                content: data.reply || "I'm here to help! Could you please elaborate?",
                timestamp: data.timestamp || new Date().toISOString(),
            };

            memoryMessages = [...memoryMessages, assistantMessage];
            notifyListeners();
        } catch (err) {
            console.error("Sphere AI error:", err);
            let errorMessage = "Sphere AI is currently unavailable. Please try again in a moment.";
            if (isAxiosError(err) && typeof err.response?.data?.error === "string") {
                errorMessage = err.response.data.error;
            } else if (isAxiosError(err) && err.code === "ECONNABORTED") {
                errorMessage = "Request timed out. Please try sending your message again.";
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
