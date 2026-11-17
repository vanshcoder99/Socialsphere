import React from "react";

interface SphereAiIconProps {
    size?: number;
    className?: string;
    showPulse?: boolean;
}

export const SphereAiIcon: React.FC<SphereAiIconProps> = ({
    size = 28,
    className = "",
    showPulse = false,
}) => {
    return (
        <div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            {showPulse && (
                <div
                    className="absolute inset-0 rounded-full animate-ping opacity-25"
                    style={{
                        background: "radial-gradient(circle, #38bdf8 0%, #818cf8 50%, #c084fc 100%)",
                    }}
                />
            )}
            <svg
                width={size}
                height={size}
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 transition-transform duration-300 group-hover:scale-105"
            >
                <defs>
                    <radialGradient
                        id="sphereGradient"
                        cx="32%"
                        cy="28%"
                        r="75%"
                        fx="28%"
                        fy="24%"
                    >
                        <stop offset="0%" stopColor="#67e8f9" />
                        <stop offset="35%" stopColor="#38bdf8" />
                        <stop offset="70%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#9333ea" />
                    </radialGradient>
                    <linearGradient
                        id="orbitRing"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#c084fc" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                    </linearGradient>
                    <filter id="sphereGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.45" />
                    </filter>
                </defs>

                {/* Outer Orbit Halo */}
                <ellipse
                    cx="18"
                    cy="18"
                    rx="16"
                    ry="7.5"
                    transform="rotate(-28 18 18)"
                    stroke="url(#orbitRing)"
                    strokeWidth="1.6"
                    strokeDasharray="4 2.5"
                    fill="none"
                />

                {/* Glowing Core Sphere */}
                <circle
                    cx="18"
                    cy="18"
                    r="11.5"
                    fill="url(#sphereGradient)"
                    filter="url(#sphereGlow)"
                />

                {/* Top-Left Specular Reflection Highlight */}
                <ellipse
                    cx="14.5"
                    cy="13"
                    rx="4"
                    ry="2"
                    transform="rotate(-35 14.5 13)"
                    fill="#ffffff"
                    fillOpacity="0.5"
                />

                {/* Central AI Sparkle Star */}
                <path
                    d="M18 10.5C18 14 14.5 17.5 11 17.5C14.5 17.5 18 21 18 24.5C18 21 21.5 17.5 25 17.5C21.5 17.5 18 14 18 10.5Z"
                    fill="#ffffff"
                    fillOpacity="0.92"
                />
                <circle cx="18" cy="17.5" r="1.3" fill="#ffffff" />
            </svg>
        </div>
    );
};
