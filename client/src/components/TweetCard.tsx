import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Heart,
    Repeat,
    MessageCircle,
    Bookmark,
    Trash2,
    CheckCircle,
    Share2,
    MoreHorizontal,
    Frown,
    UserPlus,
    UserMinus,
    Ban,
    BarChart2,
    Pin,
    EyeOff,
    X,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../features/auth/hooks";
import { MediaLightboxModal } from "./MediaLightboxModal";
import { PostActivityModal } from "./PostActivityModal";
import { SharePostModal } from "./SharePostModal";
import type { Tweet, TweetMediaItem } from "../types";

const formatMetricCount = (count: number): string => {
    if (!count || count <= 0) return "0";
    if (count >= 1_000_000) {
        return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1_000) {
        return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
};

interface TweetCardProps {
    tweet: Tweet;
    onDelete?: (tweetId: string) => void;
    onHide?: (tweetId: string) => void;
    onOpenReply?: (tweet: Tweet) => void;
}

const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) {
        const backendOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
        return `${backendOrigin}${url}`;
    }
    return url;
};

export const TweetCard: React.FC<TweetCardProps> = ({
    tweet,
    onDelete,
    onHide,
    onOpenReply,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isLiked, setIsLiked] = useState(tweet.isLiked);
    const [likesCount, setLikesCount] = useState(tweet._count.likes);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const [isRetweeted, setIsRetweeted] = useState(tweet.isRetweeted);
    const [retweetsCount, setRetweetsCount] = useState(tweet._count.retweets);
    const [isRetweetLoading, setIsRetweetLoading] = useState(false);

    const [isBookmarked, setIsBookmarked] = useState(tweet.isBookmarked);
    const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // More Options Menu & Interactive Features
    const [menuOpen, setMenuOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const toastTimeoutRef = useRef<number | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
        if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
    };

    // Outside click listener for the dropdown menu
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [menuOpen]);

    const mediaList: TweetMediaItem[] =
        tweet.media && tweet.media.length > 0
            ? tweet.media
            : tweet.mediaUrl
            ? [
                  {
                      id: "legacy",
                      url: tweet.mediaUrl,
                      mediaType: tweet.mediaType || "IMAGE",
                      order: 0,
                  },
              ]
            : [];

    const isAuthor = user?.id === tweet.author.id;
    const [viewsCount, setViewsCount] = useState<number>(tweet.views ?? 0);
    const hasRecordedViewRef = useRef(false);

    // Keep viewsCount in sync when tweet prop changes
    useEffect(() => {
        if (typeof tweet.views === "number") {
            setViewsCount(tweet.views);
        }
    }, [tweet.id, tweet.views]);

    // Record real view in real time on view/mount
    useEffect(() => {
        if (!hasRecordedViewRef.current && tweet.id) {
            hasRecordedViewRef.current = true;
            api.post<{ success: boolean; views?: number }>(`/tweets/${tweet.id}/view`)
                .then((res) => {
                    if (res.data?.success && typeof res.data.views === "number") {
                        setViewsCount(res.data.views);
                    }
                })
                .catch(() => {});
        }
    }, [tweet.id]);

    // Synchronize local optimistic state when props change
    useEffect(() => {
        setIsLiked(tweet.isLiked);
        setLikesCount(tweet._count.likes);
        setIsRetweeted(tweet.isRetweeted);
        setRetweetsCount(tweet._count.retweets);
        setIsBookmarked(tweet.isBookmarked);
    }, [tweet.id, tweet.isLiked, tweet.isRetweeted, tweet.isBookmarked, tweet._count.likes, tweet._count.retweets]);

    // Helper: format relative time
    const formatTime = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate("/auth");
            return;
        }

        if (isLikeLoading) return;
        setIsLikeLoading(true);

        const nextLiked = !isLiked;
        setIsLiked(nextLiked);
        setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

        try {
            const { data } = await api.post(`/tweets/${tweet.id}/like`);
            if (data && typeof data.isLiked === "boolean") {
                setIsLiked(data.isLiked);
                setLikesCount(data.likesCount);
            }
        } catch {
            setIsLiked(!nextLiked);
            setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleRetweet = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate("/auth");
            return;
        }

        if (isRetweetLoading) return;
        setIsRetweetLoading(true);

        const nextRetweeted = !isRetweeted;
        setIsRetweeted(nextRetweeted);
        setRetweetsCount((prev) => (nextRetweeted ? prev + 1 : Math.max(0, prev - 1)));

        try {
            const { data } = await api.post(`/tweets/${tweet.id}/retweet`);
            if (data && typeof data.isRetweeted === "boolean") {
                setIsRetweeted(data.isRetweeted);
                setRetweetsCount(data.retweetsCount);
            }
        } catch {
            setIsRetweeted(!nextRetweeted);
            setRetweetsCount((prev) => (!nextRetweeted ? prev + 1 : Math.max(0, prev - 1)));
        } finally {
            setIsRetweetLoading(false);
        }
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            navigate("/auth");
            return;
        }

        if (isBookmarkLoading) return;
        setIsBookmarkLoading(true);

        const nextBookmarked = !isBookmarked;
        setIsBookmarked(nextBookmarked);

        try {
            const { data } = await api.post(`/tweets/${tweet.id}/bookmark`);
            if (data && typeof data.isBookmarked === "boolean") {
                setIsBookmarked(data.isBookmarked);
            }
        } catch {
            setIsBookmarked(!nextBookmarked);
        } finally {
            setIsBookmarkLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            await api.delete(`/tweets/${tweet.id}`);
            if (onDelete) {
                onDelete(tweet.id);
            }
        } catch (err) {
            console.error("Failed to delete post:", err);
            showToast("Could not delete post. Please try again.");
        }
    };

    // Actions from the '...' Dropdown Menu
    const handleNotInterested = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        setIsHidden(true);
        if (onHide) onHide(tweet.id);
        showToast("Thanks. We'll show fewer posts like this.");
    };

    const handleToggleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (!user) {
            navigate("/auth");
            return;
        }

        try {
            if (isFollowing) {
                await api.post(`/users/unfollow/${tweet.author.id}`);
                setIsFollowing(false);
                showToast(`Unfollowed @${tweet.author.username}`);
            } else {
                await api.post(`/users/follow/${tweet.author.id}`);
                setIsFollowing(true);
                showToast(`Now following @${tweet.author.username}`);
            }
        } catch (err) {
            console.error("Follow error:", err);
            showToast("Unable to update follow status.");
        }
    };

    const handleBlock = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (!user) {
            navigate("/auth");
            return;
        }
        if (!window.confirm(`Block @${tweet.author.username}? They will not be able to follow you or view your posts.`)) return;

        try {
            await api.post(`/users/block/${tweet.author.id}`);
            setIsBlocked(true);
            showToast(`Blocked @${tweet.author.username}`);
            if (onHide) onHide(tweet.id);
        } catch (err) {
            console.error("Block error:", err);
            showToast("Unable to block user.");
        }
    };

    const handlePin = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        showToast("Post pinned to your profile.");
    };

    const handleAnalyticsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAuthor) {
            setActivityModalOpen(true);
        } else {
            showToast(`Views: ${viewsCount.toLocaleString()} times seen`);
        }
    };

    // Render text with clickable #hashtags
    const renderContentWithHashtags = (content: string) => {
        const parts = content.split(/(#[a-zA-Z0-9_]+)/g);
        return parts.map((part, index) => {
            if (part.startsWith("#")) {
                const tag = part.slice(1);
                if (!/^\d+$/.test(tag)) {
                    return (
                        <span
                            key={index}
                            className="text-accent-blue hover:underline cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/explore?tag=${encodeURIComponent(tag.toLowerCase())}`);
                            }}
                        >
                            {part}
                        </span>
                    );
                }
            }
            return part;
        });
    };

    // Hidden post view (Twitter/X style with Undo & Dismiss)
    if (isHidden) {
        return (
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-dark bg-surface-primary/40 text-sm text-text-secondary animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                    <EyeOff size={16} className="text-text-muted shrink-0" />
                    <span>Thanks. We won't show you this post anymore.</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsHidden(false);
                        }}
                        className="text-accent-blue font-bold text-xs hover:underline px-3 py-1.5 rounded-full hover:bg-accent-blue/10 cursor-pointer"
                    >
                        Undo
                    </button>
                    {onHide && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onHide(tweet.id);
                            }}
                            className="text-text-muted hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
                            title="Dismiss from feed"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Blocked user post view
    if (isBlocked) {
        return (
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark bg-surface-primary/40 text-sm text-text-muted">
                <div className="flex items-center gap-2.5">
                    <Ban size={16} className="text-red-400 shrink-0" />
                    <span>You blocked @{tweet.author.username}. Their posts are hidden.</span>
                </div>
            </div>
        );
    }

    return (
        <article
            className="tweet-card relative flex gap-3 px-4 py-3.5 border-b border-border-dark hover:bg-white/[0.02] cursor-pointer transition-colors"
            onClick={() => navigate(`/tweet/${tweet.id}`)}
        >
            {/* Author Avatar */}
            <img
                src={
                    tweet.author.avatarUrl ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${tweet.author.username}`
                }
                alt={tweet.author.username}
                className="w-10 h-10 rounded-full object-cover bg-surface-secondary border border-border-dark flex-shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${tweet.author.username}`);
                }}
            />

            <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex justify-between items-center mb-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                            className="font-bold text-sm text-text-primary hover:underline cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${tweet.author.username}`);
                            }}
                        >
                            {tweet.author.username}
                        </span>
                        {tweet.author.isVerified && (
                            <CheckCircle size={14} className="text-accent-blue fill-accent-blue flex-shrink-0" />
                        )}
                        <span className="text-xs text-text-muted">@{tweet.author.username}</span>
                        <span className="text-xs text-text-muted">· {formatTime(tweet.createdAt)}</span>
                    </div>

                    {/* '...' More Options Button & Dropdown Menu */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((prev) => !prev);
                            }}
                            className="text-text-muted hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                            title="More options"
                            aria-expanded={menuOpen}
                        >
                            <MoreHorizontal size={17} />
                        </button>

                        {/* Dropdown Menu popover */}
                        {menuOpen && (
                            <div
                                ref={menuRef}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-50 w-56 rounded-2xl border border-white/10 bg-[#0e1217] py-2 shadow-2xl shadow-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
                            >
                                {!isAuthor ? (
                                    <>
                                        {/* 1. Not interested */}
                                        <button
                                            onClick={handleNotInterested}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-bold text-white transition-colors hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <Frown size={18} className="text-white shrink-0" />
                                            <span>Not interested in this post</span>
                                        </button>

                                        {/* 2. Follow / Unfollow */}
                                        <button
                                            onClick={handleToggleFollow}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-bold text-white transition-colors hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <UserMinus size={18} className="text-white shrink-0" />
                                                    <span>Unfollow @{tweet.author.username}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={18} className="text-white shrink-0" />
                                                    <span>Follow @{tweet.author.username}</span>
                                                </>
                                            )}
                                        </button>

                                        {/* 3. Block */}
                                        <button
                                            onClick={handleBlock}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-bold text-white transition-colors hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <Ban size={18} className="text-white shrink-0" />
                                            <span>Block @{tweet.author.username}</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Author: Delete Post */}
                                        <button
                                            onClick={handleDelete}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-bold text-red-500 transition-colors hover:bg-red-500/10 cursor-pointer"
                                        >
                                            <Trash2 size={18} className="text-red-500 shrink-0" />
                                            <span>Delete post</span>
                                        </button>

                                        {/* Author: Pin to profile */}
                                        <button
                                            onClick={handlePin}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-bold text-white transition-colors hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <Pin size={18} className="text-white shrink-0" />
                                            <span>Pin to your profile</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                    {renderContentWithHashtags(tweet.content)}
                </p>

                {/* Media preview (Standardized 1, 2, 3, 4, 4+ grid with +N overlay) */}
                {mediaList.length > 0 && (
                    <div
                        className={`tweet-media-grid count-${Math.min(mediaList.length, 4)} mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {mediaList.slice(0, 4).map((item, idx) => {
                            const isExtraTile = idx === 3 && mediaList.length > 4;
                            const remainingCount = mediaList.length - 4;

                            return (
                                <div
                                    key={item.id || idx}
                                    className="tweet-media-cell relative w-full h-full overflow-hidden bg-surface-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex(idx);
                                        setLightboxOpen(true);
                                    }}
                                >
                                    {item.mediaType === "VIDEO" ? (
                                        <video
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="w-full h-full object-cover block"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <source src={getMediaUrl(item.url)} />
                                            Your browser does not support video playback.
                                        </video>
                                    ) : (
                                        <img
                                            src={getMediaUrl(item.url)}
                                            alt={`Attachment ${idx + 1}`}
                                            loading="lazy"
                                            className="w-full h-full object-cover block hover:scale-102 transition-transform cursor-pointer"
                                        />
                                    )}

                                    {/* +N Overlay on the 4th tile when more than 4 attachments */}
                                    {isExtraTile && (
                                        <div
                                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-extrabold cursor-pointer hover:bg-black/45 transition-colors z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxIndex(3);
                                                setLightboxOpen(true);
                                            }}
                                        >
                                            <span>+{remainingCount + 1}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Engagement Action Bar */}
                <div className="flex justify-between items-center max-w-[440px] mt-3 text-text-muted">
                    {/* 1. Reply */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenReply) onOpenReply(tweet);
                            else navigate(`/tweet/${tweet.id}`);
                        }}
                        className="group flex items-center gap-1.5 text-xs hover:text-accent-blue p-1.5 -ml-1.5 rounded-full hover:bg-accent-blue/10 transition-colors cursor-pointer"
                        title="Reply"
                    >
                        <MessageCircle size={17} className="group-hover:scale-105 transition-transform" />
                        {tweet._count.replies > 0 && (
                            <span className="text-[12px] group-hover:text-accent-blue">
                                {formatMetricCount(tweet._count.replies)}
                            </span>
                        )}
                    </button>

                    {/* 2. Retweet */}
                    <button
                        onClick={handleRetweet}
                        className={`group flex items-center gap-1.5 text-xs hover:text-emerald-400 p-1.5 rounded-full hover:bg-emerald-500/10 transition-colors cursor-pointer ${
                            isRetweeted ? "text-emerald-400" : ""
                        }`}
                        title="Repost"
                    >
                        <Repeat size={17} className="group-hover:scale-105 transition-transform" />
                        {retweetsCount > 0 && (
                            <span className="text-[12px] group-hover:text-emerald-400">
                                {formatMetricCount(retweetsCount)}
                            </span>
                        )}
                    </button>

                    {/* 3. Like */}
                    <button
                        onClick={handleLike}
                        className={`group flex items-center gap-1.5 text-xs hover:text-pink-500 p-1.5 rounded-full hover:bg-pink-500/10 transition-colors cursor-pointer ${
                            isLiked ? "text-pink-500" : ""
                        }`}
                        title="Like"
                    >
                        <Heart
                            size={17}
                            fill={isLiked ? "rgb(236 72 153)" : "transparent"}
                            className="group-hover:scale-105 transition-transform"
                        />
                        {likesCount > 0 && (
                            <span className="text-[12px] group-hover:text-pink-500">
                                {formatMetricCount(likesCount)}
                            </span>
                        )}
                    </button>

                    {/* 4. Views & Real-time Analytics (BarChart2) */}
                    <button
                        onClick={handleAnalyticsClick}
                        className="group flex items-center gap-1.5 text-xs hover:text-accent-blue p-1.5 rounded-full hover:bg-accent-blue/10 transition-colors cursor-pointer"
                        title={isAuthor ? "View post analytics" : `Views: ${viewsCount.toLocaleString()}`}
                    >
                        <BarChart2 size={17} className="group-hover:scale-105 transition-transform" />
                        <span className="text-[12px] group-hover:text-accent-blue">
                            {formatMetricCount(viewsCount)}
                        </span>
                    </button>

                    {/* 5. Bookmark */}
                    <button
                        onClick={handleBookmark}
                        className={`group flex items-center gap-1.5 text-xs hover:text-accent-blue p-1.5 rounded-full hover:bg-accent-blue/10 transition-colors cursor-pointer ${
                            isBookmarked ? "text-accent-blue" : ""
                        }`}
                        title="Bookmark"
                    >
                        <Bookmark
                            size={17}
                            fill={isBookmarked ? "#1d9bf0" : "transparent"}
                            className="group-hover:scale-105 transition-transform"
                        />
                    </button>

                    {/* 6. Share */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShareModalOpen(true);
                        }}
                        className="group flex items-center gap-1.5 text-xs hover:text-accent-blue p-1.5 -mr-1.5 rounded-full hover:bg-accent-blue/10 transition-colors cursor-pointer"
                        title="Share post"
                    >
                        <Share2 size={16} className="group-hover:scale-105 transition-transform" />
                    </button>
                </div>
            </div>

            {/* In-Card Toast Notification */}
            {toastMessage && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 rounded-full bg-accent-blue px-4 py-1.5 text-xs font-bold text-white shadow-xl shadow-black/80 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap">
                    {toastMessage}
                </div>
            )}

            {/* Fullscreen Media Gallery Lightbox */}
            <MediaLightboxModal
                isOpen={lightboxOpen}
                media={mediaList.map((m) => ({ ...m, url: getMediaUrl(m.url) }))}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Post Activity / Analytics Modal */}
            <PostActivityModal
                isOpen={activityModalOpen}
                onClose={() => setActivityModalOpen(false)}
                tweet={tweet}
                impressions={viewsCount}
                likesCount={likesCount}
                retweetsCount={retweetsCount}
            />

            {/* Share Post Modal */}
            <SharePostModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                tweet={tweet}
            />
        </article>
    );
};
