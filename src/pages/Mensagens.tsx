import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonList } from '@ionic/react';
import { saveMessage, fetchMessagesByUser } from '../firebase';
import { saveMessageApi, fetchMessagesByUserApi } from '../api';
import React from 'react';
import './Mensagens.css';

type Msg = { id: string; text: string; createdAt: number };

const Mensagens: React.FC = () => {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState('');

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

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    const item: Msg = { id: `${now}-${Math.random().toString(36)}`, text: t, createdAt: now };
    const next = [item, ...messages];
    setMessages(next);
    setText('');
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'messages', value: JSON.stringify(next) });
      
      const { value: dv } = await Preferences.get({ key: 'deviceId' });
      let deviceId = dv || '';
      if (!deviceId) {
        deviceId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
        await Preferences.set({ key: 'deviceId', value: deviceId });
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
          <IonTitle>Minhas mensagens</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Minhas mensagens</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <IonItem>
            <IonInput value={text} placeholder="Escreva uma mensagem" onIonChange={e => setText(String(e.detail.value || ''))} />
            <IonButton onClick={send} slot="end">Enviar</IonButton>
          </IonItem>

          {messages.length === 0 ? (
            <div style={{ color: 'var(--ion-color-medium)' }}>Sem mensagens ainda.</div>
          ) : (
            <IonList>
              {messages.map(m => (
                <IonItem key={m.id} lines="full">
                  <div>
                    <div style={{ fontWeight: 600 }}>{new Date(m.createdAt).toLocaleString('pt-BR')}</div>
                    <div>{m.text}</div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Mensagens;
