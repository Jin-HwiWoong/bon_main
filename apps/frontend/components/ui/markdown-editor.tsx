"use client"

import { type ChangeEvent, useCallback, useRef, useState } from "react"
import { ImagePlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type MarkdownEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onUploadImage?: (file: File) => Promise<string>;
    onUploadError?: (message: string) => void;
    onUploadSuccess?: () => void;
    label?: string;
    placeholder?: string;
    className?: string;
    textareaClassName?: string;
    disabled?: boolean;
}

export function MarkdownEditor({
    value,
    onChange,
    onUploadImage,
    onUploadError,
    onUploadSuccess,
    label,
    placeholder,
    className,
    textareaClassName,
    disabled = false
}: MarkdownEditorProps) {
    const [uploadingImage, setUploadingImage] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const imageInputRef = useRef<HTMLInputElement | null>(null)

    const insertImageMarkdown = useCallback((markdown: string) => {
        const textarea = textareaRef.current
        if (!textarea) {
            const separator = value.endsWith("\n") || value.length === 0 ? "" : "\n"
            onChange(`${value}${separator}${markdown}`)
            return
        }

        const start = textarea.selectionStart ?? value.length
        const end = textarea.selectionEnd ?? value.length
        const before = value.slice(0, start)
        const after = value.slice(end)
        const needsLeadingBreak = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
        const needsTrailingBreak = after.length > 0 && !after.startsWith("\n") ? "\n" : ""
        const nextValue = `${before}${needsLeadingBreak}${markdown}${needsTrailingBreak}${after}`
        const cursor = before.length + needsLeadingBreak.length + markdown.length

        onChange(nextValue)
        requestAnimationFrame(() => {
            textarea.focus()
            textarea.setSelectionRange(cursor, cursor)
        })
    }, [onChange, value])

    const handleImageFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file || !onUploadImage) {
            return
        }

        if (!file.type.startsWith("image/")) {
            onUploadError?.("이미지 파일만 업로드할 수 있습니다.")
            return
        }

        setUploadingImage(true)
        try {
            const publicUrl = await onUploadImage(file)
            const altText = file.name.replace(/\.[^.]+$/, "")
            insertImageMarkdown(`![${altText}](${publicUrl})`)
            onUploadSuccess?.()
        } catch (error) {
            onUploadError?.(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.")
        } finally {
            setUploadingImage(false)
        }
    }, [insertImageMarkdown, onUploadError, onUploadImage, onUploadSuccess])

    return (
        <div className={cn("space-y-2", className)}>
            {(label || onUploadImage) && (
                <div className="flex items-center justify-between gap-3">
                    {label ? (
                        <label className="text-sm font-medium text-slate-700">{label}</label>
                    ) : (
                        <div />
                    )}
                    {onUploadImage && (
                        <div className="flex items-center gap-2">
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageFileChange}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="gap-2"
                                disabled={disabled || uploadingImage}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <ImagePlus className="w-4 h-4" />
                                {uploadingImage ? "업로드 중..." : "이미지 추가"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
            <textarea
                ref={textareaRef}
                className={cn(
                    "w-full min-h-[300px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-bon-green-start outline-none resize-y",
                    textareaClassName
                )}
                placeholder={placeholder}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    )
}
