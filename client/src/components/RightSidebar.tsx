import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, TrendingUp, CheckCircle, Loader2, UserPlus, Check, Hash, X } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../features/auth/hooks";
import type { User, TrendingTopic } from "../types";

interface RightSidebarProps {
    onOpenPremiumModal?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onOpenPremiumModal }) => {
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searchHashtags, setSearchHashtags] = useState<TrendingTopic[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [trends, setTrends] = useState<TrendingTopic[]>([]);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
    const [suggestedLoading, setSuggestedLoading] = useState(false);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
    const [requestIdMap, setRequestIdMap] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            const trimmed = searchQuery.trim();
            if (!trimmed) {
                setSearchResults([]);
                setSearchHashtags([]);
                setIsSearching(false);
                setIsDropdownOpen(false);
                return;
            }

            const clean = trimmed.replace(/^[@#]/, "").trim();
            setIsSearching(true);
            setIsDropdownOpen(true);

            try {
                const [userRes, hashtagRes] = await Promise.all([
                    api.get(`/users/search?q=${encodeURIComponent(clean || trimmed)}`),
                    api.get(`/tweets/search/hashtags?q=${encodeURIComponent(clean || trimmed)}`),
                ]);
                setSearchResults(userRes.data?.users || []);
                setSearchHashtags(hashtagRes.data?.hashtags || []);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, searchQuery.trim() ? 250 : 0);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    useEffect(() => {
        let isCancelled = false;
        const fetchTrends = async () => {
            setTrendsLoading(true);
            try {
                const { data } = await api.get("/tweets/trending?limit=5");
                if (!isCancelled) {
                    setTrends(data.trends || []);
                }
            } catch {
                if (!isCancelled) {
                    setTrends([]);
                }
            } finally {
                if (!isCancelled) {
                    setTrendsLoading(false);
                }
            }
        };

        const fetchSuggested = async () => {
            setSuggestedLoading(true);
            try {
                const { data } = await api.get("/users/suggested?limit=3");
                if (!isCancelled) {
                    const users = data.users || [];
                    setSuggestedUsers(users);
                    setFollowingMap(Object.fromEntries(users.map((user: User) => [user.id, !!user.isFollowing])));
                    setRequestedMap(Object.fromEntries(users.map((user: User) => [user.id, !!user.isFollowRequested])));
                    setRequestIdMap(Object.fromEntries(users.filter((user: User) => user.followRequestId).map((user: User) => [user.id, user.followRequestId as string])));
                }
            } catch {
                if (!isCancelled) {
                    setSuggestedUsers([]);
                }
            } finally {
                if (!isCancelled) {
                    setSuggestedLoading(false);
                }
            }
        };

        fetchTrends();
        fetchSuggested();

        return () => {
            isCancelled = true;
        };
    }, [currentUser?.id]);

    const handleSelectUser = (username: string) => {
        setSearchQuery("");
        setSearchResults([]);
        setSearchHashtags([]);
        setIsDropdownOpen(false);
        navigate(`/profile/${username}`);
    };

    const handleSelectHashtag = (tag: string) => {
        const clean = tag.replace(/^#/, "").trim();
        setSearchQuery("");
        setSearchResults([]);
        setSearchHashtags([]);
        setIsDropdownOpen(false);
        navigate(`/explore?tag=${encodeURIComponent(clean)}`);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        const clean = trimmed.replace(/^[@#]/, "").trim();
        setIsDropdownOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setSearchHashtags([]);

        if (trimmed.startsWith("@")) {
            navigate(`/profile/${encodeURIComponent(clean)}`);
        } else if (trimmed.startsWith("#")) {
            navigate(`/explore?tag=${encodeURIComponent(clean)}`);
        } else if (searchResults.length > 0 && searchHashtags.length === 0) {
            navigate(`/profile/${searchResults[0].username}`);
        } else {
            navigate(`/explore?tag=${encodeURIComponent(clean)}`);
        }
    };

    const handleToggleFollow = async (e: React.MouseEvent, targetUser: User) => {
        e.stopPropagation();
        if (!currentUser) {
            navigate("/auth");
            return;
        }

        try {
            if (followingMap[targetUser.id]) {
                await api.post(`/users/unfollow/${targetUser.id}`);
                setFollowingMap((prev) => ({ ...prev, [targetUser.id]: false }));
            } else if (requestedMap[targetUser.id] && requestIdMap[targetUser.id]) {
                await api.post(`/users/follow-requests/${requestIdMap[targetUser.id]}/cancel`);
                setRequestedMap((prev) => ({ ...prev, [targetUser.id]: false }));
                setRequestIdMap((prev) => ({ ...prev, [targetUser.id]: "" }));
            } else {
                const { data } = await api.post(`/users/follow/${targetUser.id}`);
                setFollowingMap((prev) => ({ ...prev, [targetUser.id]: !!data.isFollowing }));
                setRequestedMap((prev) => ({ ...prev, [targetUser.id]: !!data.isRequested }));
                if (data.followRequestId) setRequestIdMap((prev) => ({ ...prev, [targetUser.id]: data.followRequestId }));
            }
        } catch (err) {
            console.error("Follow action failed:", err);
        }
    };

    return (
        <aside className="right-sidebar hidden xl:flex w-[350px] 2xl:w-[380px] h-full overflow-y-auto overflow-x-hidden pt-3 px-4 xl:px-5 pb-28 flex-col gap-5 flex-shrink-0 overscroll-contain">
            {/* Search Input with Autocomplete */}
            <div id="search-section" ref={searchContainerRef} className="sticky top-0 z-20 bg-black pt-1 pb-2">
                <form id="search-form" onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        {isSearching ? (
                            <Loader2
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-blue animate-spin"
                            />
                        ) : (
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                            />
                        )}
                        <input
                            id="search-input"
                            type="text"
                            placeholder="Search SocialSphere (#tags, @users, ids)"
                            value={searchQuery}
                            onFocus={() => {
                                if (searchQuery.trim()) setIsDropdownOpen(true);
                            }}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-card border border-border-dark rounded-full py-2.5 pl-10 pr-9 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:bg-black focus:outline-none focus:ring-1 focus:ring-accent-blue transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSearchResults([]);
                                    setSearchHashtags([]);
                                    setIsDropdownOpen(false);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                title="Clear search"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </form>

                {/* Autocomplete Dropdown */}
                {isDropdownOpen && searchQuery.trim().length > 0 && (
                    <div
                        id="search-autocomplete-dropdown"
                        className="absolute top-13 left-0 right-0 bg-surface-card border border-border-dark rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[380px] overflow-y-auto"
                    >
                        {/* Quick Direct Hashtag Search Action */}
                        <div
                            onClick={() => handleSelectHashtag(searchQuery.trim().replace(/^[@#]/, ""))}
                            className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer border-b border-border-dark hover:bg-white/5 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-full bg-accent-blue/15 flex items-center justify-center text-accent-blue flex-shrink-0 group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                <Hash size={16} />
                            </div>
                            <div className="min-w-0">
                                <span className="font-bold text-sm text-text-primary group-hover:text-accent-blue transition-colors truncate block">
                                    Search for #{searchQuery.trim().replace(/^[@#]/, "")}
                                </span>
                                <span className="text-[0.72rem] text-text-secondary truncate block">
                                    Explore posts with this hashtag
                                </span>
                            </div>
                        </div>

                        {/* Hashtag Results Section */}
                        {searchHashtags.length > 0 && (
                            <div>
                                <div className="px-3.5 pt-2 pb-1 text-[0.68rem] font-black uppercase tracking-wider text-text-muted bg-surface-secondary/40 border-b border-border-dark/60">
                                    Hashtags
                                </div>
                                {searchHashtags.map((h) => (
                                    <div
                                        key={h.id || h.tag}
                                        onClick={() => handleSelectHashtag(h.tag)}
                                        className="flex items-center justify-between px-3.5 py-2 cursor-pointer border-b border-border-dark/40 hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-accent-blue flex-shrink-0">
                                                <Hash size={14} />
                                            </div>
                                            <span className="font-bold text-sm text-text-primary group-hover:text-accent-blue group-hover:underline truncate">
                                                #{h.tag}
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-muted flex-shrink-0">
                                            {h.tweetCount} {h.tweetCount === 1 ? "post" : "posts"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* User / ID Results Section */}
                        {searchResults.length > 0 && (
                            <div>
                                <div className="px-3.5 pt-2 pb-1 text-[0.68rem] font-black uppercase tracking-wider text-text-muted bg-surface-secondary/40 border-b border-border-dark/60">
                                    Accounts & IDs
                                </div>
                                {searchResults.map((u) => (
                                    <div
                                        key={u.id}
                                        onClick={() => handleSelectUser(u.username)}
                                        className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer border-b border-border-dark/40 hover:bg-white/5 transition-colors group"
                                    >
                                        <img
                                            src={
                                                u.avatarUrl ||
                                                `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`
                                            }
                                            alt={u.username}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-surface-secondary border border-border-dark"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-sm text-text-primary group-hover:underline truncate">
                                                    {u.username}
                                                </span>
                                                {u.isVerified && (
                                                    <CheckCircle
                                                        size={13}
                                                        className="text-accent-blue fill-accent-blue flex-shrink-0"
                                                    />
                                                )}
                                            </div>
                                            <span className="text-xs text-text-secondary truncate block">
                                                @{u.username}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchHashtags.length === 0 && searchResults.length === 0 && !isSearching && (
                            <div className="p-3 text-center text-xs text-text-muted">
                                Press Enter to search posts for "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Trending Widget */}
            <div className="bg-surface-card border border-border-dark rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-2 text-base font-extrabold text-white mb-3.5">
                    <TrendingUp size={20} className="text-accent-blue" />
                    <span>Trending</span>
                </div>
                <div className="flex flex-col gap-3.5">
                    {trendsLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 size={20} className="animate-spin text-accent-blue" />
                        </div>
                    ) : trends.length === 0 ? (
                        <div className="text-xs text-text-muted py-1">
                            No trending topics right now. Post with #hashtags to start one!
                        </div>
                    ) : (
                        trends.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => navigate(`/explore?tag=${t.tag}`)}
                                className="cursor-pointer group py-0.5"
                            >
                                <span className="text-[0.75rem] text-text-muted block">
                                    Trending Topic
                                </span>
                                <div className="font-bold text-sm text-text-primary group-hover:text-accent-blue group-hover:underline transition-colors">
                                    #{t.tag}
                                </div>
                                <span className="text-[0.75rem] text-text-muted block">
                                    {t.tweetCount} {t.tweetCount === 1 ? "post" : "posts"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Who to follow Widget */}
            <div className="bg-surface-card border border-border-dark rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-2 text-base font-extrabold text-white mb-3.5">
                    <UserPlus size={19} className="text-accent-blue" />
                    <span>Who to follow</span>
                </div>
                <div className="flex flex-col gap-3">
                    {suggestedLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 size={20} className="animate-spin text-accent-blue" />
                        </div>
                    ) : suggestedUsers.length === 0 ? (
                        <div className="text-xs text-text-muted py-1">
                            No suggested profiles found. Check back later!
                        </div>
                    ) : (
                        suggestedUsers.map((su) => {
                            const isFollowed = !!followingMap[su.id];
                            const isRequested = !!requestedMap[su.id];
                            return (
                                <div
                                    key={su.id}
                                    onClick={() => navigate(`/profile/${su.username}`)}
                                    className="flex items-center justify-between gap-2.5 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                            src={
                                                su.avatarUrl ||
                                                `https://api.dicebear.com/7.x/identicon/svg?seed=${su.username}`
                                            }
                                            alt={su.username}
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-surface-secondary border border-border-dark"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-sm text-text-primary truncate hover:underline">
                                                    {su.username}
                                                </span>
                                                {su.isVerified && (
                                                    <CheckCircle
                                                        size={13}
                                                        className="text-accent-blue fill-accent-blue flex-shrink-0"
                                                    />
                                                )}
                                            </div>
                                            <span className="text-xs text-text-secondary truncate block">
                                                @{su.username}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Follow Pill Button (White pill as in Reference 3) */}
                                    <button
                                        onClick={(e) => handleToggleFollow(e, su)}
                                        className={
                                            isFollowed
                                                ? "bg-transparent hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-500 border border-white/20 text-white font-bold text-xs py-1.5 px-4 rounded-full transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                                                : isRequested
                                                ? "bg-transparent border border-accent-blue/50 text-accent-blue font-bold text-xs py-1.5 px-4 rounded-full transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                                                : "bg-white hover:bg-gray-200 text-black font-bold text-xs py-1.5 px-4 rounded-full transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-sm"
                                        }
                                    >
                                        {isFollowed ? (
                                            <>
                                                <Check size={14} />
                                                <span>Following</span>
                                            </>
                                        ) : isRequested ? (
                                            <span>Requested</span>
                                        ) : (
                                            <span>{su.isPrivate ? "Request Follow" : "Follow"}</span>
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Premium CTA Card */}
            <div className="premium-cta rounded-2xl border border-premium-violet/35 bg-surface-card p-4 shadow-lg shadow-purple-950/20">
                <div className="flex items-center gap-2 text-premium-violet mb-1.5">
                    <Sparkles size={20} />
                    <span className="font-extrabold text-base">SocialSphere Premium</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                    Subscribe to unlock up to <strong>10,000 character tweets</strong>, blue verification badge, and priority AI suggestions.
                </p>
                <button
                    onClick={onOpenPremiumModal}
                    className="mt-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-bold text-xs py-2 px-4 rounded-full transition-all cursor-pointer shadow-md shadow-purple-900/30"
                >
                    Upgrade to Premium
                </button>
            </div>
        </aside>
    );
};
