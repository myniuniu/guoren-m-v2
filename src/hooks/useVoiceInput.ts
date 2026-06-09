import { useCallback, useRef, useState } from 'react'
import { getAiApiBaseUrl } from '../utils/request'

type VoiceState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'error'

type AsrResult = {
  type: 'result'
  text: string
  is_final: boolean
}

type UseVoiceInputOptions = {
  onResult: (text: string, isFinal: boolean) => void
  onError?: (error: Error) => void
  onStateChange?: (state: VoiceState) => void
}

type UseVoiceInputReturn = {
  state: VoiceState
  startRecording: () => Promise<void>
  stopRecording: () => void
  isSupported: boolean
}

function readLocalStorage(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() ?? ''
  } catch {
    return ''
  }
}

function readUserId(): string {
  const directUserId = readLocalStorage('SUPERSONIC_ID')

  if (directUserId) {
    return directUserId
  }

  const rawUserInfo = readLocalStorage('userInfo')

  if (!rawUserInfo) {
    return ''
  }

  try {
    const parsed = JSON.parse(rawUserInfo) as Record<string, unknown>
    const value = parsed.id
    return value === undefined || value === null ? '' : String(value).trim()
  } catch {
    return ''
  }
}

function readToken(): string {
  return readLocalStorage('SUPERSONIC_TOKEN')
}

function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length)

  for (let index = 0; index < float32Array.length; index += 1) {
    const current = Math.max(-1, Math.min(1, float32Array[index]))
    int16Array[index] = current < 0 ? current * 0x8000 : current * 0x7fff
  }

  return int16Array
}

export function useVoiceInput(options: UseVoiceInputOptions): UseVoiceInputReturn {
  const { onResult, onError, onStateChange } = options

  const [state, setState] = useState<VoiceState>('idle')
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioChunksRef = useRef<Int16Array[]>([])
  const isRecordingRef = useRef(false)
  const reconnectCountRef = useRef(0)
  const maxReconnectCount = 3

  const setVoiceState = useCallback((nextState: VoiceState) => {
    setState(nextState)
    onStateChange?.(nextState)
  }, [onStateChange])

  const buildWsUrl = useCallback(() => {
    const userId = readUserId()
    const token = readToken()

    if (!userId || !token) {
      throw new Error('当前缺少登录态，暂时无法使用语音输入')
    }

    const apiBaseUrl = getAiApiBaseUrl()
    const url = new URL(apiBaseUrl)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

    return `${protocol}//${url.host}/api/v1/asr/realtime?user_id=${encodeURIComponent(userId)}&x_access_token=${encodeURIComponent(token)}`
  }, [])

  const sendAudioData = useCallback(() => {
    const ws = wsRef.current

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const chunks = audioChunksRef.current

    if (chunks.length === 0) {
      return
    }

    let totalLength = 0

    for (const chunk of chunks) {
      totalLength += chunk.length
    }

    if (totalLength === 0) {
      return
    }

    const merged = new Int16Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    audioChunksRef.current = []

    try {
      ws.send(merged.buffer)
    } catch {
      // 发送失败时把本轮数据放回去，避免本地录音内容直接丢失。
      audioChunksRef.current.push(merged)
    }
  }, [])

  const cleanup = useCallback(() => {
    isRecordingRef.current = false

    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current)
      sendIntervalRef.current = null
    }

    const ws = wsRef.current

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'stop' }))
      } catch {
        // stop 指令发失败时只做静默清理，避免卡住界面状态。
      }
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect()
      } catch {
        // 节点已经断开时不用额外处理。
      }

      scriptProcessorRef.current = null
    }

    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close()
      } catch {
        // AudioContext 已关闭时忽略。
      }

      audioContextRef.current = null
    }

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop()
      }

      mediaStreamRef.current = null
    }

    setTimeout(() => {
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {
          // 连接已经关闭时忽略。
        }

        wsRef.current = null
      }
    }, 500)

    audioChunksRef.current = []
  }, [])

  const initWebSocket = useCallback(() => new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(buildWsUrl())

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'start',
        sample_rate: 16000,
      }))
      resolve()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as AsrResult | { type: string }

        if (data.type === 'result') {
          const result = data as AsrResult
          onResult(result.text, result.is_final)
        }
      } catch {
        // 非 JSON 消息直接忽略，不打断录音流程。
      }
    }

    ws.onerror = () => {
      reject(new Error('语音服务连接失败'))
    }

    ws.onclose = () => {
      if (isRecordingRef.current && reconnectCountRef.current < maxReconnectCount) {
        reconnectCountRef.current += 1

        setTimeout(() => {
          if (isRecordingRef.current) {
            void initWebSocket()
          }
        }, 1000)
      }
    }

    wsRef.current = ws
  }), [buildWsUrl, onResult])

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      return
    }

    try {
      setVoiceState('requesting')

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      mediaStreamRef.current = mediaStream
      isRecordingRef.current = true
      reconnectCountRef.current = 0

      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(mediaStream)
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)

      scriptProcessorRef.current = scriptProcessor
      scriptProcessor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) {
          return
        }

        const inputData = event.inputBuffer.getChannelData(0)
        const int16Data = float32ToInt16(new Float32Array(inputData))
        audioChunksRef.current.push(int16Data)
      }

      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)

      await initWebSocket()

      // 固定按小片段推送，和 PC 端保持一致，避免一口气堆太多音频导致识别延迟。
      sendIntervalRef.current = setInterval(() => {
        sendAudioData()
      }, 100)

      setVoiceState('recording')
    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error))
      cleanup()
      setVoiceState('error')
      onError?.(resolvedError)
      setTimeout(() => {
        setVoiceState('idle')
      }, 300)
    }
  }, [cleanup, initWebSocket, onError, sendAudioData, setVoiceState])

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) {
      return
    }

    setVoiceState('stopping')
    cleanup()

    setTimeout(() => {
      setVoiceState('idle')
    }, 500)
  }, [cleanup, setVoiceState])

  const isSupported = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && 'mediaDevices' in navigator
    && 'getUserMedia' in navigator.mediaDevices
    && typeof AudioContext !== 'undefined'

  return {
    state,
    startRecording,
    stopRecording,
    isSupported,
  }
}
