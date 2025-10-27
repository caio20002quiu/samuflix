import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonModal, IonButtons, IonButton } from '@ionic/react';
import { fetchVideosFromFirestore, firebaseAvailable } from '../firebase';

import React from 'react';
import './Galeria.css';

// Tipo simples para um vídeo
type Video = {
  id: string;
  title: string;
  thumb: string;
  publishedAt: number; // timestamp em ms
  media: string; // url do vídeo
};

// Mock com 5 vídeos de teste
const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Resgate no Bairro Central',
    thumb: 'https://picsum.photos/seed/1/640/360',
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: '2',
    title: 'Primeiros Socorros - Tutorial',
    thumb: 'https://picsum.photos/seed/2/640/360',
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: '3',
    title: 'Como utilizar o desfibrilador',
    thumb: 'https://picsum.photos/seed/3/640/360',
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  },
  {
    id: '4',
    title: 'Simulação de Atendimento',
    thumb: 'https://picsum.photos/seed/4/640/360',
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: '5',
    title: 'Treinamento RCP',
    thumb: 'https://picsum.photos/seed/5/640/360',
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  }
];

const Galeria: React.FC = () => {
    
  const [videos, setVideos] = React.useState<Video[]>(MOCK_VIDEOS);
  const [selectedVideo, setSelectedVideo] = React.useState<Video | null>(null);

  React.useEffect(() => {
    (async () => {

      // try load from Firestore as well when configured
      try {
        if (firebaseAvailable()) {
          const remote = await fetchVideosFromFirestore();
          if (remote && remote.length) {
            const mapped: Video[] = remote.map(r => ({ id: r.id, title: r.title, thumb: r.thumbUrl, publishedAt: r.publishedAt, media: r.mediaUrl }));
            setVideos(prev => [...mapped, ...prev]);
          }
        }
      } catch (e) {
        // ignore firebase errors
      }

      try {

        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: 'videos' });

        if (value) {

          const saved = JSON.parse(value) as any[];
          
          const savedVideos: Video[] = saved.map(s => ({
            id: s.id,
            title: s.title,
            thumb: s.thumb || '',
            publishedAt: s.createdAt || Date.now(),
            media: s.media || ''
          }));

          setVideos(prev => [...savedVideos, ...prev]);

        }
      } catch (e) {
        // ignore
      }

    })();
  }, []);

  // Formato simples para exibir data em pt-BR
  const formatDate = (ts: number) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(ts));
  const openVideo = (v: Video) => setSelectedVideo(v);
  const closeVideo = () => setSelectedVideo(null);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>SamuFlix</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Últimos Vídeos</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="video-list">
          {videos.map((v) => (
            <div className="video-card" key={v.id} onClick={() => openVideo(v)} role="button" tabIndex={0}>
              <img className="video-thumb" src={v.thumb} alt={v.title} />
              <div className="video-meta">
                <div className="video-title">{v.title}</div>
                <div className="video-date">Publicado em {formatDate(v.publishedAt)}</div>
              </div>
            </div>
          ))}
        </div>

        <IonModal isOpen={selectedVideo != null} onDidDismiss={closeVideo}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedVideo?.title}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeVideo}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-player-content">
            {selectedVideo && (
              <div className="player-wrap">
                {/* video simplificado: autoPlay muted para aumentar chance de reprodução automática */}
                <video className="player-video" controls playsInline muted autoPlay poster={selectedVideo.thumb} preload="auto">
                  <source src={selectedVideo.media} type="video/mp4" />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700 }}>{selectedVideo.title}</div>
                  <div style={{ color: 'var(--ion-color-medium)', marginTop: 6 }}>Publicado em {formatDate(selectedVideo.publishedAt)}</div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Galeria;
