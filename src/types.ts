export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  series: string[];
  timestamp: number;
}

export interface ReferenceImage {
  id: string;
  data: string;
  mimeType: string;
}

export interface Series {
  id: string;
  name: string;
  icon: string;
  color: string;
}
