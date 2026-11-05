import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for offline support and asset precaching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: New portfolio update ready');
  },
  onOfflineReady() {
    console.log('PWA: Portfolio ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
