-- ============================================
-- SETUP DATABASE TEMPLATE SYSTEM
-- AI Social Cockpit - Thumio-style Templates
-- ============================================

-- 1. Tabella templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('IWP', 'IWA', 'UNIVERSAL')),
  type VARCHAR(50) NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{"width": 1080, "height": 1080, "format": "square"}',
  layers JSONB NOT NULL DEFAULT '[]',
  customization JSONB NOT NULL DEFAULT '{}',
  base_assets JSONB NOT NULL DEFAULT '{}',
  ai_prompts JSONB NOT NULL DEFAULT '{}',
  base_image_url TEXT,
  demo_figure_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella template_categories
CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

-- 3. Tabella user_template_instances
CREATE TABLE IF NOT EXISTS user_template_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id VARCHAR(100) NOT NULL REFERENCES templates(template_id),
  custom_data JSONB NOT NULL DEFAULT '{}',
  uploaded_images JSONB NOT NULL DEFAULT '[]',
  final_image_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indici
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_user_instances_user ON user_template_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_instances_template ON user_template_instances(template_id);

-- 5. Funzione updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Triggers
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_instances_updated_at ON user_template_instances;
CREATE TRIGGER update_user_instances_updated_at
  BEFORE UPDATE ON user_template_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATI INIZIALI
-- ============================================

