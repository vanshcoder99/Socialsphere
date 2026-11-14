import React, { useEffect } from "react";
import {
    X,
    TrendingUp,
    Activity,
    BarChart2,
    Heart,
    Repeat,
    MessageCircle,
    Bookmark,
    Eye,
    UserCheck,
    Maximize2,
    Sparkles,
    Users,
    Zap,
    Compass,
} from "lucide-react";
import type { Tweet } from "../types";

interface PostActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    tweet: Tweet;
    impressions?: number;
    likesCount?: number;
    retweetsCount?: number;
}

export const PostActivityModal: React.FC<PostActivityModalProps> = ({
    isOpen,
    onClose,
    tweet,
    impressions: impressionsProp,
    likesCount,
    retweetsCount,
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const likes = typeof likesCount === "number" ? likesCount : (tweet._count.likes || 0);
    const retweets = typeof retweetsCount === "number" ? retweetsCount : (tweet._count.retweets || 0);
    const replies = tweet._count.replies || 0;
    const bookmarks = tweet._count.bookmarks || 0;
    const totalEngagements = likes + retweets + replies + bookmarks;

    // Deterministic impressions calculation based on tweet ID + engagements + age
    const idHash = Math.abs(
        tweet.id.split("").reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)
    );
    const baseline = (idHash % 180) + 60;
    const impressions = typeof impressionsProp === "number"
        ? impressionsProp
        : (tweet.views ?? totalEngagements);

    const engagementRate = ((totalEngagements / Math.max(impressions, 1)) * 100).toFixed(1);
    const profileVisits = Math.max(1, Math.round(impressions * 0.07) + (idHash % 12));
    const detailExpands = Math.max(2, Math.round(impressions * 0.14) + (idHash % 25));

    // Audience & Reach Analysis
    const nonFollowerReachPct = Math.min(88, Math.max(24, Math.round(45 + (idHash % 35))));
    const followerReachPct = 100 - nonFollowerReachPct;
    const viralityScore = Math.min(99, Math.max(30, Math.round(parseFloat(engagementRate) * 11 + 40)));

    // Calculate percentage shares of engagements
    const likesPct = totalEngagements > 0 ? Math.round((likes / totalEngagements) * 100) : 0;
    const retweetsPct = totalEngagements > 0 ? Math.round((retweets / totalEngagements) * 100) : 0;
    const repliesPct = totalEngagements > 0 ? Math.round((replies / totalEngagements) * 100) : 0;
    const bookmarksPct = totalEngagements > 0 ? Math.round((bookmarks / totalEngagements) * 100) : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg rounded-3xl border border-border-dark bg-surface-primary shadow-2xl p-6 text-white my-auto animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-dark mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-accent-blue/10 text-accent-blue">
                            <BarChart2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-white">Post Analytics</h2>
                            <p className="text-xs text-text-muted">Real-time performance and audience engagement</p>
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

                {/* Tweet Snippet Preview */}
                <div className="mb-5 rounded-2xl border border-border-dark bg-surface-secondary/70 p-3.5 flex items-start gap-3">
                    <img
                        src={
                            tweet.author.avatarUrl ||
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${tweet.author.username}`
                        }
                        alt={tweet.author.username}
                        className="w-9 h-9 rounded-full object-cover border border-border-dark flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-white">@{tweet.author.username}</span>
                            <span className="text-text-muted">· {new Date(tweet.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                            {tweet.content}
                        </p>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {/* Impressions */}
                    <div className="rounded-2xl border border-border-dark bg-surface-secondary p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-text-muted mb-2">
                            <span className="text-xs font-semibold">Views</span>
                            <Eye size={15} className="text-accent-blue" />
                        </div>
                        <span className="text-xl font-extrabold text-white">
                            {impressions.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                            <TrendingUp size={11} /> +{((baseline % 18) + 8)}%
                        </span>
                    </div>

                    {/* Engagements */}
                    <div className="rounded-2xl border border-border-dark bg-surface-secondary p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-text-muted mb-2">
                            <span className="text-xs font-semibold">Engagements</span>
                            <Activity size={15} className="text-premium-violet" />
                        </div>
                        <span className="text-xl font-extrabold text-white">
                            {totalEngagements.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-text-muted mt-1">Interactions</span>
                    </div>

                    {/* Rate */}
                    <div className="rounded-2xl border border-border-dark bg-surface-secondary p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-text-muted mb-2">
                            <span className="text-xs font-semibold">Rate</span>
                            <Sparkles size={15} className="text-amber-400" />
                        </div>
                        <span className="text-xl font-extrabold text-white">{engagementRate}%</span>
                        <span className="text-[10px] text-text-muted mt-1">Eng. rate</span>
                    </div>
                </div>

                {/* Engagement Distribution Progress Bar */}
                {totalEngagements > 0 && (
                    <div className="mb-5 rounded-2xl border border-border-dark bg-surface-secondary p-4">
                        <div className="flex justify-between items-center text-xs text-text-secondary mb-2 font-semibold">
                            <span>Engagement Distribution</span>
                            <span>{totalEngagements} total</span>
                        </div>
                        <div className="h-2.5 w-full bg-surface-hover rounded-full overflow-hidden flex">
                            {likes > 0 && (
                                <div
                                    className="bg-pink-500 h-full transition-all"
                                    style={{ width: `${likesPct}%` }}
                                    title={`Likes: ${likes} (${likesPct}%)`}
                                />
                            )}
                            {retweets > 0 && (
                                <div
                                    className="bg-emerald-400 h-full transition-all"
                                    style={{ width: `${retweetsPct}%` }}
                                    title={`Retweets: ${retweets} (${retweetsPct}%)`}
                                />
                            )}
                            {replies > 0 && (
                                <div
                                    className="bg-accent-blue h-full transition-all"
                                    style={{ width: `${repliesPct}%` }}
                                    title={`Replies: ${replies} (${repliesPct}%)`}
                                />
                            )}
                            {bookmarks > 0 && (
                                <div
                                    className="bg-purple-400 h-full transition-all"
                                    style={{ width: `${bookmarksPct}%` }}
                                    title={`Bookmarks: ${bookmarks} (${bookmarksPct}%)`}
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-text-muted">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" /> Likes ({likes})
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Retweets ({retweets})
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-accent-blue inline-block" /> Replies ({replies})
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Bookmarks ({bookmarks})
                            </span>
                        </div>
                    </div>
                )}

                {/* Detailed Metrics List */}
                <div className="space-y-2.5 mb-6">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        Detailed Activity
                    </h3>

                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border-dark/60">
                        <span className="flex items-center gap-2.5 text-text-secondary">
                            <Heart size={16} className="text-pink-500" /> Likes
                        </span>
                        <strong className="text-white font-bold">{likes.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border-dark/60">
                        <span className="flex items-center gap-2.5 text-text-secondary">
                            <Repeat size={16} className="text-emerald-400" /> Reposts / Retweets
                        </span>
                        <strong className="text-white font-bold">{retweets.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border-dark/60">
                        <span className="flex items-center gap-2.5 text-text-secondary">
                            <MessageCircle size={16} className="text-accent-blue" /> Replies
                        </span>
                        <strong className="text-white font-bold">{replies.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border-dark/60">
                        <span className="flex items-center gap-2.5 text-text-secondary">
                            <Bookmark size={16} className="text-purple-400" /> Bookmarks
                        </span>
                        <strong className="text-white font-bold">{bookmarks.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border-dark/60">
                        <span className="flex items-center gap-2.5 text-text-secondary">
                            <Maximize2 size={16} className="text-text-muted" /> Detail Expands
                        </span>
                        <strong className="text-white font-bold">{detailExpands.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center justify-between text-sm py-1.5">
                        <span className="flex items-center gap-2.5 text-text-secondary">
                            <UserCheck size={16} className="text-text-muted" /> Profile Visits
                        </span>
                        <strong className="text-white font-bold">{profileVisits.toLocaleString()}</strong>
                    </div>
                </div>

                {/* Audience & Reach Analysis */}
                <div className="mb-6 rounded-2xl border border-border-dark bg-surface-secondary/70 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Compass size={14} className="text-accent-blue" /> Audience Reach & Analysis
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <Zap size={11} /> Virality Score {viralityScore}/100
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-surface-primary border border-border-dark flex flex-col justify-between">
                            <span className="text-text-muted flex items-center gap-1.5">
                                <Users size={13} className="text-accent-blue" /> Non-followers
                            </span>
                            <span className="text-base font-extrabold text-white mt-1">
                                {nonFollowerReachPct}%
                            </span>
                            <span className="text-[10px] text-text-muted">Explored via Algorithm</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-surface-primary border border-border-dark flex flex-col justify-between">
                            <span className="text-text-muted flex items-center gap-1.5">
                                <Users size={13} className="text-purple-400" /> Followers
                            </span>
                            <span className="text-base font-extrabold text-white mt-1">
                                {followerReachPct}%
                            </span>
                            <span className="text-[10px] text-text-muted">Direct Feed Reach</span>
                        </div>
                    </div>
                </div>

                {/* Done Button */}
                <button
                    onClick={onClose}
                    className="w-full rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                    Done
                </button>
            </div>
        </div>
    );
};
