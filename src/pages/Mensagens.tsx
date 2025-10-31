import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/react';
import { saveMessage, fetchMessagesByUser } from '../firebase';
import { saveMessageApi, fetchMessagesByUserApi } from '../api';
import React from 'react';
import './Mensagens.css';

type Msg = { id: string; text: string; createdAt: number };

const Mensagens: React.FC = () => {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const deviceIdRef = React.useRef<string>('');

  React.useEffect(() => {
    (async () => {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { value: dv } = await Preferences.get({ key: 'deviceId' });
        let deviceId = dv || '';
        if (!deviceId) {
          deviceId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
          await Preferences.set({ key: 'deviceId', value: deviceId });
        }
        deviceIdRef.current = deviceId;

        // Carregar mensagens do MongoDB Atlas
        try {
          const remote = await fetchMessagesByUser(deviceId);
          if (remote.length) {
            setMessages(remote.map((r, idx) => ({ id: `${r.createdAt}-${idx}-${Math.random().toString(36)}`, text: r.text, createdAt: r.createdAt })));
            return;
          }
        } catch (e) {
          // Fallback para API direta
          try {
            const remote = await fetchMessagesByUserApi(deviceId);
            if (remote && remote.length) {
              setMessages(remote.map((r: any, idx: number) => ({ 
                id: `${r.createdAt}-${idx}-${Math.random().toString(36)}`, 
                text: r.text, 
                createdAt: r.createdAt 
              })));
              return;
            }
          } catch { /* ignore api errors */ }
        }

        const { value } = await Preferences.get({ key: 'messages' });
        if (value) setMessages(JSON.parse(value));
      } catch { /* ignore */ }
    })();
  }, []);

  // Auto-refresh a cada 5s
  React.useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const uid = deviceIdRef.current;
        if (!uid) return;
        try {
          const remote = await fetchMessagesByUser(uid);
          const mapped = remote.map((r, idx) => ({ id: `${r.createdAt}-${idx}`, text: r.text, createdAt: r.createdAt }));
          setMessages(prev => {
            // evita re-render se nada mudou
            if (prev.length && mapped.length && prev[prev.length - 1]?.id === mapped[mapped.length - 1]?.id) return prev;
            return mapped;
          });
        } catch {
          try {
            const remote = await fetchMessagesByUserApi(uid);
            const mapped = remote.map((r: any, idx: number) => ({ id: `${r.createdAt}-${idx}`, text: r.text, createdAt: r.createdAt }));
            setMessages(mapped);
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll para o fim quando mensagens mudarem
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    const item: Msg = { id: `${now}-${Math.random().toString(36)}`, text: t, createdAt: now };
    // ordenar ascendente para UX de chat (mensagens antigas em cima)
    const next = [...messages, item];
    setMessages(next);
    setText('');
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'messages', value: JSON.stringify(next) });
      
      let deviceId = deviceIdRef.current;
      if (!deviceId) {
        const { value: dv } = await Preferences.get({ key: 'deviceId' });
        deviceId = dv || '';
        if (!deviceId) {
          deviceId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
          await Preferences.set({ key: 'deviceId', value: deviceId });
        }
        deviceIdRef.current = deviceId;
      }

      // Usar MongoDB Atlas para salvar mensagem
      try {
        await saveMessage(deviceId, t);
      } catch (e) {
        // Fallback para API direta
        try {
          await saveMessageApi(deviceId, t);
        } catch { /* ignore api errors */ }
      }
    } catch { /* ignore */ }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bate-papo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="chat-wrap">
          <div ref={scrollRef} className="chat-scroll">
            {messages.length === 0 ? (
              <div style={{ color: 'var(--ion-color-medium)', textAlign: 'center', marginTop: 24 }}>Sem mensagens ainda.</div>
            ) : (
              messages
                .sort((a, b) => a.createdAt - b.createdAt)
                .map(m => (
                  <div key={m.id} className={`bubble me`}>
                    <div>{m.text}</div>
                    <div className="meta">{new Date(m.createdAt).toLocaleString('pt-BR')}</div>
                  </div>
                ))
            )}
          </div>

          <div className="input-row">
            <IonItem className="text-input">
              <IonInput
                value={text}
                placeholder="Escreva uma mensagem"
                onIonChange={e => setText(String(e.detail.value || ''))}
                onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              />
            </IonItem>
            <IonButton onClick={send}>Enviar</IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Mensagens;
