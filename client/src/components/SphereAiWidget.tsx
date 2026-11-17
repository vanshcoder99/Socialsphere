import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    X,
    Send,
    Trash2,
    Sparkles,
    Maximize2,
    Loader2,
} from "lucide-react";
import { SphereAiIcon } from "./SphereAiIcon";
import { SphereAiMarkdown } from "./SphereAiMarkdown";
import { useSphereAi, SPHERE_AI_PROMPTS } from "../features/sphere-ai/sphereAiStore";

export const SphereAiWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const { messages, isLoading, sendMessage, clearMessages } = useSphereAi();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isMessagesPage = location.pathname.startsWith("/messages");
    const isFocusedPage = ["/plans", "/settings/billing", "/settings", "/help"].includes(location.pathname);
    const hasRightSidebar = !isMessagesPage && !isFocusedPage;

    // If user is already on /messages?id=sphere-ai, auto-minimize floating widget
    const isAlreadyInSphereAiMessagePage =
        location.pathname === "/messages" && new URLSearchParams(location.search).get("id") === "sphere-ai";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen, messages, isLoading]);

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = inputValue.trim();
        if (!text || isLoading) return;
        setInputValue("");
        void sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePromptClick = (prompt: string) => {
        void sendMessage(prompt);
    };

    // If on full-page sphere-ai chat, don't show the duplicate floating modal
    if (isAlreadyInSphereAiMessagePage) {
        return null;
    }

    return (
        <aside
            aria-label="Sphere AI Assistant"
            className={`fixed z-50 flex flex-col items-end transition-all duration-300 select-none ${
                hasRightSidebar
                    ? "bottom-20 right-4 sm:bottom-6 sm:right-6 xl:right-[370px] 2xl:right-[400px]"
                    : "bottom-20 right-4 sm:bottom-6 sm:right-6"
            }`}
        >
            {/* Expanded Floating Chatbot Window */}
            {isOpen && (
                <div className="mb-3 w-[calc(100vw-32px)] sm:w-[410px] h-[540px] max-h-[78vh] bg-surface-primary/95 backdrop-blur-2xl border border-border-dark/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 bg-surface-secondary/70 border-b border-border-dark flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <SphereAiIcon size={30} showPulse={isLoading} />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-sm text-text-primary tracking-tight">
                                        Sphere AI
                                    </span>
                                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-[9px] font-black text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                                        Assistant
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[11px] text-text-muted">
                                        {isLoading ? "Sphere AI is thinking..." : "Online & ready"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-1">
                            {/* Clear conversation */}
                            <button
                                type="button"
                                onClick={clearMessages}
                                className="p-1.5 rounded-full text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Clear conversation"
                            >
                                <Trash2 size={15} />
                            </button>

                            {/* Open in full Messages Page */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate("/messages?id=sphere-ai");
                                }}
                                className="p-1.5 rounded-full text-text-muted hover:text-accent-blue hover:bg-white/10 transition-colors cursor-pointer"
                                title="Open full chat in Messages"
                            >
                                <Maximize2 size={15} />
                            </button>

                            {/* Minimize / Close */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Minimize Sphere AI"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 select-text">
                        {messages.map((m) => {
                            const isUser = m.role === "user";
                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                                >
                                    {!isUser && (
                                        <SphereAiIcon size={24} className="mt-1 shrink-0" />
                                    )}

                                    <div
                                        className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                                            isUser
                                                ? "bg-accent-blue text-white rounded-br-xs shadow-md shadow-accent-blue/15"
                                                : m.isError
                                                ? "bg-red-500/10 border border-red-500/30 text-red-300 rounded-bl-xs"
                                                : "bg-surface-secondary border border-border-dark text-text-primary rounded-bl-xs"
                                        }`}
                                    >
                                        <SphereAiMarkdown content={m.content} showCopy={!isUser && !m.isError} />
                                        <div
                                            className={`mt-1 text-[10px] flex items-center justify-end ${
                                                isUser ? "text-white/60" : "text-text-muted"
                                            }`}
                                        >
                                            {new Date(m.timestamp).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Loading Typing Indicator */}
                        {isLoading && (
                            <div className="flex items-start gap-2.5">
                                <SphereAiIcon size={24} className="mt-1" showPulse />
                                <div className="bg-surface-secondary border border-border-dark rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-2">
                                    <Sparkles size={14} className="text-cyan-400 animate-spin" />
                                    <span className="text-xs text-text-secondary animate-pulse">
                                        Sphere AI is crafting a response...
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Quick Prompts (visible if conversation is fresh) */}
                        {messages.length <= 2 && !isLoading && (
                            <div className="pt-2">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2 px-1">
                                    Suggested questions:
                                </span>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {SPHERE_AI_PROMPTS.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handlePromptClick(p.prompt)}
                                            className="text-left px-3 py-2 bg-surface-secondary/70 hover:bg-surface-secondary hover:border-cyan-500/40 border border-border-dark rounded-xl text-xs text-text-secondary hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <span>{p.label}</span>
                                            <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                →
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <form
                        onSubmit={handleSend}
                        className="p-3 bg-surface-secondary/60 border-t border-border-dark shrink-0 flex flex-col gap-1.5"
                    >
                        <div className="flex items-end gap-2 bg-surface-primary border border-border-dark focus-within:border-cyan-500/60 rounded-2xl px-3 py-2 transition-colors">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                maxLength={1500}
                                placeholder="Ask Sphere AI anything..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-text-primary placeholder:text-text-muted outline-none resize-none max-h-24 min-h-[22px] leading-relaxed"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-accent-blue text-white flex items-center justify-center shrink-0 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                                title="Send message"
                            >
                                {isLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                            </button>
                        </div>
                        <div className="flex items-center justify-between px-1 text-[10px] text-text-muted">
                            <span>Powered by OpenRouter LLM</span>
                            <span>{inputValue.length}/1500</span>
                        </div>
                    </form>
                </div>
            )}

            {/* High-Visibility Floating Sphere AI Logo Button */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-surface-card hover:bg-surface-hover text-text-primary border-2 border-cyan-400 dark:border-cyan-400/80 hover:border-cyan-300 shadow-2xl shadow-cyan-500/35 hover:shadow-cyan-400/50 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-cyan-500/25 ring-offset-2 ring-offset-surface-primary"
                    title="Open Sphere AI Chatbot"
                    aria-label="Open Sphere AI Chatbot"
                >
                    {/* Glowing outer pulse aura */}
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping -z-10 opacity-75" />

                    {/* Logo Icon */}
                    <SphereAiIcon size={30} showPulse />

                    {/* Clear Text Label */}
                    <span className="font-extrabold text-sm text-text-primary tracking-tight group-hover:text-cyan-400 transition-colors">
                        Sphere AI
                    </span>

                    {/* Gradient AI Badge with Sparkle */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        <Sparkles size={11} className="animate-spin text-cyan-200" />
                        <span>Ask AI</span>
                    </span>
                </button>
            )}
        </aside>
    );
};
