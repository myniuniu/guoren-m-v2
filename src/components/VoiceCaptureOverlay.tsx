import { useCallback, useEffect, useRef, useState } from 'react'
import { Toast } from 'antd-mobile'
import { useVoiceInput } from '../hooks/useVoiceInput'
import './VoiceCaptureOverlay.css'

type VoiceCaptureStage = 'listening' | 'review'

export interface VoiceCaptureOverlayProps {
  visible: boolean
  releaseSignal?: number
  onCancel: () => void
  onSubmit: (transcript: string) => void
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export default function VoiceCaptureOverlay({
  visible,
  releaseSignal = 0,
  onCancel,
  onSubmit,
}: VoiceCaptureOverlayProps) {
  const [stage, setStage] = useState<VoiceCaptureStage>('listening')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const transcriptBaseRef = useRef('')
  const transcriptCurrentRef = useRef('')
  const releaseRequestedRef = useRef(false)
  const completedRef = useRef(false)
  const finalizeTimerRef = useRef<number | null>(null)
  const lastReleaseSignalRef = useRef(0)
  const bootstrappedRef = useRef(false)

  const finishWithoutSubmit = useCallback((message?: string) => {
    if (completedRef.current) {
      return
    }

    completedRef.current = true

    if (message) {
      Toast.show({ content: message })
    }

    onCancel()
  }, [onCancel])

  const handleVoiceResult = useCallback((text: string, isFinal: boolean) => {
    if (!text || completedRef.current) {
      return
    }

    const nextTranscript = transcriptBaseRef.current + text
    transcriptCurrentRef.current = nextTranscript
    setTranscript(nextTranscript)

    if (isFinal) {
      transcriptBaseRef.current = nextTranscript
    }
  }, [])

  const handleVoiceError = useCallback((error: Error) => {
    if (completedRef.current) {
      return
    }

    Toast.show({ content: error.message || '语音输入失败' })
    completedRef.current = true
    onCancel()
  }, [onCancel])

  const {
    state: voiceState,
    startRecording,
    stopRecording,
    isSupported,
  } = useVoiceInput({
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  })

  const resetOverlayState = useCallback(() => {
    setStage('listening')
    setElapsedSeconds(0)
    setTranscript('')
    transcriptBaseRef.current = ''
    transcriptCurrentRef.current = ''
    releaseRequestedRef.current = false
    completedRef.current = false
    lastReleaseSignalRef.current = releaseSignal

    if (finalizeTimerRef.current !== null) {
      window.clearTimeout(finalizeTimerRef.current)
      finalizeTimerRef.current = null
    }
  }, [releaseSignal])

  const requestSubmit = useCallback(() => {
    if (!visible || releaseRequestedRef.current || completedRef.current) {
      return
    }

    // 长按松手后先停录音，再等语音服务把最后一小段结果回推回来。
    releaseRequestedRef.current = true
    setStage('review')
    stopRecording()
  }, [stopRecording, visible])

  useEffect(() => {
    if (!visible) {
      bootstrappedRef.current = false

      if (finalizeTimerRef.current !== null) {
        window.clearTimeout(finalizeTimerRef.current)
        finalizeTimerRef.current = null
      }

      return undefined
    }

    // 开发环境开启 StrictMode 时，挂载副作用会被重复触发一次。
    // 这里把“本轮浮层已经启动过录音”记下来，避免同一段音频被重复推送到 ASR。
    if (bootstrappedRef.current) {
      return undefined
    }

    bootstrappedRef.current = true
    resetOverlayState()

    if (!isSupported) {
      finishWithoutSubmit('当前设备暂不支持语音输入')
      return undefined
    }

    void startRecording()

    return () => {
      if (finalizeTimerRef.current !== null) {
        window.clearTimeout(finalizeTimerRef.current)
        finalizeTimerRef.current = null
      }
    }
  }, [finishWithoutSubmit, isSupported, resetOverlayState, startRecording, visible])

  useEffect(() => {
    if (!visible || stage !== 'listening') {
      return undefined
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1)
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [stage, visible])

  useEffect(() => {
    if (!visible) {
      return undefined
    }

    const handlePointerUp = () => {
      requestSubmit()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [requestSubmit, visible])

  useEffect(() => {
    if (!visible || releaseSignal === lastReleaseSignalRef.current) {
      return
    }

    lastReleaseSignalRef.current = releaseSignal
    requestSubmit()
  }, [releaseSignal, requestSubmit, visible])

  useEffect(() => {
    if (!visible || !releaseRequestedRef.current || completedRef.current || voiceState !== 'idle') {
      return undefined
    }

    finalizeTimerRef.current = window.setTimeout(() => {
      finalizeTimerRef.current = null

      if (completedRef.current) {
        return
      }

      const finalTranscript = transcriptCurrentRef.current.trim()

      if (!finalTranscript) {
        finishWithoutSubmit('未识别到文字')
        return
      }

      completedRef.current = true
      onSubmit(finalTranscript)
    }, 120)

    return () => {
      if (finalizeTimerRef.current !== null) {
        window.clearTimeout(finalizeTimerRef.current)
        finalizeTimerRef.current = null
      }
    }
  }, [finishWithoutSubmit, onSubmit, visible, voiceState])

  const handleCancel = useCallback(() => {
    stopRecording()
    finishWithoutSubmit()
  }, [finishWithoutSubmit, stopRecording])

  if (!visible) {
    return null
  }

  const elapsedLabel = `${Math.max(1, elapsedSeconds)}秒`
  const showTranscriptCard = Boolean(transcript.trim())

  return (
    <div className={joinClassNames('voice-capture-overlay', stage === 'review' ? 'is-review' : 'is-listening')}>
      <div className="voice-capture-feedback">
        <div className="voice-capture-feedback-status">
          <span className="voice-capture-feedback-state">{stage === 'listening' ? '正在聆听' : '已停止'}</span>
          <span className="voice-capture-feedback-time">{elapsedLabel}</span>
        </div>

        {showTranscriptCard ? (
          <div className="voice-capture-feedback-card">
            <span aria-hidden="true" className="voice-capture-feedback-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="M8 7v10" />
                <path d="M16 7v10" />
              </svg>
            </span>
            <span className="voice-capture-feedback-card-text">{transcript}</span>
          </div>
        ) : null}
      </div>

      <div className="voice-capture-bottom-stage">
        <div className="voice-capture-signal-bubble" aria-hidden="true">
          <div className={joinClassNames('voice-capture-signal-wave', stage === 'listening' ? 'is-listening' : null)}>
            {Array.from({ length: 9 }).map((_, index) => (
              <span className="voice-capture-signal-bar" key={index} style={{ animationDelay: `${index * 0.07}s` }} />
            ))}
          </div>
        </div>

        <div className="voice-capture-control-row">
          <button
            aria-label="取消语音输入"
            className="voice-capture-control-btn"
            type="button"
            onClick={handleCancel}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="voice-capture-center-action">
            {stage === 'listening' ? '松开发送' : '正在发送...'}
          </div>

          <div aria-hidden="true" className="voice-capture-control-spacer" />
        </div>

        <div className="voice-capture-arc-surface" aria-hidden="true">
          <div className="voice-capture-arc-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 9a5 5 0 0 1 0 6" />
              <path d="M4.5 6.5a8.5 8.5 0 0 1 0 11" />
              <path d="M17 9a5 5 0 0 0 0 6" />
              <path d="M19.5 6.5a8.5 8.5 0 0 1 0 11" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
