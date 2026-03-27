"use client"

import { useCallback, useEffect, useState } from "react"
import type { CreateCategoryRequest, UpdateCategoryRequest } from "@bon/contracts"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"

import { LogoutButton } from "@/components/auth/logout-button"
import { useRequireAuth } from "@/components/auth/auth-provider"
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/api/admin-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Category } from "@/types"
import { useToast } from "@/components/ui/toast"

type CategoryFormState = {
    code: string
    name: string
    description: string
    sort_order: number
    is_active: boolean
}

type CategorySavePayload = {
    name: string
    description: string | null
    sort_order: number
    is_active: boolean
    code?: string
}

const emptyForm: CategoryFormState = {
    code: "",
    name: "",
    description: "",
    sort_order: 0,
    is_active: true
}

export default function AdminCategoriesPage() {
    const router = useRouter()
    const { showToast } = useToast()

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [form, setForm] = useState<CategoryFormState>(emptyForm)
    const { isAuthorized, isLoading } = useRequireAuth({
        requiredRole: "admin",
        forbiddenMessage: "관리자만 접근 가능합니다."
    })

    const fetchCategories = useCallback(async () => {
        setLoading(true)
        try {
            setCategories(await getCategories())
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => {
        if (!isAuthorized) {
            return
        }

        void fetchCategories()
    }, [fetchCategories, isAuthorized])

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setModalOpen(true)
    }

    const openEdit = (category: Category) => {
        setEditing(category)
        setForm({
            code: category.code,
            name: category.name,
            description: category.description || "",
            sort_order: Number(category.sort_order) || 0,
            is_active: category.is_active
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditing(null)
        setForm(emptyForm)
    }

    const handleSave = async () => {
        const name = form.name.trim()
        const code = form.code.trim()

        if (!name) {
            showToast("카테고리 이름은 필수입니다.", "warning")
            return
        }
        if (!editing && !code) {
            showToast("카테고리 코드는 필수입니다.", "warning")
            return
        }

        setSaving(true)
        try {
            const payload: CategorySavePayload = {
                name,
                description: form.description.trim() || null,
                sort_order: Number(form.sort_order) || 0,
                is_active: form.is_active
            }

            if (!editing) {
                payload.code = code
            }

            if (editing) {
                await updateCategory(editing.id, payload as UpdateCategoryRequest)
            } else {
                await createCategory(payload as CreateCategoryRequest)
            }

            showToast(editing ? "수정되었습니다." : "등록되었습니다.", "success")
            closeModal()
            void fetchCategories()
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (category: Category) => {
        if (!confirm("정말 삭제하시겠습니까? 관련 문서도 함께 숨김 처리됩니다.")) return

        try {
            await deleteCategory(category.id)
            showToast("삭제되었습니다.", "success")
            void fetchCategories()
        } catch (error) {
            showToast(error instanceof Error ? error.message : "오류가 발생했습니다.", "error")
        }
    }

    if (isLoading || !isAuthorized) {
        return <div className="p-8 text-center text-slate-500">권한 확인 중...</div>
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-xl min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
                <header className="bg-white/50 border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900">카테고리 관리</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <LogoutButton />
                        <Button variant="gradient" className="gap-2" onClick={openCreate}>
                            <Plus className="w-4 h-4" /> 새 카테고리
                        </Button>
                    </div>
                </header>

                <main className="flex-1 px-6 py-8 space-y-6">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[700px]">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 md:px-6 w-28">코드</th>
                                        <th className="px-4 py-3 md:px-6 w-48">이름</th>
                                        <th className="px-4 py-3 md:px-6">설명</th>
                                        <th className="px-4 py-3 md:px-6 w-24 text-center">정렬</th>
                                        <th className="px-4 py-3 md:px-6 w-24 text-center">상태</th>
                                        <th className="px-4 py-3 md:px-6 w-24 text-center">문서</th>
                                        <th className="px-4 py-3 md:px-6 w-24 text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 md:px-6 text-center text-slate-500">로딩 중...</td>
                                        </tr>
                                    ) : categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 md:px-6 text-center text-slate-500">카테고리가 없습니다.</td>
                                        </tr>
                                    ) : categories.map((category) => (
                                        <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 md:px-6 align-middle">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs whitespace-nowrap">
                                                    {category.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 font-medium text-slate-900 align-middle">
                                                {category.name}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 text-slate-600 align-middle">
                                                <div className="line-clamp-2 min-w-[220px]">
                                                    {category.description || "설명 없음"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 text-center text-slate-600 align-middle">
                                                {category.sort_order}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 text-center align-middle">
                                                {category.is_active ? (
                                                    <span className="text-green-600 text-xs font-semibold">활성</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">비활성</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 text-center text-slate-600 align-middle">
                                                {category.article_count ?? 0}
                                            </td>
                                            <td className="px-4 py-3 md:px-6 text-right align-middle">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                                                        onClick={() => openEdit(category)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                                                        onClick={() => handleDelete(category)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editing ? "카테고리 수정" : "카테고리 추가"}
            >
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (!saving) handleSave()
                    }}
                >
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">코드</label>
                        <Input
                            placeholder="예: STORAGE"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            disabled={!!editing}
                        />
                        {editing && (
                            <p className="text-xs text-slate-400">코드는 생성 후 변경할 수 없습니다.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">이름</label>
                        <Input
                            placeholder="카테고리 이름"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">설명 (선택)</label>
                        <textarea
                            className="w-full min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-bon-green-start outline-none resize-none"
                            placeholder="카테고리 설명을 입력하세요"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">정렬 순서</label>
                            <Input
                                type="number"
                                value={form.sort_order}
                                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 text-bon-green-start border-gray-300 rounded focus:ring-bon-green-start"
                                />
                                <span className="text-sm font-medium text-slate-700">활성 상태</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={closeModal}>
                            취소
                        </Button>
                        <Button type="submit" variant="gradient" disabled={saving}>
                            {saving ? "저장 중..." : "저장"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
