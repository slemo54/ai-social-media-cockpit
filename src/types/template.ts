/**
 * Types per il sistema Template Thumio-style
 */

export interface PhotoZone {
  type: 'circle' | 'rectangle' | 'rect';
  // For circle: centerX, centerY, radius
  centerX?: number;
  centerY?: number;
  radius?: number;
  // For rectangle: x, y, width, height
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Template {
  template_id: string;
  name: string;
  category: 'IWP' | 'IWA' | 'UNIVERSAL';
  type: string;
  dimensions: {
    width: number;
    height: number;
    format?: string;
  };
  photoZone?: PhotoZone;
  layers?: TemplateLayer[];
  base_assets?: {
    background?: string;
    demoFigure?: string;
    fonts?: string[];
  };
  base_image_url?: string;
  ai_prompts?: {
    gemini?: string;
    openAI?: string;
  };
}

export interface TemplateLayer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'overlay';
  name: string;
  zIndex: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  editable: boolean;
  config?: ImageLayerConfig | TextLayerConfig | ShapeLayerConfig;
}

export interface ImageLayerConfig {
  mask?: 'circle' | 'rounded' | 'none';
  allowUpload: boolean;
  aiProcessing: 'none' | 'bg-remove' | 'style-transfer' | 'full';
  position?: { x: number; y: number };
}

export interface TextLayerConfig {
  defaultText: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  maxLength?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  position?: { x: number; y: number };
}

export interface ShapeLayerConfig {
  shapeType: 'rectangle' | 'circle' | 'custom';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  position?: { x: number; y: number };
}

export interface TemplateCategory {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

export interface UserTemplateInstance {
  id: string;
  user_id: string;
  template_id: string;
  custom_data: Record<string, any>;
  uploaded_images: string[];
  final_image_url?: string;
  status: 'draft' | 'processing' | 'completed';
  created_at: string;
  updated_at: string;
}
