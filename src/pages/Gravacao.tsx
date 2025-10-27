import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonLabel } from '@ionic/react';
import { uploadVideoBlob, uploadDataUrlAsFile, saveVideoMetadata, firebaseAvailable } from '../firebase';
import React from 'react';
import './Gravacao.css';

const Gravacao: React.FC = () => {

    const previewRef = React.useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);

    const [recording, setRecording] = React.useState(false);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
    const [title, setTitle] = React.useState('');

    const startRecording = async () => {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;

            if (previewRef.current) {
                previewRef.current.srcObject = stream;
                try { await previewRef.current.play(); } catch (e) { /* autoplay blocked */ }
            }

            const mr = new MediaRecorder(stream);

            mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
            mr.onstart = () => { chunksRef.current = []; setRecording(true); };
            mr.onstop = () => {

                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
                setRecording(false);

                // stop tracks
                if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }

                // clear preview
                try { if (previewRef.current) previewRef.current.srcObject = null; } catch { }

            };
            mediaRecorderRef.current = mr;
            mr.start();

        } catch (err: any) {

            console.error(err);
            
            try {

                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const devs = await navigator.mediaDevices.enumerateDevices();
                    const msg = devs.map(d => `${d.kind} | ${d.deviceId} | ${d.label || 'label hidden (grant permission)'}`).join('\n');
                    alert(`Erro ao acessar câmera/microfone: ${String(err)}\n\nDispositivos encontrados:\n${msg}\n\nVerifique permissões do navegador, se a câmera/microfone estão conectadas, e execute o app em HTTPS ou localhost.`);
                    return;
                }

            } catch (e) {
                console.warn('enumerateDevices failed', e);
            }

            alert('Erro ao acessar câmera/microfone: ' + String(err) + '\nVerifique permissões');

        }
    };

    const stopRecording = () => {

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();

    };

    const saveRecording = () => {

        if (!blobUrl) return alert('Nenhuma gravação disponível');
        if (!title) return alert('Digite um título');

        (async () => {
            try {

                // fetch blob
                const resp = await fetch(blobUrl);
                const blob = await resp.blob();
                const id = String(Date.now());
                let mediaUrl = '';
                let thumbUrl = '';

                // try to use Firebase if available
                if (firebaseAvailable()) {
                    try {
                        // upload video blob
                        mediaUrl = await uploadVideoBlob(id, blob, blob.type || 'video/webm');

                        // create thumbnail by drawing first frame
                        const thumbDataUrl = await new Promise<string>((res) => {
                            const v = document.createElement('video');
                            v.src = URL.createObjectURL(blob);
                            v.muted = true;
                            v.playsInline = true;
                            v.addEventListener('loadeddata', () => {
                                try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = v.videoWidth || 320;
                                    canvas.height = v.videoHeight || 180;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                                    res(canvas.toDataURL('image/png'));
                                } catch (e) {
                                    res('');
                                }
                            });
                            // fallback if loadeddata doesn't fire
                            setTimeout(() => res(''), 2000);
                        });

                        if (thumbDataUrl) {
                            try {
                                thumbUrl = await uploadDataUrlAsFile(id, thumbDataUrl, 'png');
                            } catch (e) {
                                console.warn('Thumbnail upload failed', e);
                            }
                        }

                        // save metadata to Firestore
                        await saveVideoMetadata({ id, title, mediaUrl, thumbUrl, publishedAt: Date.now() });
                        alert('Gravação salva no Firebase!');

                        // cleanup
                        setTimeout(() => { if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); } }, 5000);
                        return;
                    } catch (e) {
                        console.warn('Firebase saving failed, falling back to Preferences', e);
                        // fallthrough to local save
                    }
                }


                // save metadados
                const item = { id, title, mediaUrl, thumbUrl, publishedAt: Date.now() };

                const { Preferences } = await import('@capacitor/preferences');
                const { value } = await Preferences.get({ key: 'videos' });
                const list = value ? JSON.parse(value) : [];
                list.unshift(item);
                await Preferences.set({ key: 'videos', value: JSON.stringify(list) });
                alert('Gravação salva!');

                // cleanup
                setTimeout(() => { if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); } }, 5000);

            } catch (err) {
                console.error(err);
                alert('Erro ao salvar gravação: ' + err);
            }
        })();

    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Gravar Vídeo</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 8 }}>Preview da câmera:</div>
                    <video ref={previewRef} style={{ width: '100%', background: '#000' }} playsInline muted autoPlay />

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!recording ? (
                            <IonButton onClick={startRecording}>Iniciar</IonButton>
                        ) : (
                            <IonButton color="danger" onClick={stopRecording}>Parar</IonButton>
                        )}

                        <IonItem style={{ flex: 1 }}>
                            <IonLabel position="stacked">Título</IonLabel>
                            <IonInput value={title} placeholder="Título do vídeo" onIonChange={e => setTitle(String(e.detail.value || ''))} />
                        </IonItem>

                        <IonButton onClick={saveRecording} disabled={!blobUrl}>Salvar</IonButton>
                    </div>

                    {blobUrl && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ marginBottom: 8 }}>Gravação pronta:</div>
                            <video src={blobUrl} controls style={{ width: '100%' }} />
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Gravacao;
