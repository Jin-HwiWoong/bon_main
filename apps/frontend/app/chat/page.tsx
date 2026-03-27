"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, ChevronLeft, FileText, MessageSquarePlus, Send, User } from "lucide-react"

import type { ChatSessionListItem, ChatSessionMessageItem } from "@bon/contracts"
import { LogoutButton } from "@/components/auth/logout-button"
import { useRequireAuth } from "@/components/auth/auth-provider"
import { getChatSessionMessages, getChatSessions, openChatStream } from "@/lib/api/chat-client"
import { Button } from "@/components/ui/button"
import { Message } from "@/types"
import { useToast } from "@/components/ui/toast"

function mapChatMessage(message: ChatSessionMessageItem): Message {
    return {
        id: String(message.id),
        role: message.role,
        content: message.content,
        references: message.references ?? undefined
    }
}

function formatSessionLabel(session: ChatSessionListItem) {
    return session.title?.trim() || "새 대화"
}

function formatSessionDate(value: string | null) {
    if (!value) {
        return "메시지 없음"
    }

    const date = new Date(value)
    return new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date)
}

type ChatStreamMeta = {
    session_id?: number
    references?: Message["references"]
}

type ChatStreamChunk = {
    text?: string
}

type ChatStreamEvent =
    | { type: "meta"; data: ChatStreamMeta }
    | { type: "chunk"; data: ChatStreamChunk }
    | { type: "error"; data: { message?: string } | string }

function extractSseEvents(buffer: string): { events: ChatStreamEvent[]; rest: string } {
    const blocks = buffer.split("\n\n")
    const rest = blocks.pop() || ""
    const events: ChatStreamEvent[] = []

    for (const block of blocks) {
        const parsed = parseSseEvent(block)
        if (parsed) {
            events.push(parsed)
        }
    }

    return { events, rest }
}

function parseSseEvent(block: string): ChatStreamEvent | null {
    const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    const eventLine = lines.find((line) => line.startsWith("event:"))
    const dataLines = lines.filter((line) => line.startsWith("data:"))

    if (!eventLine || dataLines.length === 0) {
        return null
    }

    const eventType = eventLine.slice("event:".length).trim()
    const rawData = dataLines.map((line) => line.slice("data:".length).trim()).join("\n")

    if (!rawData) {
        return null
    }

    if (eventType === "meta") {
        return { type: "meta", data: JSON.parse(rawData) as ChatStreamMeta }
    }

    if (eventType === "chunk") {
        return { type: "chunk", data: JSON.parse(rawData) as ChatStreamChunk }
    }

    if (eventType === "error") {
        try {
            return { type: "error", data: JSON.parse(rawData) as { message?: string } }
        } catch {
            return { type: "error", data: rawData }
        }
    }

    return null
}

