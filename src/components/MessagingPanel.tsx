import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  announcement_id?: string;
  last_message_at: string;
  created_at: string;
  otherParticipantEmail?: string;
  latestMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  senderEmail?: string;
}

export default function MessagingPanel() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchConversations();
      const subscription = supabase
        .channel(`conversations:${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
              setMessages((prev) => [...prev, payload.new as Message]);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile, selectedConversation]);

  const fetchConversations = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${profile.id},participant_2_id.eq.${profile.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const otherParticipantId =
            conv.participant_1_id === profile.id ? conv.participant_2_id : conv.participant_1_id;

          const { data: participantData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', otherParticipantId)
            .single();

          const { data: messageData } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_id', otherParticipantId)
            .is('read_at', null);

          return {
            ...conv,
            otherParticipantEmail: participantData?.email,
            latestMessage: messageData?.content,
            unreadCount: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithSenderInfo = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.sender_id === profile?.id) return msg;

          const { data: senderData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', msg.sender_id)
            .single();

          return { ...msg, senderEmail: senderData?.email };
        })
      );

      setMessages(messagesWithSenderInfo);

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', profile?.id);

      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation || !profile) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: selectedConversation.id,
          sender_id: profile.id,
          content: messageContent,
        },
      ]);

      if (error) throw error;
      setMessageContent('');
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
          <button
            onClick={() => setSelectedConversation(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">{selectedConversation.otherParticipantEmail}</h2>
            <p className="text-sm text-gray-500">
              Conversation depuis {new Date(selectedConversation.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Aucun message</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender_id === profile?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.sender_id === profile?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={sending || !messageContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages</h2>

      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation</h3>
          <p className="text-gray-600">Lancez une conversation en contactant un utilisateur</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{conv.otherParticipantEmail}</h3>
                {(conv.unreadCount || 0) > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {conv.latestMessage || 'Pas encore de message'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(conv.last_message_at).toLocaleDateString('fr-FR')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
