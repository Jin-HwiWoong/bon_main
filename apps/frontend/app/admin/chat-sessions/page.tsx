"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, MessageSquareText, Store } from "lucide-react"

import type { ChatSessionListItem, ChatSessionMessageItem } from "@bon/contracts"
import { LogoutButton } from "@/components/auth/logout-button"
import { useRequireAuth } from "@/components/auth/auth-provider"
import { getBranchChatMessages, getBranchChatSessions, getBranches } from "@/lib/api/admin-client"
import { Button } from "@/components/ui/button"
import { Branch } from "@/types"
import { useToast } from "@/components/ui/toast"

function formatSessionDate(value: string | null) {
    if (!value) {
        return "메시지 없음"
    }

    return new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value))
}

export default function AdminChatSessionsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { showToast } = useToast()
    const [branches, setBranches] = useState<Branch[]>([])
    const [sessions, setSessions] = useState<ChatSessionListItem[]>([])
    const [messages, setMessages] = useState<ChatSessionMessageItem[]>([])
    const [branchLoading, setBranchLoading] = useState(true)
    const [sessionLoading, setSessionLoading] = useState(false)
    const [messageLoading, setMessageLoading] = useState(false)
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
    const { isAuthorized, isLoading } = useRequireAuth({
        requiredRole: "admin",
        forbiddenMessage: "관리자만 접근 가능합니다."
    })
    const initialBranchId = Number(searchParams.get("branchId") || "")

    const loadSessionMessages = useCallback(async (branchId: number, sessionId: number) => {
        setMessageLoading(true)

        try {
            setSelectedBranchId(branchId)
            setSelectedSessionId(sessionId)
            setMessages(await getBranchChatMessages(branchId, sessionId) as ChatSessionMessageItem[])
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setMessageLoading(false)
        }
    }, [showToast])

    const loadBranchSessions = useCallback(async (branchId: number) => {
        setSessionLoading(true)
        setMessageLoading(true)

        try {
            const nextSessions = await getBranchChatSessions(branchId) as ChatSessionListItem[]
            setSelectedBranchId(branchId)
            setSessions(nextSessions)

            if (nextSessions.length > 0) {
                await loadSessionMessages(branchId, nextSessions[0].id)
                return
            }

            setSelectedSessionId(null)
            setMessages([])
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setSessionLoading(false)
            setMessageLoading(false)
        }
    }, [loadSessionMessages, showToast])

    const fetchBranches = useCallback(async () => {
        setBranchLoading(true)

        try {
            const nextBranches = await getBranches() as Branch[]
            setBranches(nextBranches)

            if (nextBranches.length > 0) {
                const preferredBranchId = nextBranches.some((branch) => branch.id === initialBranchId)
                    ? initialBranchId
                    : nextBranches[0].id
                await loadBranchSessions(preferredBranchId)
                return
            }

            setSelectedBranchId(null)
            setSelectedSessionId(null)
            setSessions([])
            setMessages([])
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setBranchLoading(false)
        }
    }, [initialBranchId, loadBranchSessions, showToast])

    useEffect(() => {
        if (!isAuthorized) {
            return
        }

        void fetchBranches()
    }, [fetchBranches, isAuthorized])

    if (isLoading || !isAuthorized) {
        return <div className="p-8 text-center text-slate-500">권한 확인 중...</div>
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col overflow-hidden rounded-2xl bg-white/90 shadow-xl backdrop-blur-sm">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/70 px-4 py-4 backdrop-blur-md md:px-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">지점별 대화 조회</h1>
                            <p className="text-sm text-slate-500">지점이 실제로 어떤 질문을 했는지 세션 단위로 확인합니다.</p>
                        </div>
                    </div>
                    <LogoutButton />
                </header>

                <main className="grid flex-1 gap-0 md:grid-cols-[280px_320px_1fr]">
                    <section className="border-r border-slate-200 bg-slate-50/70">
                        <div className="border-b border-slate-200 px-4 py-4">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Store className="h-4 w-4" /> 지점
                            </h2>
                        </div>
                        <div className="space-y-2 p-3">
                            {branchLoading ? (
                                <p className="px-3 py-4 text-sm text-slate-500">불러오는 중...</p>
                            ) : branches.length === 0 ? (
                                <p className="px-3 py-4 text-sm text-slate-500">등록된 지점이 없습니다.</p>
                            ) : branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    type="button"
                                    onClick={() => void loadBranchSessions(branch.id)}
                                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                                        selectedBranchId === branch.id
                                            ? "border-bon-burgundy bg-white shadow-sm"
                                            : "border-transparent hover:border-slate-200 hover:bg-white"
                                    }`}
                                >
                                    <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{branch.code}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="border-r border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-4 py-4">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <MessageSquareText className="h-4 w-4" /> 세션
                            </h2>
                        </div>
                        <div className="space-y-2 p-3">
                            {sessionLoading ? (
                                <p className="px-3 py-4 text-sm text-slate-500">불러오는 중...</p>
                            ) : sessions.length === 0 ? (
                                <p className="px-3 py-4 text-sm text-slate-500">저장된 세션이 없습니다.</p>
                            ) : sessions.map((session) => (
                                <button
                                    key={session.id}
                                    type="button"
                                    onClick={() => selectedBranchId && void loadSessionMessages(selectedBranchId, session.id)}
                                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                                        selectedSessionId === session.id
                                            ? "border-bon-green-start bg-slate-50"
                                            : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{session.title || "새 대화"}</p>
                                    <p className="mt-1 text-xs text-slate-500">{formatSessionDate(session.last_message_at)}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="flex min-h-[520px] flex-col bg-slate-50/50">
                        <div className="border-b border-slate-200 px-4 py-4">
                            <h2 className="text-sm font-semibold text-slate-700">메시지</h2>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            {messageLoading ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">메시지를 불러오는 중...</div>
                            ) : messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                    세션을 선택하면 대화 내용을 볼 수 있습니다.
                                </div>
                            ) : messages.map((message) => (
                                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                        message.role === "user"
                                            ? "rounded-tr-none bg-slate-900 text-white"
                                            : "rounded-tl-none border border-slate-200 bg-white text-slate-800"
                                    }`}>
                                        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                                        {message.references && message.references.length > 0 && (
                                            <div className="mt-3 border-t border-slate-100 pt-3">
                                                <p className="mb-2 text-xs font-semibold text-slate-500">참고 문서</p>
                                                <div className="space-y-2">
                                                    {message.references.map((reference, index) => (
                                                        <div key={`${reference.article_id}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                                            [{reference.category_code}] {reference.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}
