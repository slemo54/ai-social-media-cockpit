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

  // Se c'è un template iniziale nell'URL, usalo
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

    // Validazione
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
      
      // Comprimi l'immagine
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

  return (
    <div className="glass-card p-6 h-full flex flex-col animate-fade-in-up">
      {/* Project Selector */}
      <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => handleProjectChange('IWP')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            project === 'IWP'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
          IWP
        </button>
        <button
          onClick={() => handleProjectChange('IWA')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            project === 'IWA'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
          IWA
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          project === 'IWP' 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
        }`}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {project === 'IWP' ? 'Italian Wine Podcast' : 'Italian Wine Academy'}
          </h2>
          <p className="text-xs text-white/50">
            {project === 'IWP' ? 'italianwinepodcast.com' : 'italianwineacademy.org'}
          </p>
        </div>
      </div>

      {/* Template Selector */}
      <div className="mb-4 flex-shrink-0">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
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
                  ? project === 'IWP'
                    ? 'bg-purple-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
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
        <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">
          Immagine (opzionale)
        </p>
        
        {uploadedImage ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-32 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-xs text-white/80 flex items-center gap-1">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-white/20 hover:border-purple-500/50 text-white/60 hover:text-purple-400 rounded-xl transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Carica immagine
                </>
              )}
            </button>
            <p className="text-xs text-white/40 text-center mt-2">
              JPG, PNG, WebP • Max 10MB
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 mb-4 min-h-0 flex flex-col">
          <label className="block text-sm font-medium text-white/70 mb-2 flex-shrink-0">
            Argomento
          </label>
          <textarea
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setSelectedTemplate(null);
            }}
            placeholder={project === 'IWP' 
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
            project === 'IWP'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
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
        project === 'IWP'
          ? 'bg-purple-500/10 border-purple-500/20'
          : 'bg-blue-500/10 border-blue-500/20'
      }`}>
        <p className={`text-xs ${project === 'IWP' ? 'text-purple-300' : 'text-blue-300'}`}>
          <strong>Stile {project}:</strong>{' '}
          {project === 'IWP' 
            ? 'Conversazionale, "Ok story time...", autoironia, chiusura con Cin Cin!'
            : 'Educativo professionale, fatti concreti, accessibile ma autorevole'
          }
        </p>
      </div>
    </div>
  );
}
