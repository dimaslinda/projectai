import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import React, { useState, memo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
    content: string;
    className?: string;
}

interface CodeBlockProps {
    language: string;
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = memo(({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
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
    }, [code]);

    return (
        <div className="group relative my-6">
            <div className="flex items-center justify-between rounded-t-xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 text-sm text-gray-200 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="ml-2 font-medium text-gray-300">{language || 'code'}</span>
                </div>
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopy}
                                className="h-8 w-8 cursor-pointer rounded-lg p-0 text-gray-400 transition-all duration-200 hover:bg-gray-700/50 hover:text-white"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="border-gray-700 bg-gray-900 text-white">
                            <p>{copied ? 'Copied!' : 'Copy code'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="relative overflow-x-auto rounded-b-xl border-x border-b border-gray-700 shadow-lg">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={oneDark}
                    wrapLongLines
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                    }}
                    codeTagProps={{
                        style: {
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                        },
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
});

const MessageContent: React.FC<MessageContentProps> = memo(({ content, className = '' }) => {
    // Check if this is an error message
    const isErrorMessage = React.useMemo(() => 
        content.includes('Maaf, saya tidak dapat') ||
        content.includes('Terjadi kesalahan') ||
        content.includes('Sorry, I cannot') ||
        content.includes('An error occurred') ||
        content.includes('tidak dapat memproses') ||
        content.includes('cannot process'), [content]);

    if (isErrorMessage) {
        return (
            <div className={`${className} rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
                    <div className="leading-relaxed break-anywhere text-red-700 dark:text-red-300">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`break-anywhere ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom renderer for code blocks
                    code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const inline = !language;

                        if (!inline && language) {
                            return <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />;
                        }

                        // Inline code
                        return (
                            <code
                                className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200 break-anywhere whitespace-pre-wrap"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    // Custom styling for other elements
                    h1: ({ children }) => <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 leading-relaxed break-anywhere text-gray-700 dark:text-gray-300">{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-2 break-anywhere text-gray-700 dark:text-gray-300">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-2 break-anywhere text-gray-700 dark:text-gray-300">{children}</ol>,
                    li: ({ children }) => <li className="pl-2 leading-relaxed break-anywhere">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                    em: ({ children }) => <em className="text-gray-800 italic dark:text-gray-200">{children}</em>,
                    blockquote: ({ children }) => (
                        <blockquote className="my-4 border-l-4 border-gray-300 pl-4 text-gray-600 italic break-anywhere dark:border-gray-600 dark:text-gray-400">
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }) => (
                        <a href={href} className="text-blue-600 hover:underline break-anywhere dark:text-blue-400" target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default MessageContent;
