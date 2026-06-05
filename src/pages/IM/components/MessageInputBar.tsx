/**
 * 底部输入区组件
 * 文字输入 + 附件选择（图片/文件走 OSS）+ 发送按钮
 */

import React, { useState, useRef } from 'react';
import { Toast } from 'antd-mobile';
import type { ImOssAssetType } from '../utils/imOssAssetMessage';

interface MessageInputBarProps {
  onSendText?: (text: string) => void;
  onSendImage?: (file: File) => void;
  onSendAsset?: (assetType: ImOssAssetType, file: File) => void;
  disabled?: boolean;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({
  onSendText,
  onSendImage,
  onSendAsset,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendText?.(text.trim());
    setText('');
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onSendImage?.(file);
    } catch (err) {
      Toast.show({ content: err instanceof Error ? err.message : '图片发送失败' });
    } finally {
      event.target.value = '';
      setShowAttach(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onSendAsset?.('file', file);
    } catch (err) {
      Toast.show({ content: err instanceof Error ? err.message : '文件发送失败' });
    } finally {
      event.target.value = '';
      setShowAttach(false);
    }
  };

  return (
    <div className="im-msg-input-bar">
      {/* 附件面板 */}
      {showAttach && (
        <div className="im-msg-attach-panel">
          <div className="im-msg-attach-item" onClick={() => imageInputRef.current?.click()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>图片</span>
          </div>
          <div className="im-msg-attach-item" onClick={() => fileInputRef.current?.click()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>文件</span>
          </div>
        </div>
      )}

      {/* 输入行 */}
      <div className="im-msg-input-row">
        <button
          type="button"
          className="im-msg-attach-btn"
          onClick={() => setShowAttach(!showAttach)}
          disabled={disabled}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>

        <input
          type="text"
          className="im-msg-input"
          placeholder="输入消息..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
        />

        <button
          type="button"
          className="im-msg-send-btn"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9" />
          </svg>
        </button>
      </div>

      {/* 隐藏的文件选择 input */}
      <input
        type="file"
        accept="image/jpg,image/jpeg,image/gif,image/bmp,image/png,image/webp"
        ref={imageInputRef}
        hidden
        onChange={handleImageSelect}
      />
      <input
        type="file"
        accept="*/*"
        ref={fileInputRef}
        hidden
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default MessageInputBar;