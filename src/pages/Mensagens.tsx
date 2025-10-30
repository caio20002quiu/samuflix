import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonList } from '@ionic/react';
import { firebaseAvailable, saveMessage, fetchMessagesByUser } from '../firebase';
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
        if (firebaseAvailable()) {
          const { value: dv } = await Preferences.get({ key: 'deviceId' });
          let deviceId = dv || '';
          if (!deviceId) {
            deviceId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
            await Preferences.set({ key: 'deviceId', value: deviceId });
          }
          const remote = await fetchMessagesByUser(deviceId);
          if (remote.length) {
            setMessages(remote.map(r => ({ id: String(r.createdAt), text: r.text, createdAt: r.createdAt })));
            return;
          }
        }
        const { value } = await Preferences.get({ key: 'messages' });
        if (value) setMessages(JSON.parse(value));
      } catch { /* ignore */ }
    })();
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    const item: Msg = { id: String(Date.now()), text: t, createdAt: Date.now() };
    const next = [item, ...messages];
    setMessages(next);
    setText('');
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'messages', value: JSON.stringify(next) });
      if (firebaseAvailable()) {
        const { value: dv } = await Preferences.get({ key: 'deviceId' });
        let deviceId = dv || '';
        if (!deviceId) {
          deviceId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
          await Preferences.set({ key: 'deviceId', value: deviceId });
        }
        await saveMessage(deviceId, t);
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
