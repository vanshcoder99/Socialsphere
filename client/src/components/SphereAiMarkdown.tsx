import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface SphereAiMarkdownProps {
    content: string;
    showCopy?: boolean;
}

export const SphereAiMarkdown: React.FC<SphereAiMarkdownProps> = ({
    content,
    showCopy = true,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Render formatted markdown lines
    const renderFormattedText = (text: string) => {
        const lines = text.split("\n");
        let inCodeBlock = false;
        let codeBlockLines: string[] = [];

        return lines.map((line, lineIdx) => {
            // Check code block
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    inCodeBlock = false;
                    const code = codeBlockLines.join("\n");
                    codeBlockLines = [];
                    return (
                        <pre
                            key={`code-${lineIdx}`}
                            className="my-2 p-2.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto"
                        >
                            <code>{code}</code>
                        </pre>
                    );
                } else {
                    inCodeBlock = true;
                    return null;
                }
            }

            if (inCodeBlock) {
                codeBlockLines.push(line);
                return null;
            }

            // Headers
            if (line.startsWith("### ")) {
                return (
                    <h4 key={lineIdx} className="font-bold text-sm text-text-primary mt-2 mb-1">
                        {renderInline(line.replace("### ", ""))}
                    </h4>
                );
            }
            if (line.startsWith("## ")) {
                return (
                    <h3 key={lineIdx} className="font-extrabold text-base text-text-primary mt-2.5 mb-1 text-cyan-300">
                        {renderInline(line.replace("## ", ""))}
                    </h3>
                );
            }

            // Bullet list items
            if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                const cleanItem = line.trim().replace(/^[-*]\s+/, "");
                return (
                    <li key={lineIdx} className="ml-4 list-disc text-xs sm:text-sm text-text-secondary leading-relaxed my-0.5">
                        {renderInline(cleanItem)}
                    </li>
                );
            }

            // Numbered list items
            if (/^\d+\.\s+/.test(line.trim())) {
                const match = line.trim().match(/^(\d+)\.\s+(.*)/);
                if (match) {
                    return (
                        <div key={lineIdx} className="flex items-start gap-1.5 text-xs sm:text-sm text-text-secondary leading-relaxed my-0.5">
                            <span className="font-bold text-accent-blue">{match[1]}.</span>
                            <span>{renderInline(match[2])}</span>
                        </div>
                    );
                }
            }

            // Empty line
            if (!line.trim()) {
                return <div key={lineIdx} className="h-1.5" />;
            }

            // Regular paragraph
            return (
                <p key={lineIdx} className="text-xs sm:text-sm text-text-primary leading-relaxed my-0.5">
                    {renderInline(line)}
                </p>
            );
        });
    };

    // Helper for bold, italic, and inline code
    const renderInline = (str: string) => {
        // Regex tokenize bold (**bold**), code (`code`), italic (*italic*)
        const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={i} className="font-bold text-text-primary text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
                return (
                    <code
                        key={i}
                        className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[11px] text-cyan-300"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }
            if (part.startsWith("*") && part.endsWith("*")) {
                return (
                    <em key={i} className="italic text-text-secondary">
                        {part.slice(1, -1)}
                    </em>
                );
            }
            return part;
        });
    };

    return (
        <div className="relative group/markdown">
            <div className="space-y-0.5">{renderFormattedText(content)}</div>
            {showCopy && (
                <div className="mt-2 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="opacity-0 group-hover/markdown:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-text-muted hover:text-accent-blue px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer"
                        title="Copy message"
                    >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                </div>
            )}
        </div>
    );
};
