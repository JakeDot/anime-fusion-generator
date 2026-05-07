import PREDEFINED_SERIES from '../../series/series.json';

export interface BuildPromptOptions {
  selectedSeries: string[];
  customPrompt: string;
  negativePrompt: string;
  promptPrefix: string;
  transparentBackground: boolean;
  hasReferenceImages: boolean;
}

export function buildGenerationPrompt(options: BuildPromptOptions): string {
  const {
    selectedSeries,
    customPrompt,
    negativePrompt,
    promptPrefix,
    transparentBackground,
    hasReferenceImages
  } = options;

  const selectedPredefined = selectedSeries
    .filter(id => !id.startsWith('custom-'))
    .map(id => PREDEFINED_SERIES.find(s => s.id === id)?.name);
  
  const selectedCustom = selectedSeries
    .filter(id => id.startsWith('custom-'))
    .map(id => id.replace('custom-', ''));

  const allSeries = [...selectedPredefined, ...selectedCustom].join(", ");
  
  let fullPrompt = "";
  if (promptPrefix) {
    fullPrompt += `${promptPrefix.trim()} `;
  }
  if (allSeries) {
    fullPrompt += `Anime style fusion of ${allSeries}. `;
  }
  if (customPrompt) {
    fullPrompt += `${customPrompt}. `;
  }

  // Add weighting instructions if weights are detected
  if (fullPrompt.includes(":")) {
    fullPrompt += " INSTRUCTION: Interpret terms in (keyword:weight) format where weights > 1.0 mean more emphasis and < 1.0 mean less. ";
  }

  if (negativePrompt) {
    fullPrompt += ` NEGATIVE PROMPT: Strictly exclude the following elements: ${negativePrompt}. `;
  }

  if (hasReferenceImages) {
    fullPrompt += `CRITICAL: Combine the visual elements from ALL provided reference images into a single new composition. Do not just reproduce one of the images. `;
  }
  if (transparentBackground) {
    fullPrompt += "The subject should be on a plain white background for easy transparency removal. ";
  }
  fullPrompt += "High quality, detailed anime art.";

  return fullPrompt.trim();
}
