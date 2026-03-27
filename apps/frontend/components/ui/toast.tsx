"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast: Toast = { id, message, type }

        setToasts((prev) => [...prev, newToast])

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, 4000)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <XCircle className="w-5 h-5 text-red-600" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />
    }

    const bgColors = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        warning: "bg-yellow-50 border-yellow-200",
        info: "bg-blue-50 border-blue-200"
    }

    const textColors = {
        success: "text-green-900",
        error: "text-red-900",
        warning: "text-yellow-900",
        info: "text-blue-900"
    }

    return (
        <div
            className={`
                pointer-events-auto
                flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                ${bgColors[toast.type]}
                animate-in slide-in-from-right-full duration-300
                min-w-[300px] max-w-md
            `}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <p className={`flex-1 text-sm font-medium ${textColors[toast.type]}`}>
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors"
            >
                <X className="w-4 h-4 text-slate-500" />
            </button>
        </div>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within ToastProvider")
    }
    return context
}
