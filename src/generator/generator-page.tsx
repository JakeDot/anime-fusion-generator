/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Header, MobileNav, Footer } from './components/layout';
import { SeriesGrid } from '../series/series-grid';
import { ImageUploader } from './components/image-uploader';
import { GeneratorSection } from './components/generator-section';
import { HistorySection } from '../history/history-section';
import { EditModal } from './components/edit-modal';
import { SettingsModal } from './components/settings-modal';
import { StatusModal } from './components/status-modal';
import { ImpressumModal } from './components/impressum-modal';
import { useUndoRedo } from './hooks/use-undo-redo';
import { useImageUpload } from './hooks/use-image-upload';
import { useGenerateFusion } from './hooks/use-generate-fusion';
import { DynamicBackground } from './components/dynamic-background';

import PREDEFINED_SERIES from '../series/series.json';

const API_KEY = process.env.GEMINI_API_KEY || "";

export function GeneratorPage() {
  // --- State ---
  const { state: undoState, update: updateUndoState, commit: commitUndoState, setAndCommit, undo, redo, canUndo, canRedo } = useUndoRedo({ prompt: "", series: [] });
  const selectedSeries = undoState.series;
  const customPrompt = undoState.prompt;

  const [customSeries, setCustomSeries] = useState<string[]>([]);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [promptPrefix, setPromptPrefix] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || "");
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('gemini_model') || "gemini-2.5-flash-image");
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [generateMusic, setGenerateMusic] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isImpressumOpen, setIsImpressumOpen] = useState(false);
  
  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Custom Hooks
  const {
    referenceImages,
    setReferenceImages,
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImageUpload,
    removeImage
  } = useImageUpload();

  const {
    isGenerating,
    isGeneratingMusic,
    generatedImage,
    draftImage,
    history,
    setHistory,
    error,
    generateFusion,
    downloadImage,
    handleIterate
  } = useGenerateFusion({
    selectedSeries,
    customPrompt,
    negativePrompt,
    referenceImages,
    transparentBackground,
    generateMusic,
    userApiKey,
    selectedModel,
    promptPrefix,
    setReferenceImages,
    setAndCommit
  });

  // --- Handlers ---
  const setCustomPrompt = (val: string) => {
    updateUndoState({ prompt: val });
  };

  const setSelectedSeries = (updater: (prev: string[]) => string[]) => {
    setAndCommit({ series: updater(undoState.series) });
  };
  
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const addCustomSeries = () => {
    if (newSeriesName.trim()) {
      setCustomSeries(prev => [...prev, newSeriesName.trim()]);
      setSelectedSeries(prev => [...prev, `custom-${newSeriesName.trim()}`]);
      setNewSeriesName("");
    }
  };

  const removeCustomSeries = (name: string) => {
    setCustomSeries(prev => prev.filter(s => s !== name));
    setSelectedSeries(prev => prev.filter(s => s !== `custom-${name}`));
  };

  const toggleSeries = (id: string) => {
    setSelectedSeries(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <DynamicBackground generatedImage={generatedImage} />

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <Header onSettingsClick={() => setIsSettingsOpen(true)} />

        <SeriesGrid 
          predefinedSeries={PREDEFINED_SERIES}
          selectedSeries={selectedSeries}
          customSeries={customSeries}
          newSeriesName={newSeriesName}
          setNewSeriesName={setNewSeriesName}
          toggleSeries={toggleSeries}
          addCustomSeries={addCustomSeries}
          removeCustomSeries={removeCustomSeries}
        />

        <ImageUploader 
          referenceImages={referenceImages}
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          fileInputRef={fileInputRef}
        />

        <GeneratorSection 
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
          commitPrompt={commitUndoState}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          transparentBackground={transparentBackground}
          setTransparentBackground={setTransparentBackground}
          generateMusic={generateMusic}
          setGenerateMusic={setGenerateMusic}
          isGenerating={isGenerating}
          isGeneratingMusic={isGeneratingMusic}
          generateFusion={generateFusion}
          generatedImage={generatedImage}
          draftImage={draftImage}
          error={error}
          downloadImage={downloadImage}
          setIsEditing={setIsEditing}
          onIterate={handleIterate}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        <HistorySection 
          history={history}
          setHistory={setHistory}
          downloadImage={downloadImage}
          onIterate={handleIterate}
        />
        
        <Footer 
          onStatusClick={() => setIsStatusOpen(true)} 
          onImpressumClick={() => setIsImpressumOpen(true)}
        />
      </main>

      <EditModal 
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        generatedImage={generatedImage}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        promptPrefix={promptPrefix}
        setPromptPrefix={setPromptPrefix}
        userApiKey={userApiKey}
        setUserApiKey={(key) => {
          setUserApiKey(key);
          if (key.trim()) {
            localStorage.setItem('gemini_api_key', key.trim());
          } else {
            localStorage.removeItem('gemini_api_key');
          }
        }}
        selectedModel={selectedModel}
        setSelectedModel={(model) => {
          setSelectedModel(model);
          localStorage.setItem('gemini_model', model);
        }}
      />

      <StatusModal 
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        apiKey={userApiKey.trim() || API_KEY}
      />

      <ImpressumModal 
        isOpen={isImpressumOpen}
        onClose={() => setIsImpressumOpen(false)}
      />

      <MobileNav onSettingsClick={() => setIsSettingsOpen(true)} />
    </div>
  );
}
