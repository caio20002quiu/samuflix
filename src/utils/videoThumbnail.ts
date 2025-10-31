/**
 * Utilitário para gerar thumbnails a partir de vídeos
 */

/**
 * Gera uma thumbnail do primeiro frame de um vídeo a partir de uma URL
 * @param videoUrl URL do vídeo
 * @returns Promise com dataURL da thumbnail ou string vazia se falhar
 */
export async function generateThumbnailFromVideoUrl(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    
    let resolved = false;
    
    const captureFrame = () => {
      if (resolved || video.readyState < 2) return;
      
      try {
        video.currentTime = 0.1; // Ir para o primeiro frame
      } catch (e) {
        // Se currentTime não funcionar, tenta com o frame atual
        tryCapture();
      }
    };
    
    const tryCapture = () => {
      if (resolved || video.readyState < 2) return;
      
      try {
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        
        // Manter proporção mas limitar tamanho
        const maxWidth = 640;
        const maxHeight = 360;
        let canvasWidth = width;
        let canvasHeight = height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          canvasWidth = width * ratio;
          canvasHeight = height * ratio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
          resolved = true;
          resolve(canvas.toDataURL('image/png'));
        } else {
          if (!resolved) {
            resolved = true;
            resolve('');
          }
        }
      } catch (e) {
        if (!resolved) {
          resolved = true;
          resolve('');
        }
      }
    };
    
    video.addEventListener('loadedmetadata', captureFrame);
    video.addEventListener('loadeddata', () => {
      setTimeout(captureFrame, 100);
    });
    video.addEventListener('seeked', tryCapture);
    video.addEventListener('canplay', () => {
      setTimeout(tryCapture, 100);
    });
    video.addEventListener('error', () => {
      if (!resolved) {
        resolved = true;
        resolve('');
      }
    });
    
    video.src = videoUrl;
    video.load();
    
    // Timeout de segurança (5 segundos)
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve('');
      }
    }, 5000);
  });
}

/**
 * Gera uma thumbnail do primeiro frame de um vídeo a partir de um Blob
 * @param blob Blob do vídeo
 * @returns Promise com dataURL da thumbnail ou string vazia se falhar
 */
export async function generateThumbnailFromBlob(blob: Blob): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const thumbDataUrl = await generateThumbnailFromVideoUrl(objectUrl);
    return thumbDataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

