'use client';

import { useState, useEffect, useRef } from 'react';
import { Rocket, Sparkles, Upload, ImageIcon, X, Wand2 } from 'lucide-react';
import { getTemplates } from '@/lib/abacus';
import { Project, Templates } from '@/types';
import { compressImage, fileToBase64 } from '@/lib/api-client';
import { toast } from 'sonner';

interface InputSectionProps {
  onGenerate: (topic: string, project: Project, imageUrl?: string) => void;
  isLoading: boolean;
  project: Project;
  onProjectChange: (project: Project) => void;
  initialTemplate?: string;
  onImageUpload?: (imageUrl: string) => void;
}

export function InputSection({
  onGenerate,
  isLoading,
  project,
  onProjectChange,
  initialTemplate,
  onImageUpload,
}: InputSectionProps) {
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const templates: Templates = getTemplates(project);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTemplate) {
      const template = templates[initialTemplate];
      if (template) {
        setTopic(template.prompt);
        setSelectedTemplate(initialTemplate);
      }
    }
  }, [initialTemplate, templates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onGenerate(topic.trim(), project, uploadedImage || undefined);
    }
  };

  const handleTemplateClick = (key: string) => {
    const template = templates[key];
    if (template) {
      setTopic(template.prompt);
      setSelectedTemplate(key);
    }
  };

  const handleProjectChange = (newProject: Project) => {
    onProjectChange(newProject);
    setTopic('');
    setSelectedTemplate(null);
    setUploadedImage(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato non valido. Usa JPG, PNG o WebP.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File troppo grande. Max 10MB.');
      return;
    }

    try {
      setIsUploading(true);
      const compressedBlob = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      const base64 = await fileToBase64(compressedFile);
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      setUploadedImage(dataUrl);
      onImageUpload?.(dataUrl);
      toast.success('Immagine caricata!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Errore nel caricamento immagine');
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const iwpActive = project === 'IWP';

  return (
    <div className="dashboard-card p-6 h-full flex flex-col animate-fade-in-up">
      {/* Project Selector */}
      <div className="flex items-center justify-center gap-2 mb-6 p-1.5 bg-[#1A1A1A] rounded-xl border border-[#262626]">
        <button
          onClick={() => handleProjectChange('IWP')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            iwpActive
              ? 'bg-gradient-to-r from-[#C8102E] to-[#E53935] text-white shadow-lg shadow-[#C8102E]/30'
              : 'text-[#737373] hover:text-[#A3A3A3]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${iwpActive ? 'bg-white/80' : 'bg-[#C8102E]'}`} />
          IWP
        </button>
        <button
          onClick={() => handleProjectChange('IWA')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            !iwpActive
              ? 'bg-gradient-to-r from-[#5C2D91] to-[#7B4FB0] text-white shadow-lg shadow-[#5C2D91]/30'
              : 'text-[#737373] hover:text-[#A3A3A3]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${!iwpActive ? 'bg-white/80' : 'bg-[#5C2D91]'}`} />
          IWA
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
          iwpActive
            ? 'bg-gradient-to-br from-[#C8102E] to-[#E53935] shadow-[#C8102E]/20'
            : 'bg-gradient-to-br from-[#5C2D91] to-[#7B4FB0] shadow-[#5C2D91]/20'
        }`}>
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA]">
            {iwpActive ? 'Italian Wine Podcast' : 'Italian Wine Academy'}
          </h2>
          <p className="text-xs text-[#737373]">
            {iwpActive ? 'italianwinepodcast.com' : 'italianwineacademy.org'}
          </p>
        </div>
      </div>

      {/* Template Selector */}
      <div className="mb-5 flex-shrink-0">
        <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-3">
          Template {project}
        </p>
        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto scroll-container">
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleTemplateClick(key)}
              disabled={isLoading || isUploading}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all border ${
                selectedTemplate === key
                  ? iwpActive
                    ? 'bg-[#C8102E]/20 text-[#E53935] border-[#C8102E]/50'
                    : 'bg-[#5C2D91]/20 text-[#7B4FB0] border-[#5C2D91]/50'
                  : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#262626] hover:border-[#333333] hover:text-[#FAFAFA]'
              }`}
              title={template.prompt}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-3">
          Immagine (opzionale)
        </p>

        {uploadedImage ? (
          <div className="relative rounded-xl overflow-hidden border border-[#262626]">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-36 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-xs text-white flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />
                Immagine caricata
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full flex items-center justify-center gap-3 px-4 py-8 border-2 border-dashed rounded-xl transition-all disabled:opacity-50 ${
                iwpActive
                  ? 'border-[#262626] hover:border-[#C8102E]/50 text-[#525252] hover:text-[#C8102E] bg-[#1A1A1A]/50'
                  : 'border-[#262626] hover:border-[#5C2D91]/50 text-[#525252] hover:text-[#5C2D91] bg-[#1A1A1A]/50'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#5C2D91] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[#A3A3A3]">Caricamento...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Carica immagine</span>
                </>
              )}
            </button>
            <p className="text-xs text-[#525252] text-center mt-2">
              JPG, PNG, WebP • Max 10MB
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 mb-4 min-h-0 flex flex-col">
          <label className="block text-xs font-semibold text-[#525252] uppercase tracking-wider mb-2 flex-shrink-0">
            Argomento
          </label>
          <textarea
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setSelectedTemplate(null);
            }}
            placeholder={iwpActive
              ? "Descrivi l'argomento in stile Stevie Kim..."
              : "Descrivi l'argomento in stile educativo..."
            }
            className="dashboard-input w-full flex-1 min-h-[100px] resize-none"
            disabled={isLoading || isUploading}
          />
        </div>

        <button
          type="submit"
          disabled={!topic.trim() || isLoading || isUploading}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            iwpActive
              ? 'bg-gradient-to-r from-[#C8102E] to-[#E53935] hover:shadow-lg hover:shadow-[#C8102E]/30'
              : 'bg-gradient-to-r from-[#5C2D91] to-[#7B4FB0] hover:shadow-lg hover:shadow-[#5C2D91]/30'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generazione...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              {uploadedImage ? 'Genera con Immagine' : `Genera per ${project}`}
            </>
          )}
        </button>
      </form>

      {/* Brand Voice Hint */}
      <div className={`mt-4 p-4 rounded-xl border flex-shrink-0 ${
        iwpActive
          ? 'bg-[#C8102E]/10 border-[#C8102E]/20'
          : 'bg-[#5C2D91]/10 border-[#5C2D91]/20'
      }`}>
        <p className={`text-xs leading-relaxed ${iwpActive ? 'text-[#E53935]' : 'text-[#7B4FB0]'}`}>
          <strong>Stile {project}:</strong>{' '}
          {iwpActive
            ? 'Conversazionale, "Ok story time...", autoironia, chiusura con Cin Cin!'
            : 'Educativo professionale, fatti concreti, accessibile ma autorevole'
          }
        </p>
      </div>
    </div>
  );
}
