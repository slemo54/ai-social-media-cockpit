'use client';

import { useState, useEffect, useRef } from 'react';
import { Rocket, Sparkles, Upload, ImageIcon, X } from 'lucide-react';
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
    <div className="glass-card p-6 h-full flex flex-col animate-fade-in-up">
      {/* Project Selector */}
      <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-[#F5EFE7] rounded-xl">
        <button
          onClick={() => handleProjectChange('IWP')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            iwpActive
              ? 'bg-[#CD212A] text-white shadow-md'
              : 'text-[#9B8E82] hover:text-[#6B5E52]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${iwpActive ? 'bg-white/60' : 'bg-[#CD212A]'}`} />
          IWP
        </button>
        <button
          onClick={() => handleProjectChange('IWA')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            !iwpActive
              ? 'bg-[#5C2D91] text-white shadow-md'
              : 'text-[#9B8E82] hover:text-[#6B5E52]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${!iwpActive ? 'bg-white/60' : 'bg-[#5C2D91]'}`} />
          IWA
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          iwpActive
            ? 'bg-gradient-to-br from-[#CD212A] to-[#4A0E4E]'
            : 'bg-gradient-to-br from-[#5C2D91] to-[#D4AF37]'
        }`}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#2D2D2D]">
            {iwpActive ? 'Italian Wine Podcast' : 'Italian Wine Academy'}
          </h2>
          <p className="text-xs text-[#9B8E82]">
            {iwpActive ? 'italianwinepodcast.com' : 'italianwineacademy.org'}
          </p>
        </div>
      </div>

      {/* Template Selector */}
      <div className="mb-4 flex-shrink-0">
        <p className="text-xs font-medium text-[#9B8E82] uppercase tracking-wide mb-2">
          Template {project}
        </p>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleTemplateClick(key)}
              disabled={isLoading || isUploading}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                selectedTemplate === key
                  ? iwpActive
                    ? 'bg-[#CD212A] text-white'
                    : 'bg-[#5C2D91] text-white'
                  : 'bg-[#F5EFE7] text-[#6B5E52] hover:bg-[#E8E0D8]'
              }`}
              title={template.prompt}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-4">
        <p className="text-xs font-medium text-[#9B8E82] uppercase tracking-wide mb-2">
          Immagine (opzionale)
        </p>

        {uploadedImage ? (
          <div className="relative rounded-xl overflow-hidden border border-[#E8E0D8]">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-32 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
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
              className={`w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl transition-all disabled:opacity-50 ${
                iwpActive
                  ? 'border-[#E8E0D8] hover:border-[#7B2D4E]/40 text-[#9B8E82] hover:text-[#7B2D4E]'
                  : 'border-[#E8E0D8] hover:border-[#5C2D91]/40 text-[#9B8E82] hover:text-[#5C2D91]'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#C8956C] border-t-transparent rounded-full animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Carica immagine
                </>
              )}
            </button>
            <p className="text-xs text-[#C4B8AD] text-center mt-2">
              JPG, PNG, WebP • Max 10MB
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 mb-4 min-h-0 flex flex-col">
          <label className="block text-sm font-medium text-[#6B5E52] mb-2 flex-shrink-0">
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
            className="glass-input w-full flex-1 min-h-[80px] px-4 py-3 resize-none"
            disabled={isLoading || isUploading}
          />
        </div>

        <button
          type="submit"
          disabled={!topic.trim() || isLoading || isUploading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            iwpActive
              ? 'bg-gradient-to-r from-[#CD212A] to-[#4A0E4E] hover:from-[#BD111A] hover:to-[#3A0E3E]'
              : 'bg-gradient-to-r from-[#5C2D91] to-[#722F37] hover:from-[#4C1D81] hover:to-[#621F27]'
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
      <div className={`mt-4 p-3 rounded-lg border flex-shrink-0 ${
        iwpActive
          ? 'bg-[#F5E6ED] border-[#CD212A]/20'
          : 'bg-[#EDE6F5] border-[#5C2D91]/20'
      }`}>
        <p className={`text-xs ${iwpActive ? 'text-[#CD212A]' : 'text-[#5C2D91]'}`}>
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
