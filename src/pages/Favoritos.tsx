import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonModal, IonButtons, IonButton } from '@ionic/react';
import { firebaseAvailable, fetchFavoritesByUser } from '../firebase';

type Video = { id: string; title: string; thumb: string; media: string; publishedAt: number };

const Favoritos: React.FC = () => {
  const [items, setItems] = React.useState<Video[]>([]);
  const [selected, setSelected] = React.useState<Video | null>(null);

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
          const remote = await fetchFavoritesByUser(deviceId);
          const mapped: Video[] = remote.map(r => ({ id: r.id, title: r.title, thumb: r.thumbUrl, media: r.mediaUrl, publishedAt: r.publishedAt }));
          if (mapped.length) { setItems(mapped); return; }
        }

        const [idsRaw, mapRaw] = await Promise.all([
          Preferences.get({ key: 'favorites' }),
          Preferences.get({ key: 'favoriteItems' })
        ]);
        const ids: string[] = idsRaw.value ? JSON.parse(idsRaw.value) : [];
        const store: Record<string, Video> = mapRaw.value ? JSON.parse(mapRaw.value) : {};
        const list: Video[] = ids.map(id => store[id]).filter(Boolean);
        setItems(list);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Meus favoritos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Meus favoritos</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div style={{ padding: 16 }}>
          {items.length === 0 ? (
            <p>Você ainda não salvou nenhum vídeo como favorito.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map(v => (
                <div key={v.id} style={{ borderRadius: 8, overflow: 'hidden', background: 'var(--ion-color-step-50)' }} onClick={() => setSelected(v)} role="button" tabIndex={0}>
                  <img src={v.thumb} alt={v.title} style={{ width: '100%', display: 'block' }} />
                  <div style={{ padding: 12, fontWeight: 600 }}>{v.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <IonModal isOpen={!!selected} onDidDismiss={() => setSelected(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selected?.title}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelected(null)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selected && (
              <div style={{ padding: 12 }}>
                <video className="player-video" controls playsInline poster={selected.thumb} preload="auto" style={{ width: '100%' }}>
                  <source src={selected.media} type="video/mp4" />
                </video>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Favoritos;


