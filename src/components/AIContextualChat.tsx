import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area'; // Para un scroll profesional
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, X } from 'lucide-react';

interface AIContextualChatProps {
  contexto: any;
  onClose: () => void; // Función para cerrar el chat desde el padre
}

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
}

export const AIContextualChat: React.FC<AIContextualChatProps> = ({ contexto, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Efecto para hacer scroll automático al final con cada nuevo mensaje
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    };
    
    // Scroll inmediato
    scrollToBottom();
    
    // Scroll después de un pequeño delay para asegurar que el contenido se renderice
    setTimeout(scrollToBottom, 100);
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('asistente-contextual', {
        body: {
          contexto: contexto,
          pregunta: userMessage.content,
          modo: 'chat_conversacional'
        }
      });

      if (error) throw new Error(error.message);

      const aiMessage: ChatMessage = { sender: 'ai', content: data.respuesta };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err: any) {
      console.error("Error al contactar a la IA:", err);
      const errorMessage: ChatMessage = { sender: 'ai', content: "Lo siento, he encontrado un error al procesar tu pregunta. Por favor, revisa los logs de la Edge Function." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed bottom-20 right-6 w-[440px] h-[634px] flex flex-col shadow-2xl rounded-xl z-50">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-full text-primary-foreground">
            <Bot size={20} />
          </div>
          <CardTitle className="text-lg">SALES MASTER PRO</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
             <CardContent className="flex-1 p-0 overflow-hidden">
         <div className="h-full overflow-y-auto p-4" ref={scrollAreaRef} style={{ maxHeight: '400px' }}>
           <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white"><Bot size={18} /></div>}
                <div className={`p-3 rounded-lg max-w-sm prose prose-sm ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-primary text-primary-foreground'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"><User size={18} /></div>}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white"><Bot size={18} /></div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
                         )}
           </div>
         </div>
       </CardContent>

             <CardFooter className="p-4 border-t h-20 flex-shrink-0">
         <div className="flex w-full items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Haz una pregunta sobre tus datos..."
            disabled={isLoading}
            autoFocus
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}; 