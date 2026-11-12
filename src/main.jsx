import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { healthApi } from './services/healthApi';

createRoot(document.getElementById('root')).render(<App />);

healthApi.check()
  .then((data) => console.log('Backend Connected:', data))
  .catch((error) => console.error('Backend Error:', error));