-- Categorie
INSERT INTO template_categories (slug, name, description, icon, sort_order) VALUES
  ('iwp-podcast', 'IWP Podcast', 'Template per episodi podcast e interviste', 'mic', 1),
  ('iwp-events', 'IWP Eventi', 'Template per eventi, fiere e masterclass', 'calendar', 2),
  ('iwp-promo', 'IWP Promozionali', 'Template promozionali e marketing', 'megaphone', 3),
  ('iwa-courses', 'IWA Corsi WSET', 'Template per corsi WSET e formazione', 'graduation-cap', 4),
  ('iwa-educational', 'IWA Educational', 'Contenuti educativi e infografiche', 'book-open', 5),
  ('universal', 'Template Universali', 'Stili minimal adatti ad entrambi i brand', 'layout', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Template
INSERT INTO templates (template_id, name, category, type, dimensions, layers, base_assets, ai_prompts) VALUES
(
  'iwp-ambassador-circle',
  'Ambassador''s Corner',
  'IWP',
  'podcast',
  '{"width": 1080, "height": 1080, "format": "square"}'::jsonb,
  '[
    {"id": "bg", "type": "shape", "name": "Background", "zIndex": 0, "editable": false},
    {"id": "photo-circle", "type": "image", "name": "Foto Ospite", "zIndex": 1, "editable": true, "position": {"x": 290, "y": 200}, "size": {"width": 500, "height": 500}, "config": {"mask": "circle", "allowUpload": true, "aiProcessing": "full"}},
    {"id": "title-arch", "type": "text", "name": "Titolo", "zIndex": 2, "editable": true, "position": {"x": 100, "y": 50}, "config": {"defaultText": "AMBASSADOR''S CORNER", "fontFamily": "Playfair Display", "fontSize": 48, "color": "#FFFFFF", "alignment": "center"}},
    {"id": "controls", "type": "overlay", "name": "Player Controls", "zIndex": 3, "editable": false},
    {"id": "guest-name", "type": "text", "name": "Nome Ospite", "zIndex": 4, "editable": true, "position": {"x": 100, "y": 900}, "config": {"defaultText": "Nome Ospite", "fontFamily": "Inter", "fontSize": 32, "color": "#FFFFFF", "alignment": "center"}}
  ]'::jsonb,
  '{"background": "/templates/bases/iwp-ambassador-circle-base.png", "demoFigure": "/templates/assets/demo-figure-circle.svg", "fonts": ["Playfair Display", "Inter"]}'::jsonb,
  '{"gemini": "Create a podcast template with burgundy red background (#8B2635), white circle in center for photo, curved text at top, podcast player controls at bottom", "openAI": "Remove background from user photo, apply professional wine industry style, optimize for circular mask"}'::jsonb
),
(
  'iwp-masterclass-duo',
  'Masterclass Duo',
  'IWP',
  'event',
  '{"width": 1080, "height": 1080, "format": "square"}'::jsonb,
  '[
    {"id": "bg", "type": "shape", "name": "Background", "zIndex": 0, "editable": false},
    {"id": "photo-left", "type": "image", "name": "Speaker 1", "zIndex": 1, "editable": true, "position": {"x": 150, "y": 200}, "size": {"width": 350, "height": 450}, "config": {"mask": "rounded", "allowUpload": true}},
    {"id": "photo-right", "type": "image", "name": "Speaker 2", "zIndex": 2, "editable": true, "position": {"x": 580, "y": 200}, "size": {"width": 350, "height": 450}, "config": {"mask": "rounded", "allowUpload": true}},
    {"id": "title", "type": "text", "name": "Titolo Masterclass", "zIndex": 3, "editable": true, "position": {"x": 100, "y": 700}, "config": {"defaultText": "MASTERCLASS", "fontFamily": "Playfair Display", "fontSize": 64, "color": "#FFFFFF", "alignment": "center"}},
    {"id": "subtitle", "type": "text", "name": "Sottotitolo", "zIndex": 4, "editable": true, "position": {"x": 100, "y": 800}, "config": {"defaultText": "con Nome Relatori", "fontFamily": "Inter", "fontSize": 28, "color": "#FFFFFF", "alignment": "center"}}
  ]'::jsonb,
  '{"background": "/templates/bases/iwp-masterclass-duo-base.png", "demoFigure": "/templates/assets/demo-figure-duo.svg", "fonts": ["Playfair Display", "Inter"]}'::jsonb,
  '{"gemini": "Create event template with bold red background, space for two speaker photos side by side, professional typography", "openAI": "Process two speaker photos with background removal and professional styling"}'::jsonb
),
(
  'iwa-wset-level1',
  'WSET Level 1',
  'IWA',
  'course',
  '{"width": 1080, "height": 1350, "format": "portrait"}'::jsonb,
  '[
    {"id": "bg", "type": "shape", "name": "Background", "zIndex": 0, "editable": false},
    {"id": "header-banner", "type": "overlay", "name": "Header", "zIndex": 1, "editable": false},
    {"id": "title", "type": "text", "name": "Titolo Corso", "zIndex": 2, "editable": true, "position": {"x": 100, "y": 100}, "config": {"defaultText": "WSET LEVEL 1", "fontFamily": "Cinzel", "fontSize": 56, "color": "#FFFFFF", "alignment": "center"}},
    {"id": "date", "type": "text", "name": "Data", "zIndex": 3, "editable": true, "position": {"x": 150, "y": 350}, "config": {"defaultText": "6 March 2026", "fontFamily": "Inter", "fontSize": 32, "color": "#2D3748", "alignment": "left"}},
    {"id": "location", "type": "text", "name": "Location", "zIndex": 4, "editable": true, "position": {"x": 150, "y": 420}, "config": {"defaultText": "Italian Wine Academy, Verona", "fontFamily": "Inter", "fontSize": 28, "color": "#2D3748", "alignment": "left"}},
    {"id": "educator", "type": "text", "name": "Educator", "zIndex": 5, "editable": true, "position": {"x": 150, "y": 490}, "config": {"defaultText": "Cynthia Chaplin", "fontFamily": "Inter", "fontSize": 28, "color": "#2D3748", "alignment": "left"}},
    {"id": "illustration", "type": "overlay", "name": "Illustrazione", "zIndex": 6, "editable": false}
  ]'::jsonb,
  '{"background": "/templates/bases/iwa-wset-level1-base.png", "demoFigure": "/templates/assets/demo-figure-portrait.svg", "fonts": ["Cinzel", "Inter"]}'::jsonb,
  '{"gemini": "Create course infographic with cream background, orange header banner, calendar and location icons, line art illustrations of wine hands", "openAI": "Minimal processing for course graphics"}'::jsonb
),
(
  'thm-minimal-bordeaux',
  'Minimal Bordeaux',
  'UNIVERSAL',
  'portrait',
  '{"width": 1080, "height": 1350, "format": "portrait"}'::jsonb,
  '[
    {"id": "bg", "type": "shape", "name": "Background", "zIndex": 0, "editable": true, "config": {"defaultColor": "#F5F5F0"}},
    {"id": "figure", "type": "image", "name": "Figura Principale", "zIndex": 1, "editable": true, "position": {"x": 340, "y": 300}, "size": {"width": 400, "height": 600}, "config": {"mask": "none", "allowUpload": true, "aiProcessing": "full"}},
    {"id": "wine-hand-left", "type": "overlay", "name": "Mano Vino Sinistra", "zIndex": 2, "editable": false},
    {"id": "wine-hand-right", "type": "overlay", "name": "Mano Vino Destra", "zIndex": 3, "editable": false},
    {"id": "caption", "type": "text", "name": "Caption", "zIndex": 4, "editable": true, "position": {"x": 100, "y": 1200}, "config": {"defaultText": "Cin Cin!", "fontFamily": "Playfair Display", "fontSize": 48, "color": "#1A1A1A", "alignment": "center"}}
  ]'::jsonb,
  '{"background": "/templates/bases/thm-minimal-bordeaux-base.png", "demoFigure": "/templates/assets/demo-figure-portrait.svg", "fonts": ["Playfair Display"]}'::jsonb,
  '{"gemini": "Create minimalist template with warm cream background, line art wine hands from corners, central silhouette placeholder for portrait photo", "openAI": "Professional background removal and warm tone styling for portrait"}'::jsonb
),
(
  'thm-line-art-toast',
  'Line Art Toast',
  'UNIVERSAL',
  'quote',
  '{"width": 1080, "height": 1350, "format": "portrait"}'::jsonb,
  '[
    {"id": "bg", "type": "shape", "name": "Background", "zIndex": 0, "editable": true, "config": {"defaultColor": "#FAFAFA"}},
    {"id": "line-art", "type": "overlay", "name": "Line Art", "zIndex": 1, "editable": false},
    {"id": "quote", "type": "text", "name": "Citazione", "zIndex": 2, "editable": true, "position": {"x": 100, "y": 500}, "size": {"width": 880, "height": 400}, "config": {"defaultText": ""Wine is the poetry of the earth."", "fontFamily": "Playfair Display", "fontSize": 42, "color": "#1A1A1A", "alignment": "center"}},
    {"id": "author", "type": "text", "name": "Autore", "zIndex": 3, "editable": true, "position": {"x": 100, "y": 950}, "config": {"defaultText": "- Mario Soldati", "fontFamily": "Inter", "fontSize": 24, "color": "#666666", "alignment": "center"}}
  ]'::jsonb,
  '{"background": "/templates/bases/thm-line-art-toast-base.png", "demoFigure": null, "fonts": ["Playfair Display", "Inter"]}'::jsonb,
  '{"gemini": "Elegant quote template with minimal line art hands toasting with wine glasses, generous whitespace", "openAI": "Not applicable for text-only template"}'::jsonb
)
ON CONFLICT (template_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  dimensions = EXCLUDED.dimensions,
  layers = EXCLUDED.layers,
  base_assets = EXCLUDED.base_assets,
  ai_prompts = EXCLUDED.ai_prompts;

-- ============================================
-- STORAGE BUCKETS (creare manualmente su Supabase UI)
-- ============================================
-- template-assets (public)
-- social-images (public)  
-- user-uploads (private)
-- ============================================

SELECT 'Setup completato!' as status;
