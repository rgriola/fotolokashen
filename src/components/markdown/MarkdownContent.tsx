'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
    content: string;
    className?: string;
}

/**
 * Client component that renders markdown into styled HTML.
 * Separated from the layout so Server Components can import the layout
 * while this handles the client-side react-markdown rendering.
 */
export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
    return (
        <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Style headings
                    h1: ({ children }) => (
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold mb-4 mt-8">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mb-2 mt-6">{children}</h3>
                    ),
                    // Style paragraphs
                    p: ({ children }) => (
                        <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
                    ),
                    // Style lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4 mb-4">{children}</ol>
                    ),
                    // Style emphasis
                    em: ({ children }) => (
                        <em className="text-muted-foreground">{children}</em>
                    ),
                    strong: ({ children }) => (
                        <strong className="text-foreground font-semibold">{children}</strong>
                    ),
                    // Style links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-primary hover:underline"
                            target={href?.startsWith('http') ? '_blank' : undefined}
                            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                            {children}
                        </a>
                    ),
                    // Style horizontal rules
                    hr: () => <hr className="my-8 border-border" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
