"use client"

import { useState } from "react"
import Image from "next/image"
import { Shield, User } from "lucide-react"

import { Card } from "@/components/ui/card"
import { PasswordModal } from "@/components/auth/password-modal"
import type { UserRole } from "@/types"

export function HomePageClient() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedRole(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-10 space-y-8">
        <div className="relative mb-8 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
          <div className="w-full h-40 md:h-56 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-bon-green-start/20 to-bon-green-end/20 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="BON IF Logo"
                width={200}
                height={100}
                className="object-contain opacity-80"
                priority
              />
            </div>
          </div>
        </div>

        <section className="w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            본아이에프 운영 매뉴얼 챗봇
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-2xl">
            사장님이 매뉴얼을 일일이 찾지 않아도, 본사 운영 규정에 맞는 답변을 바로 받을 수 있는 똑똑한 챗봇입니다.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-bon-green-start/50 bg-white"
            onClick={() => handleRoleSelect("user")}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-bon-green-start to-bon-green-end group-hover:w-3 transition-all" />
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-100 group-hover:bg-green-50 text-slate-600 group-hover:text-bon-green-start transition-colors">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">사장님 모드</h3>
                <p className="text-slate-500 text-base mt-2">매장 운영 질문 및 매뉴얼 검색</p>
              </div>
            </div>
          </Card>

          <Card
            className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-bon-burgundy/50 bg-white"
            onClick={() => handleRoleSelect("admin")}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-bon-burgundy group-hover:w-3 transition-all" />
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-100 group-hover:bg-red-50 text-slate-600 group-hover:text-bon-burgundy transition-colors">
                <Shield className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">관리자 모드</h3>
                <p className="text-slate-500 text-base mt-2">규정 문서 관리 및 답변 모니터링</p>
              </div>
            </div>
          </Card>
        </div>

        <PasswordModal
          isOpen={modalOpen}
          onClose={closeModal}
          role={selectedRole}
        />
      </div>
    </div>
  )
}
