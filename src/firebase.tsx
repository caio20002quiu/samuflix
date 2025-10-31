// Este arquivo foi refatorado para usar MongoDB Atlas ao invés de Firebase
// Todas as funções agora chamam a API do MongoDB Atlas

import { 
  fetchVideosFromApi, 
  saveVideoApi, 
  uploadVideoApi, 
  uploadThumbApi,
  saveFavoriteApi, 
  removeFavoriteApi, 
  fetchFavoritesByUserApi,
  saveMessageApi,
  fetchMessagesByUserApi
} from './api';

// Model
export type FirebaseVideo = {
  id: string;
  title: string;
  thumbUrl: string;
  publishedAt: number; // timestamp em ms
  mediaUrl: string; // url do vídeo
};

// Verifica se a API está disponível (sempre retorna true agora)
export function firebaseAvailable(): boolean {
  // Sempre retorna true já que usamos MongoDB Atlas
  return true;
}

// Upload de vídeo via API MongoDB
export async function uploadVideoBlob(id: string, blob: Blob, contentType = 'video/webm'): Promise<string> {
  try {
    const filename = `video-${id}.${contentType.split('/')[1] || 'webm'}`;
    return await uploadVideoApi(blob, filename);
  } catch (error: any) {
    console.error('Erro ao fazer upload do vídeo:', error);
    throw new Error(`Falha ao fazer upload: ${error?.message || error}`);
  }
}

// Upload de thumbnail via API MongoDB
export async function uploadDataUrlAsFile(id: string, dataUrl: string, ext = 'png'): Promise<string> {
  try {
    // Converter dataURL para blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const filename = `thumb-${id}.${ext}`;
    return await uploadThumbApi(blob, filename);
  } catch (error: any) {
    console.error('Erro ao fazer upload da thumbnail:', error);
    throw new Error(`Falha ao fazer upload da thumbnail: ${error?.message || error}`);
  }
}

// Salvar metadata do vídeo via API MongoDB
export async function saveVideoMetadata(item: FirebaseVideo): Promise<void> {
  try {
    await saveVideoApi({
      id: item.id,
      title: item.title,
      mediaUrl: item.mediaUrl,
      thumbUrl: item.thumbUrl,
      publishedAt: item.publishedAt
    });
  } catch (error: any) {
    console.error('Erro ao salvar metadata do vídeo:', error);
    throw new Error(`Falha ao salvar metadata: ${error?.message || error}`);
  }
}

// Buscar vídeos via API MongoDB
export async function fetchVideosFromFirestore(): Promise<FirebaseVideo[]> {
  try {
    const videos = await fetchVideosFromApi();
    return videos.map((v: any) => ({
      id: v.id || v._id?.toString() || '',
      title: v.title || '',
      thumbUrl: v.thumbUrl || v.thumb || '',
      publishedAt: v.publishedAt || v.createdAt || Date.now(),
      mediaUrl: v.mediaUrl || v.media || ''
    }));
  } catch (error: any) {
    console.error('Erro ao buscar vídeos:', error);
    throw new Error(`Falha ao buscar vídeos: ${error?.message || error}`);
  }
}

// -------------------- Favoritos --------------------
type FavoriteDoc = { userId: string; videoId: string; title: string; thumbUrl: string; mediaUrl: string; publishedAt: number };

export async function saveFavorite(userId: string, item: FavoriteDoc): Promise<void> {
  try {
    await saveFavoriteApi({
      userId: item.userId,
      videoId: item.videoId,
      title: item.title,
      thumbUrl: item.thumbUrl,
      mediaUrl: item.mediaUrl,
      publishedAt: item.publishedAt
    });
  } catch (error: any) {
    console.error('Erro ao salvar favorito:', error);
    throw new Error(`Falha ao salvar favorito: ${error?.message || error}`);
  }
}

export async function removeFavorite(userId: string, videoId: string): Promise<void> {
  try {
    await removeFavoriteApi(userId, videoId);
  } catch (error: any) {
    console.error('Erro ao remover favorito:', error);
    throw new Error(`Falha ao remover favorito: ${error?.message || error}`);
  }
}

export async function fetchFavoritesByUser(userId: string): Promise<FirebaseVideo[]> {
  try {
    const favorites = await fetchFavoritesByUserApi(userId);
    return favorites.map((f: any) => ({
      id: f.videoId || f.id || '',
      title: f.title || '',
      thumbUrl: f.thumbUrl || '',
      publishedAt: f.publishedAt || Date.now(),
      mediaUrl: f.mediaUrl || ''
    }));
  } catch (error: any) {
    console.error('Erro ao buscar favoritos:', error);
    throw new Error(`Falha ao buscar favoritos: ${error?.message || error}`);
  }
}

// -------------------- Mensagens --------------------
type MessageDoc = { userId: string; text: string; createdAt: number };

export async function saveMessage(userId: string, text: string): Promise<void> {
  try {
    await saveMessageApi(userId, text);
  } catch (error: any) {
    console.error('Erro ao salvar mensagem:', error);
    throw new Error(`Falha ao salvar mensagem: ${error?.message || error}`);
  }
}

export async function fetchMessagesByUser(userId: string): Promise<MessageDoc[]> {
  try {
    return await fetchMessagesByUserApi(userId);
  } catch (error: any) {
    console.error('Erro ao buscar mensagens:', error);
    throw new Error(`Falha ao buscar mensagens: ${error?.message || error}`);
  }
}
