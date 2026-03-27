"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Folder, FileText, MessagesSquare, Store, ChevronRight, ChevronLeft } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { useRequireAuth } from "@/components/auth/auth-provider"
import { getCategories } from "@/lib/api/admin-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Category } from "@/types"
import { PreviewChatModal } from "@/components/admin/preview-chat-modal"

export default function AdminDashboard() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [previewOpen, setPreviewOpen] = useState(false)
    const { isAuthorized, isLoading } = useRequireAuth({
        requiredRole: "admin",
        forbiddenMessage: "관리자만 접근 가능합니다."
    })

    const fetchCategories = useCallback(async () => {
        try {
            setCategories(await getCategories())
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!isAuthorized) {
            return
        }

        void fetchCategories()
    }, [fetchCategories, isAuthorized])

    if (isLoading || !isAuthorized) {
        return <div className="p-8 text-center text-slate-500">권한 확인 중...</div>
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-xl shadow-xl min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
                <header className="bg-white/50 border-b border-slate-200 px-4 py-4 md:px-6 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                            <ChevronLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                        <h1 className="text-lg md:text-xl font-bold text-slate-900">관리자 대시보드</h1>
                    </div>
                    <LogoutButton />
                </header>

                <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
                    <section className="mb-8">
                        <div className="grid gap-4 md:grid-cols-2 mb-8">
                            <Card
                                className="p-6 cursor-pointer hover:shadow-md transition-shadow group bg-white border-slate-200"
                                onClick={() => router.push("/admin/branches")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-bon-burgundy/10 group-hover:text-bon-burgundy transition-colors">
                                        <Store className="w-6 h-6 text-slate-600 group-hover:text-bon-burgundy" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900">지점 계정 관리</h3>
                                        <p className="text-sm text-slate-500">지점 코드, 지점명, 비밀번호, 활성 상태를 관리합니다.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                                </div>
                            </Card>

                            <Card
                                className="p-6 cursor-pointer hover:shadow-md transition-shadow group bg-white border-slate-200"
                                onClick={() => router.push("/admin/chat-sessions")}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-bon-green-start/10 group-hover:text-bon-green-end transition-colors">
                                        <MessagesSquare className="w-6 h-6 text-slate-600 group-hover:text-bon-green-end" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900">지점 대화 조회</h3>
                                        <p className="text-sm text-slate-500">지점별 질문 이력과 답변 근거를 세션 단위로 확인합니다.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                                </div>
                            </Card>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">카테고리 관리</h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/admin/categories')}
                            >
                                카테고리 편집
                            </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {loading ? (
                                <p className="text-slate-500">로딩 중...</p>
                            ) : categories.map((cat) => (
                                <Card
                                    key={cat.id}
                                    className="p-6 cursor-pointer hover:shadow-md transition-shadow group bg-white border-slate-200"
                                    onClick={() => router.push(`/admin/articles?category=${cat.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-bon-burgundy/10 group-hover:text-bon-burgundy transition-colors">
                                            <Folder className="w-6 h-6 text-slate-600 group-hover:text-bon-burgundy" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                            {cat.code}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{cat.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                                        {cat.description || "설명 없음"}
                                    </p>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <FileText className="w-4 h-4 mr-1" />
                                        <span>문서 {cat.article_count}개</span>
                                        <ChevronRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-900" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Placeholder for Preview Chat or other widgets */}
                    <section>
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-white flex justify-between items-center shadow-lg">
                            <div>
                                <h3 className="text-xl font-bold mb-2">프리뷰 챗</h3>
                                <p className="text-slate-300 mb-4">관리자 권한으로 답변 품질을 점검해보세요.</p>
                            </div>
                            <button
                                onClick={() => setPreviewOpen(true)}
                                className="bg-white text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                            >
                                챗봇 시작하기
                            </button>
                        </div>
                    </section>
                </main>

                <PreviewChatModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} />
            </div>
        </div>
    )
}
