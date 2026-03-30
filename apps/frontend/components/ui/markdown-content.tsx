"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type MarkdownContentProps = {
    content: string;
    className?: string;
    emptyMessage?: string;
}

export function MarkdownContent({
    content,
    className,
    emptyMessage = "아직 작성된 내용이 없습니다."
}: MarkdownContentProps) {
    if (!content.trim()) {
        return (
            <div className={cn("rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500", className)}>
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className={cn("space-y-3 text-sm text-slate-700", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{children}</h1>,
                    h2: ({ children }) => <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">{children}</h2>,
                    h3: ({ children }) => <h3 className="mt-5 text-xl font-semibold text-slate-950">{children}</h3>,
                    h4: ({ children }) => <h4 className="mt-4 text-lg font-semibold text-slate-900">{children}</h4>,
                    p: ({ children }) => <p className="leading-7 text-slate-700">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc space-y-2 pl-6 marker:text-slate-400">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6 marker:text-slate-400">{children}</ol>,
                    li: ({ children }) => <li className="leading-7">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-slate-300 bg-slate-50 py-1 pl-4 text-slate-600">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="border-slate-200" />,
                    table: ({ children }) => (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900">{children}</th>,
                    td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top">{children}</td>,
                    img: ({ alt, src }) => {
                        if (!src) {
                            return null
                        }

                        return (
                            <img
                                src={src}
                                alt={alt || ""}
                                className="my-5 w-full rounded-xl border border-slate-200 bg-white object-contain"
                            />
                        )
                    },
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="font-medium text-bon-green-start underline-offset-2 hover:underline">
                            {children}
                        </a>
                    ),
                    code: ({ className: codeClassName, children, ...props }) => {
                        const isInline = !codeClassName
                        if (isInline) {
                            return (
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800" {...props}>
                                    {children}
                                </code>
                            )
                        }

                        return (
                            <code className={cn("block overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100", codeClassName)} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