export default function ChatPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [sessions, setSessions] = useState<ChatSessionListItem[]>([])
    const [loading, setLoading] = useState(false)
    const [sessionsLoading, setSessionsLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sessionId, setSessionId] = useState<number | null>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { isAuthorized, isLoading } = useRequireAuth({
        requiredRole: "user",
        forbiddenMessage: "지점 계정만 접근 가능합니다."
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const loadSession = useCallback(async (targetSessionId: number) => {
        setMessagesLoading(true)

        try {
            setSessionId(targetSessionId)
            setMessages((await getChatSessionMessages(targetSessionId) as ChatSessionMessageItem[]).map(mapChatMessage))
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setMessagesLoading(false)
        }
    }, [showToast])

    const fetchSessions = useCallback(async (nextSessionId?: number | null) => {
        setSessionsLoading(true)

        try {
            const nextSessions = await getChatSessions() as ChatSessionListItem[]
            setSessions(nextSessions)

            const preferredSessionId = nextSessionId ?? sessionId
            if (preferredSessionId) {
                const exists = nextSessions.some((session) => session.id === preferredSessionId)
                if (exists) {
                    await loadSession(preferredSessionId)
                    return
                }
            }

            if (nextSessions.length > 0) {
                await loadSession(nextSessions[0].id)
                return
            }

            setSessionId(null)
            setMessages([])
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setSessionsLoading(false)
        }
    }, [loadSession, sessionId, showToast])

    useEffect(() => {
        if (!isAuthorized) {
            return
        }

        void fetchSessions()
    }, [fetchSessions, isAuthorized])

    const handleStartNewChat = () => {
        setSessionId(null)
        setMessages([])
        setInput("")
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading || !isAuthorized) return

        const question = input.trim()
        const userMsg: Message = { role: "user", content: question }
        const assistantMsgId = Date.now().toString()

        setMessages((prev) => [
            ...prev,
            userMsg,
            {
                role: "assistant",
                content: "",
                id: assistantMsgId
            }
        ])
        setInput("")
        setLoading(true)

        try {
            const response = await openChatStream({ question, session_id: sessionId ?? undefined })

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""
            let resolvedSessionId = sessionId

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const parsed = extractSseEvents(buffer)
                buffer = parsed.rest

                for (const event of parsed.events) {
                    if (event.type === "meta") {
                        if (event.data.session_id) {
                            resolvedSessionId = event.data.session_id
                            setSessionId(event.data.session_id)
                        }
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMsgId ? { ...msg, references: event.data.references } : msg
                            )
                        )
                    } else if (event.type === "chunk") {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMsgId ? { ...msg, content: msg.content + (event.data.text || "") } : msg
                            )
                        )
                    } else if (event.type === "error") {
                        const message =
                            typeof event.data === "string" ? event.data : event.data.message || "스트림 처리 중 오류가 발생했습니다."
                        throw new Error(message)
                    }
                }
            }

            if (buffer.trim()) {
                const parsed = extractSseEvents(`${buffer}\n\n`)
                for (const event of parsed.events) {
                    if (event.type === "meta") {
                        if (event.data.session_id) {
                            resolvedSessionId = event.data.session_id
                            setSessionId(event.data.session_id)
                        }
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMsgId ? { ...msg, references: event.data.references } : msg
                            )
                        )
                    } else if (event.type === "chunk") {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMsgId ? { ...msg, content: msg.content + (event.data.text || "") } : msg
                            )
                        )
                    }
                }
            }

            await fetchSessions(resolvedSessionId)
        } catch {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId
                        ? { ...msg, content: msg.content + "\n\n[오류가 발생했습니다. 잠시 후 다시 시도해주세요.]" }
                        : msg
                )
            )
        } finally {
            setLoading(false)
        }
    }

    if (isLoading || !isAuthorized) {
        return <div className="p-8 text-center text-slate-500">권한 확인 중...</div>
    }

    return (
        <div className="min-h-screen md:p-8 flex items-center justify-center">
            <div className="w-full h-[100dvh] md:h-[84vh] md:max-w-6xl bg-white/90 md:backdrop-blur-sm md:rounded-2xl md:shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                <aside className="hidden md:flex md:w-80 border-r border-slate-200 bg-slate-50/80 flex-col">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">대화 목록</h2>
                            <p className="text-sm text-slate-500">저장된 세션을 다시 열 수 있습니다.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleStartNewChat}>
                            <MessageSquarePlus className="w-4 h-4 mr-2" />
                            새 대화
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {sessionsLoading ? (
                            <p className="px-3 py-4 text-sm text-slate-500">불러오는 중...</p>
                        ) : sessions.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-slate-500">저장된 대화가 없습니다.</p>
                        ) : sessions.map((session) => (
                            <button
                                key={session.id}
                                type="button"
                                onClick={() => void loadSession(session.id)}
                                className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                                    sessionId === session.id
                                        ? "border-bon-green-start bg-white shadow-sm"
                                        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"
                                }`}
                            >
                                <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                    {formatSessionLabel(session)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">{formatSessionDate(session.last_message_at)}</p>
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="flex-1 flex flex-col">
                    <header className="flex-none flex items-center justify-between px-4 md:px-6 py-4 bg-white/80 backdrop-blur border-b border-slate-200 z-10">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push("/")}
                                className="shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-500" />
                            </Button>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900">운영 매뉴얼 챗봇</h2>
                                <p className="hidden md:block text-sm text-slate-500">
                                    {sessionId
                                        ? sessions.find((session) => session.id === sessionId)?.title || "저장된 대화"
                                        : "새 대화를 시작해보세요."}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleStartNewChat} className="md:hidden">
                                새 대화
                            </Button>
                            <span className="hidden md:inline-flex text-sm px-3 py-1 rounded-full border border-slate-200 text-slate-600 font-bold bg-slate-50">
                                사장님 모드
                            </span>
                            <LogoutButton />
                        </div>
                    </header>

                    <div className="md:hidden flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-3">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                type="button"
                                onClick={() => void loadSession(session.id)}
                                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                                    sessionId === session.id
                                        ? "border-bon-green-start bg-white text-slate-900"
                                        : "border-slate-200 bg-white text-slate-500"
                                }`}
                            >
                                {formatSessionLabel(session)}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                        {messagesLoading ? (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">대화를 불러오는 중...</div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                                    <p className="text-lg font-semibold text-slate-900">새 대화를 시작하세요</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        운영 규정, 발주, 위생, 응대 기준처럼 매장 운영 관련 질문을 입력하면 이전 대화와 함께 저장됩니다.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={msg.id ?? idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-slate-200" : "bg-bon-burgundy/10"}`}>
                                            {msg.role === "user" ? <User className="w-5 h-5 text-slate-600" /> : <Bot className="w-5 h-5 text-bon-burgundy" />}
                                        </div>

                                        <div className="space-y-2">
                                            <div className={`p-4 rounded-2xl text-base leading-relaxed whitespace-pre-wrap shadow-sm ${
                                                msg.role === "user"
                                                    ? "bg-gradient-to-br from-bon-green-start to-bon-green-end text-white rounded-tr-none"
                                                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                            }`}>
                                                {msg.content}
                                                {msg.role === "assistant" && msg.content === "" && loading && (
                                                    <div className="flex space-x-1 h-6 items-center">
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                    </div>
                                                )}

                                                {msg.references && msg.references.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                                        <p className="text-sm text-slate-500 mb-2 font-semibold flex items-center gap-1">
                                                            <FileText className="w-4 h-4" /> 참고 문서
                                                        </p>
                                                        <div className="flex flex-col gap-2">
                                                            {msg.references.map((ref, index) => (
                                                                <div
                                                                    key={`${ref.article_id}-${index}`}
                                                                    className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                                >
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <div className="px-1 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-bon-green-start font-bold text-xs shadow-sm">
                                                                            {ref.category_code}
                                                                        </div>
                                                                        <div className="truncate">
                                                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                                                {ref.title}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="flex-none p-4 bg-white border-t border-slate-200 pb-8 md:pb-4">
                        <form ref={formRef} onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        if (e.nativeEvent.isComposing) return
                                        formRef.current?.requestSubmit()
                                    }
                                }}
                                placeholder="궁금한 내용을 입력하세요..."
                                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-bon-green-start min-h-[50px] max-h-[150px]"
                                rows={1}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                variant="gradient"
                                className="w-12 h-auto rounded-xl shrink-0"
                                disabled={!input.trim() || loading}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
