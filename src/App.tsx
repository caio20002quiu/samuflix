import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { play, add, people } from 'ionicons/icons';
import Gravacao from './pages/Gravacao';
import Galeria from './pages/Galeria';
import Mensagens from './pages/Mensagens';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const LazySplash = React.lazy(() => import('./components/SplashScreen'));

const App: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <IonApp>
      {showSplash ? (
        // Lazy load SplashScreen so it doesn't affect initial bundle too much
        <React.Suspense fallback={null}>
          <LazySplash />
        </React.Suspense>
      ) : (
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/galeria">
                <Galeria />
              </Route>
              <Route exact path="/gravacao">
                <Gravacao />
              </Route>
              <Route path="/mensagens">
                <Mensagens />
              </Route>
              <Route exact path="/">
                <Redirect to="/galeria" />
              </Route>
            </IonRouterOutlet>
            <IonTabBar slot="bottom">
              <IonTabButton tab="galeria" href="/galeria">
                <IonIcon aria-hidden="true" icon={play} />
                <IonLabel>Últimos Vídeos</IonLabel>
              </IonTabButton>
              <IonTabButton tab="tab2" href="/gravacao">
                <IonIcon aria-hidden="true" icon={add} />
                <IonLabel>Enviar Vídeo</IonLabel>
              </IonTabButton>
              <IonTabButton tab="tab3" href="/mensagens">
                <IonIcon aria-hidden="true" icon={people} />
                <IonLabel>Mensagens</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      )}
    </IonApp>
  );
};

export default App;
