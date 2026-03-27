"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/components/auth/auth-provider"

type LogoutButtonProps = {
    label?: string
    variant?: "default" | "outline" | "ghost" | "gradient"
    className?: string
}

export function LogoutButton({
    label = "로그아웃",
    variant = "outline",
    className
}: LogoutButtonProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const { logout } = useAuth()
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)

        try {
            await logout()
            showToast("로그아웃되었습니다.", "success")
            router.replace("/")
        } catch {
            showToast("로그아웃 중 오류가 발생했습니다.", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            type="button"
            variant={variant}
            onClick={() => void handleLogout()}
            disabled={loading}
            className={className}
        >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? "처리 중..." : label}
        </Button>
    )
}
