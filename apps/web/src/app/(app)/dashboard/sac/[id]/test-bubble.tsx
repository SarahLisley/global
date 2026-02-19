'use client';

import { ChatBubble } from './components/ChatBubble';

export default function TestSac() {
  const msgWinthor = {
    id: '1',
    author: 'Winthor',
    authorType: 'winthor' as const,
    content: 'Teste Winthor',
    createdAt: new Date().toISOString()
  };

  const msgCliente = {
    id: '2',
    author: 'Cliente',
    authorType: 'cliente' as const,
    content: 'Teste Cliente',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="p-10 space-y-4 bg-slate-100 h-screen">
      <ChatBubble message={msgWinthor} isDisabled={false} onEdit={() => { }} onDelete={() => { }} />
      <ChatBubble message={msgCliente} isDisabled={false} onEdit={() => { }} onDelete={() => { }} />
    </div>
  );
}
