"use client"

import * as React from "react"
import { X } from "lucide-react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-xl font-bold">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    )
}
