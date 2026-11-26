import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (!window.__DAILY_BREAD_PORTABLE__ && window.location.protocol !== 'file:') {
  registerSW({immediate: true});
}

createRoot(document.getElementById('root')!).render(<App />);
