import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    X,
    Share2,
    Copy,
    Check,
    Send,
    Loader2,
    Search,
    MessageSquare,
    CheckCircle,
    ExternalLink,
    Sparkles,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../features/auth/hooks";
import type { Tweet } from "../types";

interface SharePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    tweet: Tweet;
}

interface ChatTarget {
    userId: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
    conversationId?: string | null;
}

const avatarFor = (username?: string | null) =>
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username || "guest")}`;

export const SharePostModal: React.FC<SharePostModalProps> = ({
    isOpen,
    onClose,
    tweet,
}) => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [copied, setCopied] = useState(false);
    const [chatTargets, setChatTargets] = useState<ChatTarget[]>([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const postUrl = `${window.location.origin}/tweet/${tweet.id}`;

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch existing conversations and eligible contacts when modal opens
    useEffect(() => {
        if (!isOpen || !currentUser) return;
        let isMounted = true;
        setLoadingChats(true);
        setErrorMsg(null);

        const fetchContactsAndConversations = async () => {
            try {
                const [convRes, contactsRes] = await Promise.allSettled([
                    api.get("/messages/conversations"),
                    api.get("/messages/contacts"),
                ]);

                if (!isMounted) return;

                const targetsMap = new Map<string, ChatTarget>();

                // Process conversations first (they have an active conversationId)
                if (convRes.status === "fulfilled" && convRes.value.data?.conversations) {
                    for (const conv of convRes.value.data.conversations) {
                        const peer = conv.participants?.find((p: any) => p.userId !== currentUser.id)?.user;
                        if (peer && peer.id) {
                            targetsMap.set(peer.id, {
                                userId: peer.id,
                                username: peer.username,
                                name: peer.name,
                                avatarUrl: peer.avatarUrl,
                                isVerified: peer.isVerified,
                                conversationId: conv.id,
                            });
                        }
                    }
                }

                // Process eligible contacts from followers / following
                if (contactsRes.status === "fulfilled" && contactsRes.value.data?.contacts) {
                    for (const c of contactsRes.value.data.contacts) {
                        if (c.id && !targetsMap.has(c.id)) {
                            targetsMap.set(c.id, {
                                userId: c.id,
                                username: c.username,
                                name: c.name,
                                avatarUrl: c.avatarUrl,
                                isVerified: c.isVerified,
                                conversationId: c.conversationId || null,
                            });
                        }
                    }
                }

                setChatTargets(Array.from(targetsMap.values()));
            } catch (err) {
                console.error("Failed to load chat contacts for sharing:", err);
            } finally {
                if (isMounted) setLoadingChats(false);
            }
        };

        void fetchContactsAndConversations();

        return () => {
            isMounted = false;
        };
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setFeedbackMsg("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2500);
            setTimeout(() => setFeedbackMsg(null), 3000);
        } catch {
            setErrorMsg("Unable to copy link to clipboard.");
        }
    };

    const handleSendToChat = async (target: ChatTarget) => {
        if (!currentUser) {
            navigate("/auth");
            return;
        }

        setSendingId(target.userId);
        setErrorMsg(null);

        try {
            let activeConvId = target.conversationId;

            // If no existing conversation exists with this contact, initiate one
            if (!activeConvId) {
                const convRes = await api.post("/messages/conversations", { recipientId: target.userId });
                activeConvId = convRes.data?.conversation?.id;
                if (activeConvId) {
                    target.conversationId = activeConvId;
                }
            }

            if (!activeConvId) {
                throw new Error("Unable to establish conversation");
            }

            // Construct the message content with optional user note
            const messageBody = customNote.trim()
                ? `${customNote.trim()}\n\n${postUrl}`
                : postUrl;

            await api.post(`/messages/conversations/${activeConvId}/messages`, {
                content: messageBody,
            });

            // Mark this contact as sent
            setSentIds((prev) => new Set(prev).add(target.userId));
            setFeedbackMsg(`Post sent to @${target.username}!`);
            setTimeout(() => setFeedbackMsg(null), 3500);
        } catch (err: any) {
            console.error("Failed to share post via chat:", err);
            const serverError = err?.response?.data?.error;
            setErrorMsg(typeof serverError === "string" ? serverError : "Could not send message. Please try again.");
        } finally {
            setSendingId(null);
        }
    };

    // Filter contacts by search query
    const filteredTargets = chatTargets.filter((t) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            t.username.toLowerCase().includes(query) ||
            (t.name && t.name.toLowerCase().includes(query))
        );
    });

    // Quick external share handlers
    const shareToTwitter = () => {
        const text = encodeURIComponent(tweet.content ? `${tweet.content.slice(0, 100)}...` : "Check this out on SocialSphere!");
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(postUrl)}`, "_blank", "noopener,noreferrer");
    };

    const shareToWhatsApp = () => {
        const text = encodeURIComponent(`Check out this post on SocialSphere: ${postUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
    };

    const shareToTelegram = () => {
        const text = encodeURIComponent(tweet.content ? tweet.content.slice(0, 100) : "SocialSphere Post");
        window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${text}`, "_blank", "noopener,noreferrer");
    };

    const handleSystemShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Post by @${tweet.author.username} on SocialSphere`,
                    text: tweet.content ? `${tweet.content.slice(0, 120)}...` : "Check out this post on SocialSphere",
                    url: postUrl,
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg rounded-3xl border border-border-dark bg-[#0e1217] shadow-2xl p-6 text-white my-auto animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-dark mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-accent-blue/10 text-accent-blue">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-white">Share Post</h2>
                            <p className="text-xs text-text-muted">Copy link or share directly via chat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-text-muted hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Embedded Tweet Preview Capsule */}
                <div className="mb-4 rounded-2xl border border-border-dark bg-surface-secondary/60 p-3 flex items-start gap-3">
                    <img
                        src={
                            tweet.author.avatarUrl ||
                            avatarFor(tweet.author.username)
                        }
                        alt={tweet.author.username}
                        className="w-8 h-8 rounded-full object-cover border border-border-dark flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-white hover:underline cursor-pointer">
                                {tweet.author.username}
                            </span>
                            {tweet.author.isVerified && (
                                <CheckCircle size={13} className="text-accent-blue fill-accent-blue flex-shrink-0" />
                            )}
                            <span className="text-text-muted">@{tweet.author.username}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                            {tweet.content}
                        </p>
                    </div>
                </div>

                {/* Feedback & Error alerts */}
                {feedbackMsg && (
                    <div className="mb-3.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                        <Check size={14} />
                        <span>{feedbackMsg}</span>
                    </div>
                )}
                {errorMsg && (
                    <div className="mb-3.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                        <X size={14} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* 1. Copy Link Section */}
                <div className="mb-5">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        Post Link
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                readOnly
                                value={postUrl}
                                className="w-full rounded-xl border border-border-dark bg-surface-secondary px-3.5 py-2.5 text-xs text-text-secondary font-mono focus:outline-none select-all"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                copied
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white text-black hover:bg-neutral-200"
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check size={15} />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={15} />
                                    <span>Copy Link</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 2. Share via Direct Message / Chat Section */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare size={14} className="text-accent-blue" /> Share via Direct Message
                        </label>
                        {currentUser && (
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/messages");
                                }}
                                className="text-[11px] font-semibold text-accent-blue hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <span>Go to Messages</span>
                                <ExternalLink size={11} />
                            </button>
                        )}
                    </div>

                    {!currentUser ? (
                        <div className="rounded-2xl border border-border-dark bg-surface-secondary/40 p-4 text-center">
                            <p className="text-xs text-text-muted mb-2.5">
                                Log in to share this post directly with your friends in private chat.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate("/auth");
                                }}
                                className="rounded-full bg-accent-blue px-4 py-1.5 text-xs font-bold text-white hover:bg-accent-blue-hover transition-colors cursor-pointer"
                            >
                                Sign in
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border-dark bg-surface-secondary/30 p-3 space-y-2.5">
                            {/* Optional Custom Note */}
                            <input
                                type="text"
                                placeholder="Add a comment to your message (optional)..."
                                value={customNote}
                                onChange={(e) => setCustomNote(e.target.value)}
                                className="w-full rounded-xl border border-border-dark bg-surface-secondary px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                            />

                            {/* Search Filter for Contacts */}
                            {chatTargets.length > 4 && (
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search chat contacts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-border-dark bg-surface-primary pl-8 pr-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent-blue"
                                    />
                                </div>
                            )}

                            {/* Contacts / Conversations List */}
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border-dark/40">
                                {loadingChats ? (
                                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-text-muted text-xs">
                                        <Loader2 size={18} className="animate-spin text-accent-blue" />
                                        <span>Loading your chat contacts...</span>
                                    </div>
                                ) : filteredTargets.length === 0 ? (
                                    <div className="py-5 text-center text-xs text-text-muted">
                                        {searchQuery
                                            ? "No contacts matching search."
                                            : "No recent chats found. Start a conversation in Messages first!"}
                                    </div>
                                ) : (
                                    filteredTargets.map((target) => {
                                        const isSent = sentIds.has(target.userId);
                                        const isSendingThis = sendingId === target.userId;

                                        return (
                                            <div
                                                key={target.userId}
                                                className="flex items-center justify-between py-2 pt-2.5 gap-2"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <img
                                                        src={
                                                            target.avatarUrl ||
                                                            avatarFor(target.username)
                                                        }
                                                        alt={target.username}
                                                        className="w-8 h-8 rounded-full object-cover border border-border-dark flex-shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-bold text-white truncate">
                                                                {target.name || target.username}
                                                            </span>
                                                            {target.isVerified && (
                                                                <CheckCircle
                                                                    size={12}
                                                                    className="text-accent-blue fill-accent-blue flex-shrink-0"
                                                                />
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-text-muted truncate block">
                                                            @{target.username}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleSendToChat(target)}
                                                    disabled={isSent || isSendingThis}
                                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                                        isSent
                                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                                                            : "bg-accent-blue hover:bg-accent-blue-hover text-white active:scale-95"
                                                    }`}
                                                >
                                                    {isSendingThis ? (
                                                        <>
                                                            <Loader2 size={13} className="animate-spin" />
                                                            <span>Sending</span>
                                                        </>
                                                    ) : isSent ? (
                                                        <>
                                                            <Check size={13} />
                                                            <span>Sent</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send size={12} />
                                                            <span>Send</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Quick Social & System Share Buttons */}
                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        Quick Share
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {/* WhatsApp */}
                        <button
                            onClick={shareToWhatsApp}
                            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-secondary border border-border-dark hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors text-xs font-semibold cursor-pointer group"
                            title="Share on WhatsApp"
                        >
                            <span className="text-base mb-0.5">💬</span>
                            <span className="text-[11px] text-text-secondary group-hover:text-emerald-400">WhatsApp</span>
                        </button>

                        {/* Telegram */}
                        <button
                            onClick={shareToTelegram}
                            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-secondary border border-border-dark hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-400 transition-colors text-xs font-semibold cursor-pointer group"
                            title="Share on Telegram"
                        >
                            <span className="text-base mb-0.5">✈️</span>
                            <span className="text-[11px] text-text-secondary group-hover:text-sky-400">Telegram</span>
                        </button>

                        {/* X / Twitter */}
                        <button
                            onClick={shareToTwitter}
                            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-secondary border border-border-dark hover:bg-white/10 hover:border-white/30 hover:text-white transition-colors text-xs font-semibold cursor-pointer group"
                            title="Share on X"
                        >
                            <span className="text-base mb-0.5 font-bold">𝕏</span>
                            <span className="text-[11px] text-text-secondary group-hover:text-white">Post to X</span>
                        </button>

                        {/* System Share / More */}
                        <button
                            onClick={handleSystemShare}
                            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-surface-secondary border border-border-dark hover:bg-accent-blue/10 hover:border-accent-blue/30 hover:text-accent-blue transition-colors text-xs font-semibold cursor-pointer group"
                            title="More options"
                        >
                            <Sparkles size={16} className="mb-0.5 text-accent-blue" />
                            <span className="text-[11px] text-text-secondary group-hover:text-accent-blue">More</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

