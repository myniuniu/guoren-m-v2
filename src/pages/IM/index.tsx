/**
 * IM 页面入口
 * 管理子页面路由（会话列表 <-> 聊天窗口），不引入 react-router
 */

import { useState } from 'react';
import { useIMLogin } from './hooks/useIMLogin';
import LoginGuard from './components/LoginGuard';
import ConversationListPage from './components/ConversationListPage';
import ChatPage from './components/ChatPage';
import type { MergedConversation } from './hooks/useConversationList';
import './index.css';

export type IMView = 'list' | 'chat';

function IMPage() {
  const [currentView, setCurrentView] = useState<IMView>('list');
  const [activeConversation, setActiveConversation] = useState<MergedConversation | null>(null);
  const { loginStatus, error, doLogin } = useIMLogin();

  const handleConversationClick = (conversation: MergedConversation) => {
    setActiveConversation(conversation);
    setCurrentView('chat');
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    setCurrentView('list');
  };

  const handleConversationPatch = (patch: Partial<MergedConversation>) => {
    setActiveConversation((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <div className="im-page">
      <LoginGuard loginStatus={loginStatus} error={error} onRetry={doLogin}>
        {currentView === 'list' && (
          <ConversationListPage
            onConversationClick={handleConversationClick}
          />
        )}
        {currentView === 'chat' && activeConversation && (
          <ChatPage
            conversation={activeConversation}
            onBack={handleBackToList}
            onConversationPatch={handleConversationPatch}
          />
        )}
      </LoginGuard>
    </div>
  );
}

export default IMPage;
