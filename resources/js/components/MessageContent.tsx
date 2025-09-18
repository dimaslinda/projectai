import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageContentProps {
    content: string;
    className?: string;
}

interface TextPart {
    type: 'text';
    content: string;
}

interface CodePart {
    type: 'code';
    language: string;
    content: string;
}

type ContentPart = TextPart | CodePart;

interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            setCopied(true);
            console.log('Code copied successfully');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
            // Still show copied state even if there's an error
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative group my-6">
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 px-4 py-3 rounded-t-xl text-sm border border-gray-700 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium ml-2 text-gray-300">{language || 'code'}</span>
                </div>
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopy}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 rounded-lg cursor-pointer"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
                            <p>{copied ? "Copied!" : "Copy code"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="relative overflow-hidden rounded-b-xl border-x border-b border-gray-700 shadow-lg">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                    }}
                    showLineNumbers
                    lineNumberStyle={{
                        color: '#64748b',
                        fontSize: '12px',
                        paddingRight: '16px',
                        borderRight: '1px solid #374151',
                        marginRight: '16px',
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const MessageContent: React.FC<MessageContentProps> = ({ content, className = '' }) => {
    // Regex untuk mendeteksi code blocks dengan format ```language\ncode\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    // Split content berdasarkan code blocks
    const parts: ContentPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Tambahkan text sebelum code block
        if (match.index > lastIndex) {
            const textBefore = content.slice(lastIndex, match.index);
            if (textBefore.trim()) {
                parts.push({
                    type: 'text',
                    content: textBefore
                } as TextPart);
            }
        }

        // Tambahkan code block
        parts.push({
            type: 'code',
            language: match[1] || 'text',
            content: match[2]?.trim() || ''
        } as CodePart);

        lastIndex = match.index + match[0].length;
    }

    // Tambahkan sisa text setelah code block terakhir
    if (lastIndex < content.length) {
        const remainingText = content.slice(lastIndex);
        if (remainingText.trim()) {
            parts.push({
                type: 'text',
                content: remainingText
            } as TextPart);
        }
    }

    // Jika tidak ada code blocks, tampilkan sebagai text biasa
    if (parts.length === 0) {
        parts.push({
            type: 'text',
            content: content
        } as TextPart);
    }

    return (
        <div className={className}>
            {parts.map((part, index) => {
                if (part.type === 'code') {
                    return (
                        <CodeBlock
                            key={index}
                            language={part.language || 'text'}
                            code={part.content || ''}
                        />
                    );
                } else {
                    return (
                        <div key={index} className="whitespace-pre-wrap">
                            {part.content}
                        </div>
                    );
                }
            })}
        </div>
    );
};

export default MessageContent;