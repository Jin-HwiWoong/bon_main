"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { AuthUserPayload } from "@bon/contracts"
import { getCurrentUser, logout as logoutRequest } from "@/lib/api/auth-client"
import type { UserRole } from "@/types"
import { useToast } from "@/components/ui/toast"

const AUTH_STORAGE_KEY = "bon_auth"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type StoredAuthMarker = {
    role: UserRole
    identifier: string | null
    user: AuthUserPayload | null
}

type AuthSession = {
    role: UserRole
    identifier: string | null
    user: AuthUserPayload
}

type AuthContextValue = {
    status: AuthStatus
    session: AuthSession | null
    setAuthenticated: (user: AuthUserPayload, identifier?: string | null) => void
    refreshSession: () => Promise<AuthSession | null>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function toUserRole(user: AuthUserPayload): UserRole {
    return user.role === "branch" ? "user" : "admin"
}

function createSession(user: AuthUserPayload, identifier?: string | null): AuthSession {
    return {
        role: toUserRole(user),
        identifier: identifier ?? user.branchCode ?? user.branchName ?? null,
        user
    }
}

function readStoredAuth(): StoredAuthMarker | null {
    if (typeof window === "undefined") {
        return null
    }

    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
        return null
    }

    try {
        return JSON.parse(raw) as StoredAuthMarker
    } catch {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
        return null
    }
}

function writeStoredAuth(session: AuthSession) {
    if (typeof window === "undefined") {
        return
    }

    window.sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
            role: session.role,
            identifier: session.identifier,
            user: session.user
        } satisfies StoredAuthMarker)
    )
}

function clearStoredAuth() {
    if (typeof window === "undefined") {
        return
    }

    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

export function AuthProvider({
    children,
    initialUser
}: {
    children: ReactNode
    initialUser?: AuthUserPayload | null
}) {
    const [status, setStatus] = useState<AuthStatus>(initialUser ? "authenticated" : "unauthenticated")
    const [session, setSession] = useState<AuthSession | null>(
        initialUser ? createSession(initialUser) : null
    )

    const setAuthenticated = useCallback((user: AuthUserPayload, identifier?: string | null) => {
        const stored = readStoredAuth()
        const nextSession = createSession(user, identifier ?? stored?.identifier ?? null)

        writeStoredAuth(nextSession)
        setSession(nextSession)
        setStatus("authenticated")
    }, [])

    const clearAuth = useCallback(() => {
        clearStoredAuth()
        setSession(null)
        setStatus("unauthenticated")
    }, [])

    const refreshSession = useCallback(async () => {
        try {
            const data = await getCurrentUser()
            if (!data) {
                clearAuth()
                return null
            }

            const user = data as AuthUserPayload
            const stored = readStoredAuth()
            const nextSession = createSession(user, stored?.identifier ?? null)

            writeStoredAuth(nextSession)
            setSession(nextSession)
            setStatus("authenticated")
            return nextSession
        } catch {
            clearAuth()
            return null
        }
    }, [clearAuth])

    const logout = useCallback(async () => {
        try {
            await logoutRequest()
        } finally {
            clearAuth()
        }
    }, [clearAuth])

    useEffect(() => {
        if (initialUser !== undefined) {
            if (initialUser) {
                const stored = readStoredAuth()
                const nextSession = createSession(initialUser, stored?.identifier ?? null)
                writeStoredAuth(nextSession)
                setSession(nextSession)
                setStatus("authenticated")
                return
            }

            clearStoredAuth()
            setSession(null)
            setStatus("unauthenticated")
            return
        }

        void refreshSession()
    }, [initialUser, refreshSession])

    const value = useMemo<AuthContextValue>(() => ({
        status,
        session,
        setAuthenticated,
        refreshSession,
        logout
    }), [logout, refreshSession, session, setAuthenticated, status])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }

    return context
}

type UseRequireAuthOptions = {
    requiredRole: UserRole
    forbiddenMessage?: string
    unauthenticatedMessage?: string
    redirectTo?: string
}

export function useRequireAuth({
    requiredRole,
    forbiddenMessage = "접근 권한이 없습니다.",
    unauthenticatedMessage = "로그인이 필요합니다.",
    redirectTo = "/"
}: UseRequireAuthOptions) {
    const router = useRouter()
    const pathname = usePathname()
    const { showToast } = useToast()
    const { status, session } = useAuth()
    const handledRef = useRef<string | null>(null)

    useEffect(() => {
        if (status === "loading") {
            return
        }

        // 같은 경로에서 토스트가 반복되지 않도록 최근 처리 상태를 기억한다.
        if (status === "unauthenticated") {
            const marker = `unauthenticated:${pathname}`
            if (handledRef.current !== marker) {
                handledRef.current = marker
                showToast(unauthenticatedMessage, "error")
            }
            router.replace(redirectTo)
            return
        }

        if (session && session.role !== requiredRole) {
            const marker = `forbidden:${pathname}:${requiredRole}`
            if (handledRef.current !== marker) {
                handledRef.current = marker
                showToast(forbiddenMessage, "error")
            }
            router.replace(redirectTo)
            return
        }

        handledRef.current = null
    }, [forbiddenMessage, pathname, redirectTo, requiredRole, router, session, showToast, status, unauthenticatedMessage])

    return {
        isLoading: status === "loading",
        isAuthorized: status === "authenticated" && session?.role === requiredRole,
        session,
        user: session?.user ?? null
    }
}
