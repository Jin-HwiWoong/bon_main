"use client"

import { useState, useRef, useEffect } from "react"
import { previewChat } from "@/lib/api/admin-client"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

interface PreviewChatModalProps {
    isOpen: boolean
    onClose: () => void
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    metadata?: PreviewMessageMetadata;
}

interface PreviewReference {
    title?: string;
}

interface PreviewChunk {
    content: string;
    score?: number;
}

interface PreviewMessageMetadata {
    references?: PreviewReference[];
    used_chunks?: PreviewChunk[];
}

export function PreviewChatModal({ isOpen, onClose }: PreviewChatModalProps) {
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) {
            setInput("")
            setMessages([])
            setLoading(false)
            return
        }

        setMessages([{ role: "assistant", content: "프리뷰 모드입니다. 테스트할 질문을 입력해주세요." }])
    }, [isOpen])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)

        try {
            const data = await previewChat(userMsg.content)

            const assistantMsg: Message = {
                role: 'assistant',
                content: data.answer,
                metadata: {
                    references: data.references,
                    used_chunks: data.used_chunks
                }
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            const message = error instanceof Error ? error.message : "프리뷰 호출 중 오류가 발생했습니다."
            setMessages(prev => [...prev, { role: "assistant", content: message }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="챗봇 프리뷰">
            <div className="flex flex-col h-[600px] -mx-6 -my-2">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-3 rounded-lg text-sm max-w-[80%] text-left ${msg.role === 'user'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-800'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                            {/* Metadata for Admin */}
                            {msg.role === 'assistant' && msg.metadata && (
                                <div className="text-xs text-left bg-slate-100 p-2 rounded border border-slate-200 mt-1 max-w-[90%] mx-auto">
                                    <p className="font-bold text-slate-600">사용 청크</p>
                                    <ul className="list-disc list-inside text-slate-500 mb-2">
                                        {msg.metadata.used_chunks?.map((chunk: PreviewChunk, i: number) => (
                                            <li key={i}>{chunk.content.substring(0, 30)}... (점수: {chunk.score ?? "-"})</li>
                                        ))}
                                    </ul>
                                    <p className="font-bold text-slate-600">참고 문서</p>
                                    <div className="flex flex-wrap gap-1">
                                        {msg.metadata.references?.map((ref: PreviewReference, i: number) => (
                                            <span key={i} className="px-1 bg-white border border-slate-200 rounded text-[10px]">{ref.title}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && <div className="text-center text-xs text-slate-400">답변 생성 중...</div>}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                    <input
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-slate-900"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="질문을 입력하세요"
                    />
                    <Button type="submit" size="sm">전송</Button>
                </form>
            </div>
        </Modal>
    )
}
