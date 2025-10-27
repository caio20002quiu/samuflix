import React from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  return (
    <div className="app-splash">
      <div className="app-splash-content">
        <img src="/resources/icon.png" alt="Logo" className="app-splash-logo" />
        <h1>SamuFlix</h1>
        <p>Carregando...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
