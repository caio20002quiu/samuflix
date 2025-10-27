import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import React from 'react';
import './Mensagens.css';

const Mensagens: React.FC = () => {
  const autores = [
    { nome: 'Aluno UCDB', descricao: 'ra55555@ucdb.br' },
    { nome: 'Aluno UCDB', descricao: 'ra55555@ucdb.br' },
    { nome: 'Aluno UCDB', descricao: 'ra55555@ucdb.br' }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Autores</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Autores</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div style={{ maxWidth: 400, margin: '32px auto', padding: 16 }}>
          <h2>Equipe</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {autores.map((autor, idx) => (
              <li key={idx} style={{ marginBottom: 24, background: '#075f58ff', borderRadius: 8, padding: 16 }}>
                <strong>{autor.nome}</strong>
                <br />
                <span>{autor.descricao}</span>
              </li>
            ))}
          </ul>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Mensagens;
