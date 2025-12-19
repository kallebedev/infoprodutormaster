
export interface ProjectDetails {
  niche: string;
  productType: 'ebook' | 'course' | 'mentorship' | 'spreadsheet' | 'webinar';
  targetAudience: string;
  price: string;
  context: string; // From file or text input
}

export interface UserProfile {
  name: string;
  avatar?: string;
  age?: string;
  lifeGoals?: string;
}

export interface LearningFolder {
  id: string;
  name: string;
  createdAt: number;
  parentId?: string; // Support for nested folders
}

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  date: number;
  fontFamily?: string;
  folderId?: string; // Optional linkage to a folder
  attachment?: {
    name: string;
    type: string; // MIME type
    size: number;
    url: string; // Base64 Data URI
  };
}

export interface GeneratedMedia {
  id: string;
  type: 'image' | 'video';
  url: string; // Blob URL or Data URI
  prompt: string;
  aspectRatio: string;
  timestamp: number;
  metadata?: {
    resolution?: string;
    model?: string;
  };
}

// Deprecated but kept for backward compatibility if needed temporarily
export interface GeneratedImage extends GeneratedMedia {}

export interface SalesPageSection {
  id: string;
  type: 'hero' | 'problem' | 'solution' | 'benefits' | 'proof' | 'guarantee' | 'faq' | 'cta';
  content: {
    headline?: string;
    subheadline?: string;
    body?: string; // Markdown supported
    bullets?: string[];
    ctaText?: string;
    backgroundImage?: string; // Placeholder URL
  };
}

export interface SalesPageData {
  themeColor: string; // Tailwind class prefix
  sections: SalesPageSection[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  groundingMetadata?: {
    searchSources?: { title: string; uri: string }[];
    mapSources?: { title: string; uri: string }[];
  };
}

export interface ProductFolder {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  icon?: string;
}
