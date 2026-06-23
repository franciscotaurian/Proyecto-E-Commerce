import React from 'react';
import AppProvider from './presentation/context/AppProvider.jsx';
import AppRouter from './presentation/routes/AppRouter.jsx';
import './index.css';

function App() {
  return (
    <AppProvider> {/* global context */}
      <AppRouter /> {/* routes */}
    </AppProvider>
  );
}

export default App;
