const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Helper para obter URL completa do arquivo
function getFullUrl(url: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return `${API_URL}/${url}`;
}

// Vídeos
export async function fetchVideosFromApi() {
  try {
    const res = await fetch(`${API_URL}/videos`);
    if (!res.ok) throw new Error('Erro ao buscar vídeos');
    const videos = await res.json();
    // Garantir que as URLs sejam completas
    return videos.map((v: any) => ({
      ...v,
      mediaUrl: v.mediaUrl ? getFullUrl(v.mediaUrl) : v.mediaUrl,
      thumbUrl: v.thumbUrl ? getFullUrl(v.thumbUrl) : v.thumbUrl
    }));
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    throw error;
  }
}

export async function saveVideoApi(payload: { id: string; title: string; mediaUrl: string; thumbUrl: string; publishedAt: number; }) {
  try {
    const res = await fetch(`${API_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao salvar vídeo');
    return await res.json();
  } catch (error) {
    console.error('Erro ao salvar vídeo:', error);
    throw error;
  }
}

// Upload de vídeo
export async function uploadVideoApi(blob: Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('video', blob, filename);
    
    const res = await fetch(`${API_URL}/videos/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao fazer upload do vídeo');
    }
    
    const data = await res.json();
    return getFullUrl(data.url);
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo:', error);
    throw error;
  }
}

// Upload de thumbnail
export async function uploadThumbApi(blob: Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('thumb', blob, filename);
    
    const res = await fetch(`${API_URL}/videos/upload-thumb`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao fazer upload da thumbnail');
    }
    
    const data = await res.json();
    return getFullUrl(data.url);
  } catch (error) {
    console.error('Erro ao fazer upload da thumbnail:', error);
    throw error;
  }
}

// Favoritos
export async function saveFavoriteApi(payload: { userId: string; videoId: string; title: string; thumbUrl: string; mediaUrl: string; publishedAt: number; }) {
  try {
    const res = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro ao salvar favorito');
    return await res.json();
  } catch (error) {
    console.error('Erro ao salvar favorito:', error);
    throw error;
  }
}

export async function removeFavoriteApi(userId: string, videoId: string) {
  try {
    const res = await fetch(`${API_URL}/favorites/${userId}/${videoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover favorito');
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    throw error;
  }
}

export async function fetchFavoritesByUserApi(userId: string) {
  try {
    const res = await fetch(`${API_URL}/favorites/${userId}`);
    if (!res.ok) throw new Error('Erro ao buscar favoritos');
    const favorites = await res.json();
    // Garantir que as URLs sejam completas
    return favorites.map((f: any) => ({
      ...f,
      mediaUrl: f.mediaUrl ? getFullUrl(f.mediaUrl) : f.mediaUrl,
      thumbUrl: f.thumbUrl ? getFullUrl(f.thumbUrl) : f.thumbUrl
    }));
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    throw error;
  }
}

// Mensagens
export async function saveMessageApi(userId: string, text: string) {
  try {
    const res = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, createdAt: Date.now() })
    });
    if (!res.ok) throw new Error('Erro ao salvar mensagem');
    return await res.json();
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    throw error;
  }
}

export async function fetchMessagesByUserApi(userId: string) {
  try {
    const res = await fetch(`${API_URL}/messages/${userId}`);
    if (!res.ok) throw new Error('Erro ao buscar mensagens');
    return await res.json();
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
}


