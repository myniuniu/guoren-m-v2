import { useCallback, useRef } from 'react'
import { TextArea, Toast } from 'antd-mobile'
import { AddOutline, AudioOutline, StopOutline, UpOutline } from 'antd-mobile-icons'
import { useVoiceInput } from '../hooks/useVoiceInput'
import './AppComposerInput.css'

export interface AppComposerInputProps {
  value: string
  placeholder?: string
  note?: string
  className?: string
  canSubmit?: boolean
  isResponding?: boolean
  isStopping?: boolean
  inputAriaLabel?: string
  plusAriaLabel?: string
  actionAriaLabel?: string
  onChange: (nextValue: string) => void
  onPlusClick?: () => void
  onSubmit?: (promptOverride?: string) => void | Promise<void>
  onStop?: () => void | Promise<void>
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export default function AppComposerInput({
  value,
  placeholder = '请输入内容',
  note,
  className,
  canSubmit = false,
  isResponding = false,
  isStopping = false,
  inputAriaLabel = '输入内容',
  plusAriaLabel = '打开更多操作',
  actionAriaLabel = '发送消息',
  onChange,
  onPlusClick,
  onSubmit,
  onStop,
}: AppComposerInputProps) {
  const hasValue = value.trim().length > 0
  const voiceBaseTextRef = useRef('')
  const isVoiceSendingRef = useRef(false)
  const hasRecognizedTextRef = useRef(false)

  const handleVoiceResult = useCallback((text: string, isFinal: boolean) => {
    if (isVoiceSendingRef.current || !text) {
      return
    }

    hasRecognizedTextRef.current = true

    const base = voiceBaseTextRef.current

    if (isFinal) {
      const nextValue = base + text
      voiceBaseTextRef.current = nextValue
      onChange(nextValue)
      return
    }

    onChange(base + text)
  }, [onChange])

  const { state: voiceState, startRecording, stopRecording, isSupported: isVoiceSupported } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: (error) => {
      hasRecognizedTextRef.current = false
      isVoiceSendingRef.current = false
      Toast.show({ content: error.message || '语音输入失败' })
    },
  })

  const isRecording = voiceState === 'recording' || voiceState === 'requesting'
  const isVoiceTransitioning = voiceState === 'requesting' || voiceState === 'stopping'
  const actionDisabled = isStopping || (isResponding
    ? false
    : isRecording
      ? false
      : hasValue
        ? !canSubmit
        : !isVoiceSupported || isVoiceTransitioning)
  const actionState = isResponding ? 'is-stop' : hasValue ? 'is-submit' : 'is-voice'

  const handleToggleVoice = useCallback(() => {
    if (!isVoiceSupported || isVoiceTransitioning) {
      return
    }

    if (isRecording) {
      stopRecording()

      if (!hasRecognizedTextRef.current) {
        Toast.show({ content: '未识别到文字' })
        onChange(voiceBaseTextRef.current)
        voiceBaseTextRef.current = ''
        hasRecognizedTextRef.current = false
        return
      }

      isVoiceSendingRef.current = true
      const finalText = voiceBaseTextRef.current.trim()
      voiceBaseTextRef.current = ''
      hasRecognizedTextRef.current = false

      if (finalText) {
        void onSubmit?.(finalText)
      }

      setTimeout(() => {
        isVoiceSendingRef.current = false
      }, 1000)
      return
    }

    voiceBaseTextRef.current = value
    hasRecognizedTextRef.current = false
    void startRecording()
  }, [isRecording, isVoiceSupported, isVoiceTransitioning, onChange, onSubmit, startRecording, stopRecording, value])

  const handleActionClick = () => {
    if (isResponding) {
      void onStop?.()
      return
    }

    if (isRecording) {
      handleToggleVoice()
      return
    }

    if (hasValue) {
      void onSubmit?.()
      return
    }

    handleToggleVoice()
  }

  const handleEnterPress = () => {
    if (isResponding) {
      void onStop?.()
      return
    }

    if (canSubmit) {
      void onSubmit?.()
    }
  }

  return (
    <div className={joinClassNames('app-composer-input', className)}>
      <div className="app-composer-input-shell">
        <div className="app-composer-input-surface">
          <button
            aria-label={plusAriaLabel}
            className="app-composer-input-plus"
            type="button"
            onClick={onPlusClick}
          >
            <AddOutline aria-hidden="true" style={{ fontSize: 20 }} />
          </button>

          <TextArea
            aria-label={inputAriaLabel}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="app-composer-input-field"
            enterKeyHint="send"
            placeholder={placeholder}
            rows={1}
            value={value}
            onChange={onChange}
            onEnterPress={handleEnterPress}
          />

          <button
            aria-label={isResponding ? '停止回答' : isRecording ? '停止录音' : hasValue ? actionAriaLabel : '语音输入'}
            className={joinClassNames('app-composer-input-action', actionState, isRecording ? 'is-recording' : null)}
            disabled={actionDisabled}
            type="button"
            onClick={handleActionClick}
          >
            {isResponding ? (
              <StopOutline aria-hidden="true" style={{ fontSize: 18 }} />
            ) : isRecording ? (
              <span aria-hidden="true" className="app-composer-input-voice-wave">
                <span className="app-composer-input-voice-wave-bar" />
                <span className="app-composer-input-voice-wave-bar" />
                <span className="app-composer-input-voice-wave-bar" />
                <span className="app-composer-input-voice-wave-bar" />
                <span className="app-composer-input-voice-wave-bar" />
              </span>
            ) : hasValue ? (
              <UpOutline aria-hidden="true" style={{ fontSize: 18 }} />
            ) : (
              <AudioOutline aria-hidden="true" style={{ fontSize: 20 }} />
            )}
          </button>
        </div>
      </div>

      {note ? <p className="app-composer-input-note">{note}</p> : null}
    </div>
  )
}
