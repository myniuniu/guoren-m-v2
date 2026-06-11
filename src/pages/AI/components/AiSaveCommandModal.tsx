import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { Toast } from 'antd-mobile'

import { createCommand, generateCommandFromSession, type CreateCommandRequest } from '../../../services/commands'

type AiSaveCommandModalProps = {
  open: boolean
  sessionId: string
  onClose: () => void
  onSuccess: () => void | Promise<void>
}

type ModalPhase = 'loading' | 'editing'

export function AiSaveCommandModal({
  open,
  sessionId,
  onClose,
  onSuccess,
}: AiSaveCommandModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('loading')
  const [name, setName] = useState('')
  const [template, setTemplate] = useState('')
  const [attachments, setAttachments] = useState<CreateCommandRequest['attachments']>([])
  const [sourceSessionId, setSourceSessionId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    let cancelled = false
    const controller = new AbortController()

    setPhase('loading')
    setSaving(false)
    setName('')
    setTemplate('')
    setAttachments([])
    setSourceSessionId('')

    void generateCommandFromSession(sessionId, controller.signal)
      .then((data) => {
        if (cancelled) {
          return
        }

        setName(data.name)
        setTemplate(data.template)
        setAttachments(Array.isArray(data.attachments) ? data.attachments : [])
        setSourceSessionId(data.source_session_id)
        setPhase('editing')
      })
      .catch((error) => {
        if (cancelled || controller.signal.aborted) {
          return
        }

        Toast.show({ content: error instanceof Error ? error.message : '生成指令模板失败' })
        onClose()
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open, onClose, sessionId])

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }, [])

  const handleTemplateChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setTemplate(event.target.value)
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Toast.show({ content: '指令名称不能为空' })
      return
    }

    if (!template.trim()) {
      Toast.show({ content: '指令内容不能为空' })
      return
    }

    try {
      setSaving(true)
      await createCommand({
        name: name.trim(),
        template: template.trim(),
        attachments,
        source_session_id: sourceSessionId,
      })
      await onSuccess()
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '创建指令失败' })
    } finally {
      setSaving(false)
    }
  }, [attachments, name, onSuccess, sourceSessionId, template])

  if (!open) {
    return null
  }

  return (
    <div className="ai-save-command-modal-overlay" onClick={onClose}>
      <div
        aria-modal="true"
        className="ai-save-command-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {phase === 'loading' ? (
          <div className="ai-save-command-modal-loading">
            <div className="ai-save-command-modal-loading-badge">指令</div>
            <div className="ai-save-command-modal-loading-title">正在生成指令模板</div>
            <div className="ai-save-command-modal-loading-subtitle">
              AI 正在分析当前会话内容，提取关键指令...
            </div>
            <div aria-hidden="true" className="ai-save-command-modal-loading-spinner" />
          </div>
        ) : (
          <>
            <div className="ai-save-command-modal-header">
              <div className="ai-save-command-modal-title">保存为指令</div>
              <div className="ai-save-command-modal-description">
                系统已经根据当前会话生成了一版模板，你可以再改一下名称和内容后保存。
              </div>
            </div>

            <div className="ai-save-command-modal-form">
              <label className="ai-save-command-modal-field">
                <span className="ai-save-command-modal-label">指令名称</span>
                <input
                  className="ai-save-command-modal-input"
                  maxLength={50}
                  placeholder="请输入指令名称"
                  value={name}
                  onChange={handleNameChange}
                />
              </label>

              <label className="ai-save-command-modal-field">
                <span className="ai-save-command-modal-label">指令内容</span>
                <textarea
                  className="ai-save-command-modal-textarea"
                  maxLength={2000}
                  placeholder="请输入指令内容"
                  rows={7}
                  value={template}
                  onChange={handleTemplateChange}
                />
              </label>
            </div>

            <div className="ai-save-command-modal-actions">
              <button
                className="ai-save-command-modal-button is-secondary"
                disabled={saving}
                type="button"
                onClick={onClose}
              >
                取消
              </button>
              <button
                className="ai-save-command-modal-button is-primary"
                disabled={saving}
                type="button"
                onClick={handleSave}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
