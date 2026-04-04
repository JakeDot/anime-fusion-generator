import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GeneratorPage } from './generator/generator-page';
import { SharePage } from './share/share-page';
import { useAutoDream } from './auto/use-auto-dream';

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
