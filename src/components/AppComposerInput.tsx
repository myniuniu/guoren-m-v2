import { TextArea } from 'antd-mobile'
import { AddOutline, AudioOutline, StopOutline, UpOutline } from 'antd-mobile-icons'
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
  onSubmit?: () => void | Promise<void>
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
  const actionDisabled = Boolean((!canSubmit && !isResponding) || isStopping)
  const actionState = isResponding ? 'is-stop' : hasValue ? 'is-submit' : 'is-voice'

  const handleAction = () => {
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
            onEnterPress={handleAction}
          />

          <button
            aria-label={isResponding ? '停止回答' : actionAriaLabel}
            className={joinClassNames('app-composer-input-action', actionState)}
            disabled={actionDisabled}
            type="button"
            onClick={handleAction}
          >
            {isResponding ? (
              <StopOutline aria-hidden="true" style={{ fontSize: 18 }} />
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
