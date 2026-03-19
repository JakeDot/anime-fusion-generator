import React from 'react';
import { Plus, X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface SeriesGridProps {
  predefinedSeries: any[];
  selectedSeries: string[];
  customSeries: string[];
  newSeriesName: string;
  setNewSeriesName: (val: string) => void;
  toggleSeries: (id: string) => void;
  addCustomSeries: () => void;
  removeCustomSeries: (name: string) => void;
}

export const SeriesGrid: React.FC<SeriesGridProps> = ({
  predefinedSeries,
  selectedSeries,
  customSeries,
  newSeriesName,
  setNewSeriesName,
  toggleSeries,
  addCustomSeries,
  removeCustomSeries
}) => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          Select Anime Series
        </h2>
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
          {selectedSeries.length} Selected
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {predefinedSeries.map((series) => {
          const isSelected = selectedSeries.includes(series.id);
          return (
            <motion.button
              key={series.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSeries(series.id)}
              className={`relative group p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                isSelected 
                  ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.1)]' 
                  : 'bg-neutral-900/50 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl transition-transform duration-500 group-hover:scale-110 ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {series.icon}
                </div>
                <h3 className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                  {series.name}
                </h3>
                <p className={`text-[10px] mt-1 leading-tight ${isSelected ? 'text-indigo-200/70' : 'text-neutral-600'}`}>
                  {series.desc}
                </p>
              </div>
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20 transition-colors ${
                isSelected ? 'bg-indigo-500' : 'bg-transparent'
              }`}></div>
            </motion.button>
          );
        })}

        {customSeries.map((name) => {
          const id = `custom-${name}`;
          const isSelected = selectedSeries.includes(id);
          return (
            <motion.div
              key={id}
              whileHover={{ y: -4 }}
              className={`relative group p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                isSelected 
                  ? 'bg-emerald-600/10 border-emerald-500/50' 
                  : 'bg-neutral-900/50 border-white/5'
              }`}
            >
              <button 
                onClick={() => toggleSeries(id)}
                className="w-full h-full text-left"
              >
                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl ${
                  isSelected ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  ✨
                </div>
                <h3 className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                  {name}
                </h3>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomSeries(name);
                }}
                className="absolute top-3 right-3 p-1 hover:bg-red-500/20 rounded-md text-neutral-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}

        <div className="p-4 rounded-2xl border border-dashed border-white/10 bg-transparent flex flex-col gap-3">
          <input 
            type="text"
            placeholder="Other series..."
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomSeries()}
            className="bg-neutral-900/50 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button 
            onClick={addCustomSeries}
            disabled={!newSeriesName.trim()}
            className="w-full py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-3 h-3" /> Add Custom
          </button>
        </div>
      </div>
    </section>
  );
};
