import {StrictMode, useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAndSyncData } from './firebase';

function MainApp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAndSyncData()
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to sync with Firebase:", err);
        // Fallback to offline mode gracefully so user can still operate
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center font-sans select-none">
        <div className="relative flex items-center justify-center mb-6">
          <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-indigo-400/20 opacity-75"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-2 border-t-indigo-500"></div>
        </div>
        <h2 className="text-lg font-extrabold tracking-widest text-slate-100 uppercase">UPTD PSDA PU PR</h2>
        <p className="text-xs text-slate-400 mt-2 font-mono font-medium animate-pulse">Menghubungkan & Sinkronisasi Cloud Database...</p>
      </div>
    );
  }

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<MainApp />);
