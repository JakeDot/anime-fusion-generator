import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GeneratorPage } from './generator/GeneratorPage';
import { SharePage } from './share/SharePage';
import { useAutoDream } from './auto/useAutoDream';

export default function App() {
  // Initialize the auto dream service
  useAutoDream();

  return (
    <Routes>
      <Route path="/" element={<GeneratorPage />} />
      <Route path="/share/:id" element={<SharePage />} />
    </Routes>
  );
}
