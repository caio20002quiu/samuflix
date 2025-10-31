import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonModal, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { heartOutline, heart } from 'ionicons/icons';
import { saveFavorite, removeFavorite, fetchVideosFromFirestore, saveVideoMetadata, uploadDataUrlAsFile } from '../firebase';
import { fetchVideosFromApi, saveFavoriteApi, removeFavoriteApi } from '../api';
import { generateThumbnailFromVideoUrl } from '../utils/videoThumbnail';

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
    
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = React.useState<Video | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    (async () => {
      // Carregar apenas vídeos do MongoDB Atlas
      try {
        const remote = await fetchVideosFromFirestore();
        if (remote && remote.length) {
          const mapped: Video[] = await Promise.all(remote.map(async (r) => {
            let thumbUrl = r.thumbUrl || '';
            
            // Se não tem thumbnail mas tem vídeo, gerar uma automaticamente
            if (!thumbUrl && r.mediaUrl) {
              try {
                const thumbDataUrl = await generateThumbnailFromVideoUrl(r.mediaUrl);
                if (thumbDataUrl) {
                  try {
                    // Fazer upload da thumbnail gerada
                    thumbUrl = await uploadDataUrlAsFile(r.id || `thumb-${r.publishedAt}`, thumbDataUrl, 'png');
                    
                    // Atualizar o vídeo no MongoDB com a nova thumbnail
                    await saveVideoMetadata({
                      id: r.id || '',
                      title: r.title,
                      thumbUrl: thumbUrl,
                      mediaUrl: r.mediaUrl,
                      publishedAt: r.publishedAt
                    });
                  } catch (e) {
                    console.warn('Erro ao salvar thumbnail gerada:', e);
                  }
                }
              } catch (e) {
                console.warn('Erro ao gerar thumbnail:', e);
              }
            }
            
            return {
              id: r.id || `remote-${r.publishedAt}-${Math.random()}`, 
              title: r.title, 
              thumb: thumbUrl, 
              publishedAt: r.publishedAt, 
              media: r.mediaUrl 
            };
          }));
          
          // Remover duplicatas e ordenar por data
          const uniqueVideos = Array.from(
            new Map(mapped.map(v => [v.id, v])).values()
          ).sort((a, b) => b.publishedAt - a.publishedAt);
          setVideos(uniqueVideos);
        } else {
          // Se não houver vídeos no MongoDB, mostrar vazio
          setVideos([]);
        }
      } catch (e) {
        // Tenta fallback para API direta
        try {
          const remote = await fetchVideosFromApi();
          if (remote && remote.length) {
            const mapped: Video[] = await Promise.all(remote.map(async (r: any) => {
              let thumbUrl = r.thumbUrl || r.thumb || '';
              
              // Se não tem thumbnail mas tem vídeo, gerar uma automaticamente
              if (!thumbUrl && (r.mediaUrl || r.media)) {
                try {
                  const videoUrl = r.mediaUrl || r.media;
                  const thumbDataUrl = await generateThumbnailFromVideoUrl(videoUrl);
                  if (thumbDataUrl) {
                    try {
                      // Fazer upload da thumbnail gerada
                      const videoId = r.id || r._id?.toString() || `api-${r.publishedAt}`;
                      thumbUrl = await uploadDataUrlAsFile(videoId, thumbDataUrl, 'png');
                      
                      // Atualizar o vídeo no MongoDB com a nova thumbnail
                      await saveVideoMetadata({
                        id: videoId,
                        title: r.title,
                        thumbUrl: thumbUrl,
                        mediaUrl: videoUrl,
                        publishedAt: r.publishedAt
                      });
                    } catch (e) {
                      console.warn('Erro ao salvar thumbnail gerada:', e);
                    }
                  }
                } catch (e) {
                  console.warn('Erro ao gerar thumbnail:', e);
                }
              }
              
              return {
                id: r.id || r._id?.toString() || `api-${r.publishedAt}-${Math.random()}`, 
                title: r.title, 
                thumb: thumbUrl, 
                publishedAt: r.publishedAt, 
                media: r.mediaUrl || r.media 
              };
            }));
            
            const uniqueVideos = Array.from(
              new Map(mapped.map(v => [v.id, v])).values()
            ).sort((a, b) => b.publishedAt - a.publishedAt);
            setVideos(uniqueVideos);
          } else {
            setVideos([]);
          }
        } catch (error) {
          console.error('Erro ao carregar vídeos:', error);
          setVideos([]);
        }
      }

      // Carregar favoritos salvos localmente (apenas para a lista de favoritos)
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { value: favValue } = await Preferences.get({ key: 'favorites' });
        if (favValue) {
          try {
            const favs: string[] = JSON.parse(favValue);
            setFavoriteIds(new Set(favs));
          } catch { /* ignore */ }
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

  const isFavorite = (id: string) => favoriteIds.has(id);
  const toggleFavorite = async (video: Video) => {
    const next = new Set(favoriteIds);
    if (next.has(video.id)) next.delete(video.id); else next.add(video.id);
    setFavoriteIds(next);
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'favorites', value: JSON.stringify(Array.from(next)) });
      // ensure we also cache the favorite objects for a standalone Favoritos tela
      const { value } = await Preferences.get({ key: 'favoriteItems' });
      const map: Record<string, Video> = value ? JSON.parse(value) : {};
      map[video.id] = video;
      await Preferences.set({ key: 'favoriteItems', value: JSON.stringify(map) });
      // sincroniza com backend disponível (Firebase ou API Atlas)
      const { value: dv } = await Preferences.get({ key: 'deviceId' });
      let deviceId = dv || '';
      if (!deviceId) {
        deviceId = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
        await Preferences.set({ key: 'deviceId', value: deviceId });
      }
      // Usar MongoDB Atlas para favoritos
      try {
        if (next.has(video.id)) {
          await saveFavorite(deviceId, { userId: deviceId, videoId: video.id, title: video.title, thumbUrl: video.thumb, mediaUrl: video.media, publishedAt: video.publishedAt });
        } else {
          await removeFavorite(deviceId, video.id);
        }
      } catch (e) {
        // Fallback para API direta
        try {
          if (next.has(video.id)) {
            await saveFavoriteApi({ userId: deviceId, videoId: video.id, title: video.title, thumbUrl: video.thumb, mediaUrl: video.media, publishedAt: video.publishedAt });
          } else {
            await removeFavoriteApi(deviceId, video.id);
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  };

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
              {v.thumb ? (
                <img className="video-thumb" src={v.thumb} alt={v.title} />
              ) : (
                <div className="video-thumb" style={{ backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  Sem imagem
                </div>
              )}
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
                {selectedVideo.media ? (
                  <video className="player-video" controls playsInline muted autoPlay poster={selectedVideo.thumb || undefined} preload="auto">
                    <source src={selectedVideo.media} type="video/mp4" />
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#000', color: '#fff' }}>
                    Vídeo não disponível
                  </div>
                )}
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700 }}>{selectedVideo.title}</div>
                  <div style={{ color: 'var(--ion-color-medium)', marginTop: 6 }}>Publicado em {formatDate(selectedVideo.publishedAt)}</div>
                  <div style={{ marginTop: 12 }}>
                    <IonButton onClick={() => selectedVideo && toggleFavorite(selectedVideo)} fill="outline">
                      <IonIcon icon={isFavorite(selectedVideo!.id) ? heart : heartOutline} slot="start" />
                      {isFavorite(selectedVideo!.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    </IonButton>
                  </div>
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
