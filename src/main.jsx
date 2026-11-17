import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installGlobalDiagnostics } from './services/diagnosticsService';
import './styles/globals.css';
import './styles/variables.css';
import './styles/design-system.css';
import './styles/themes.css';

installGlobalDiagnostics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
