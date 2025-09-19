import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, X, Trash2 } from 'lucide-react';

export const AIContextualChat = ({ contexto, onClose, modulo = 'ventas' }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollAreaRef = useRef(null);

  // Cargar conversación existente al abrir el chat
  useEffect(() => {
    loadExistingConversation();
  }, []);

  const loadExistingConversation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Buscar la conversación más reciente del usuario para este módulo
      const { data: conversation, error } = await supabase
        .from('conversaciones_ia')
        .select('id, mensajes')
        .eq('usuario_id', session.user.id)
        .eq('modulo', modulo)
        .order('ultima_actualizacion', { ascending: false })
        .limit(1)
        .single();

      if (conversation && conversation.mensajes) {
        setMessages(conversation.mensajes);
        setConversationId(conversation.id);
      }
    } catch (error) {
      console.log('No hay conversación previa o error al cargar:', error);
    }
  };

  const saveConversation = async (messagesToSave) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (conversationId) {
        // Actualizar conversación existente
        await supabase
          .from('conversaciones_ia')
          .update({ 
            mensajes: messagesToSave,
            ultima_actualizacion: new Date().toISOString()
          })
          .eq('id', conversationId);
      } else {
        // Crear nueva conversación
        const { data: newConversation, error } = await supabase
          .from('conversaciones_ia')
          .insert({
            usuario_id: session.user.id,
            modulo: modulo,
            mensajes: messagesToSave,
            ultima_actualizacion: new Date().toISOString()
          })
          .select('id')
          .single();

        if (newConversation) {
          setConversationId(newConversation.id);
        }
      }
    } catch (error) {
      console.error('Error al guardar conversación:', error);
    }
  };

  const clearConversation = async () => {
    try {
      setMessages([]);
      setConversationId(null);
      
      if (conversationId) {
        // Eliminar la conversación de la base de datos
        await supabase
          .from('conversaciones_ia')
          .delete()
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Error al limpiar conversación:', error);
    }
  };

  // Scroll automático mejorado
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    };
    
    // Scroll inmediato
    scrollToBottom();
    
    // Scroll después de un delay para asegurar que el contenido se renderice
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    const currentMessages = [...messages, userMessage];
    
    setMessages(currentMessages);
    setInputValue('');
    setIsLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Usuario no autenticado");

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asistente-contextual`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                contexto: contexto,
                pregunta: userMessage.content,
                historial: currentMessages
            })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Añadir la respuesta de la IA
        const aiMessage = { role: 'model', content: data.respuesta };
        const updatedMessages = [...currentMessages, aiMessage];
        setMessages(updatedMessages);

        // Guardar en la base de datos
        await saveConversation(updatedMessages);

    } catch (err) {
        console.error("Error al contactar con la IA:", err);
        const errorMessage = { role: 'model', content: "Error al conectar con el copiloto." };
        const updatedMessages = [...currentMessages, errorMessage];
        setMessages(updatedMessages);
        await saveConversation(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed bottom-20 right-6 w-[440px] h-[634px] flex flex-col shadow-2xl rounded-xl z-50">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-full text-primary-foreground">
            <Bot size={20} />
          </div>
          <CardTitle className="text-lg">SALES MASTER PRO</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearConversation}
            title="Limpiar historial"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div 
          className="h-full overflow-y-auto p-4" 
          ref={scrollAreaRef}
          style={{ 
            maxHeight: 'calc(634px - 140px)', // Altura total menos header y footer
            scrollBehavior: 'smooth'
          }}
        >
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Haz una pregunta sobre tus datos de ventas</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
                    <Bot size={18} />
                  </div>
                )}
                <div className={`p-3 rounded-lg max-w-sm prose prose-sm ${msg.role === 'model' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-primary text-primary-foreground'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  <span className="ml-2 text-sm text-gray-500">Pensando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t flex-shrink-0 h-20">
        <div className="flex w-full items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Haz una pregunta sobre tus datos..."
            disabled={isLoading}
            autoFocus
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}; 