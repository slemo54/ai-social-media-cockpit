'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Circle, Rect, Group } from 'react-konva';
import Konva from 'konva';
import { ImagePlus, User } from 'lucide-react';
import type { Template, TextLayerConfig } from '@/types/template';

// ---------- Types ----------

export interface PhotoTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

interface TemplateCanvasProps {
  template: Template;
  photoSrc: string | null;
  photoTransform: PhotoTransform;
  textOverrides: Record<string, string>;
  containerWidth: number;
  onPhotoTransformChange: (t: PhotoTransform) => void;
  onTextChange: (layerId: string, text: string) => void;
  onClickPlaceholder: () => void;
  interactive?: boolean;
}

// ---------- Helpers ----------

function useLoadImage(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
}

// ---------- Component ----------

export default function TemplateCanvas({
  template,
  photoSrc,
  photoTransform,
  textOverrides,
  containerWidth,
  onPhotoTransformChange,
  onTextChange,
  onClickPlaceholder,
  interactive = true,
}: TemplateCanvasProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const photoRef = useRef<Konva.Image | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Calculate scale to fit container
  const scale = useMemo(() => {
    if (!containerWidth) return 1;
    return containerWidth / template.dimensions.width;
  }, [containerWidth, template.dimensions.width]);

  const stageWidth = template.dimensions.width * scale;
  const stageHeight = template.dimensions.height * scale;

  const bgSrc = template.base_assets?.background || template.base_image_url || null;
  const bgImage = useLoadImage(bgSrc);
  const photoImage = useLoadImage(photoSrc);

  // Get photoZone scaled to display coordinates
  const photoZone = template.photoZone;

  // Clipping function for the photo zone
  const clipFunc = useCallback((ctx: Konva.Context) => {
    if (!photoZone) return;

    if (photoZone.type === 'circle' && photoZone.centerX != null && photoZone.centerY != null && photoZone.radius != null) {
      ctx.arc(
        photoZone.centerX * scale,
        photoZone.centerY * scale,
        photoZone.radius * scale,
        0,
        Math.PI * 2,
        false
      );
    } else if (
      (photoZone.type === 'rectangle' || photoZone.type === 'rect') &&
      photoZone.x != null && photoZone.y != null &&
      photoZone.width != null && photoZone.height != null
    ) {
      ctx.rect(
        photoZone.x * scale,
        photoZone.y * scale,
        photoZone.width * scale,
        photoZone.height * scale
      );
    }
  }, [photoZone, scale]);

  // Handle scroll-to-zoom on the photo
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    if (!interactive || !photoImage) return;
    e.evt.preventDefault();

    const scaleChange = e.evt.deltaY > 0 ? 0.95 : 1.05;
    const newScaleX = photoTransform.scaleX * scaleChange;
    const newScaleY = photoTransform.scaleY * scaleChange;

    // Clamp scale between 0.2 and 5
    const clampedScaleX = Math.max(0.2, Math.min(5, newScaleX));
    const clampedScaleY = Math.max(0.2, Math.min(5, newScaleY));

    onPhotoTransformChange({
      ...photoTransform,
      scaleX: clampedScaleX,
      scaleY: clampedScaleY,
    });
  }, [interactive, photoImage, photoTransform, onPhotoTransformChange]);

  // Handle photo drag
  const handlePhotoDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    onPhotoTransformChange({
      ...photoTransform,
      x: e.target.x() / scale,
      y: e.target.y() / scale,
    });
  }, [photoTransform, onPhotoTransformChange, scale]);

  // Handle text double-click for inline editing
  const handleTextDblClick = useCallback((layerId: string, node: Konva.Text) => {
    if (!interactive) return;
    setEditingTextId(layerId);

    const stage = stageRef.current;
    if (!stage) return;

    const stageContainer = stage.container();
    const textPosition = node.absolutePosition();
    const stageRect = stageContainer.getBoundingClientRect();

    // Create textarea overlay
    const textarea = document.createElement('textarea');
    stageContainer.appendChild(textarea);

    textarea.value = node.text();
    textarea.style.cssText = `
      position: absolute;
      top: ${textPosition.y + stageRect.top - stageRect.top}px;
      left: ${textPosition.x}px;
      width: ${node.width() * node.scaleX()}px;
      min-height: ${node.height() * node.scaleY()}px;
      font-size: ${node.fontSize() * scale}px;
      font-family: ${node.fontFamily()};
      color: ${node.fill() as string};
      border: 2px solid #003366;
      background: rgba(15,15,15,0.9);
      padding: 4px 8px;
      outline: none;
      resize: none;
      overflow: hidden;
      z-index: 100;
      border-radius: 6px;
      text-align: ${node.align()};
    `;

    textarea.focus();

    const removeTextarea = () => {
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      setEditingTextId(null);
    };

    textarea.addEventListener('blur', () => {
      onTextChange(layerId, textarea.value);
      removeTextarea();
    });

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onTextChange(layerId, textarea.value);
        removeTextarea();
      }
      if (e.key === 'Escape') {
        removeTextarea();
      }
    });
  }, [interactive, onTextChange, scale]);

  // Get editable text layers
  const textLayers = useMemo(() => {
    return (template.layers || []).filter(l => l.type === 'text' && l.editable);
  }, [template.layers]);

  // Calculate photo dimensions for proper "cover" fit within zone
  const getPhotoAttrs = useCallback(() => {
    if (!photoImage || !photoZone) return null;

    let zoneW: number, zoneH: number, zoneX: number, zoneY: number;

    if (photoZone.type === 'circle' && photoZone.centerX != null && photoZone.centerY != null && photoZone.radius != null) {
      zoneW = photoZone.radius * 2;
      zoneH = photoZone.radius * 2;
      zoneX = photoZone.centerX - photoZone.radius;
      zoneY = photoZone.centerY - photoZone.radius;
    } else if (photoZone.x != null && photoZone.y != null && photoZone.width != null && photoZone.height != null) {
      zoneW = photoZone.width;
      zoneH = photoZone.height;
      zoneX = photoZone.x;
      zoneY = photoZone.y;
    } else {
      const size = Math.min(template.dimensions.width, template.dimensions.height) * 0.6;
      zoneW = size;
      zoneH = size;
      zoneX = (template.dimensions.width - size) / 2;
      zoneY = (template.dimensions.height - size) / 2;
    }

    const imgAspect = photoImage.width / photoImage.height;
    const zoneAspect = zoneW / zoneH;

    let drawW: number, drawH: number;
    if (imgAspect > zoneAspect) {
      drawH = zoneH;
      drawW = zoneH * imgAspect;
    } else {
      drawW = zoneW;
      drawH = zoneW / imgAspect;
    }

    // Initial centered position (only used when photoTransform x/y are default)
    const defaultX = zoneX + (zoneW - drawW) / 2;
    const defaultY = zoneY + (zoneH - drawH) / 2;

    return {
      width: drawW,
      height: drawH,
      defaultX,
      defaultY,
    };
  }, [photoImage, photoZone, template.dimensions]);

  const photoAttrs = getPhotoAttrs();

  // Render placeholder area when no photo
  const renderPlaceholder = () => {
    if (photoImage || !photoZone) return null;

    if (photoZone.type === 'circle' && photoZone.centerX != null && photoZone.centerY != null && photoZone.radius != null) {
      return (
        <Group
          onClick={onClickPlaceholder}
          onTap={onClickPlaceholder}
          opacity={0.7}
        >
          <Circle
            x={photoZone.centerX * scale}
            y={photoZone.centerY * scale}
            radius={photoZone.radius * scale}
            fill="#1A1A1A"
            stroke="#333333"
            strokeWidth={2}
            dash={[8, 4]}
          />
          {/* Silhouette icon substitute */}
          <Text
            x={(photoZone.centerX - 30) * scale}
            y={(photoZone.centerY - 10) * scale}
            text="📷 Clicca"
            fontSize={14 * scale}
            fill="#737373"
            align="center"
            width={60 * scale}
          />
        </Group>
      );
    }

    if (photoZone.x != null && photoZone.y != null && photoZone.width != null && photoZone.height != null) {
      return (
        <Group
          onClick={onClickPlaceholder}
          onTap={onClickPlaceholder}
          opacity={0.7}
        >
          <Rect
            x={photoZone.x * scale}
            y={photoZone.y * scale}
            width={photoZone.width * scale}
            height={photoZone.height * scale}
            fill="#1A1A1A"
            stroke="#333333"
            strokeWidth={2}
            dash={[8, 4]}
          />
          <Text
            x={(photoZone.x + photoZone.width / 2 - 30) * scale}
            y={(photoZone.y + photoZone.height / 2 - 10) * scale}
            text="📷 Clicca"
            fontSize={14 * scale}
            fill="#737373"
            align="center"
            width={60 * scale}
          />
        </Group>
      );
    }

    return null;
  };

  return (
    <div
      className="relative bg-[#0F0F0F] rounded-xl overflow-hidden border border-[#262626] shadow-2xl shadow-black/40"
      style={{ width: stageWidth, height: stageHeight }}
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        onWheel={handleWheel}
        style={{ cursor: photoImage && interactive ? 'grab' : 'default' }}
      >
        {/* Background layer */}
        <Layer>
          {bgImage && (
            <KonvaImage
              image={bgImage}
              width={stageWidth}
              height={stageHeight}
              listening={false}
            />
          )}
        </Layer>

        {/* Photo layer with clipping */}
        <Layer clipFunc={photoZone ? clipFunc : undefined}>
          {photoImage && photoAttrs && (
            <KonvaImage
              ref={photoRef}
              image={photoImage}
              x={(photoTransform.x !== 0 ? photoTransform.x : photoAttrs.defaultX) * scale}
              y={(photoTransform.y !== 0 ? photoTransform.y : photoAttrs.defaultY) * scale}
              width={photoAttrs.width * scale}
              height={photoAttrs.height * scale}
              scaleX={photoTransform.scaleX}
              scaleY={photoTransform.scaleY}
              rotation={photoTransform.rotation}
              draggable={interactive}
              onDragEnd={handlePhotoDragEnd}
              onDragStart={() => {
                const stage = stageRef.current;
                if (stage) stage.container().style.cursor = 'grabbing';
              }}
              onDragMove={() => {}}
              onMouseEnter={() => {
                const stage = stageRef.current;
                if (stage && interactive) stage.container().style.cursor = 'grab';
              }}
              onMouseLeave={() => {
                const stage = stageRef.current;
                if (stage) stage.container().style.cursor = 'default';
              }}
            />
          )}
        </Layer>

        {/* Placeholder (no photo) */}
        <Layer>
          {renderPlaceholder()}
        </Layer>

        {/* Text layers */}
        <Layer>
          {textLayers.map((layer) => {
            const cfg = layer.config as TextLayerConfig | undefined;
            if (!cfg) return null;

            const pos = cfg.position || layer.position;
            if (!pos) return null;

            const text = textOverrides[layer.id] || cfg.defaultText || '';
            if (!text) return null;

            return (
              <Text
                key={layer.id}
                x={pos.x * scale}
                y={pos.y * scale}
                text={text}
                fontSize={(cfg.fontSize || 24) * scale}
                fontFamily={cfg.fontFamily || 'Inter, sans-serif'}
                fill={cfg.color || '#FFFFFF'}
                align={(cfg.alignment as string) || 'center'}
                draggable={interactive}
                shadowColor="rgba(0,0,0,0.6)"
                shadowBlur={4}
                shadowOffsetX={1}
                shadowOffsetY={1}
                listening={interactive}
                onDblClick={(e) => {
                  handleTextDblClick(layer.id, e.target as Konva.Text);
                }}
                onDblTap={(e) => {
                  handleTextDblClick(layer.id, e.target as Konva.Text);
                }}
                onMouseEnter={() => {
                  const stage = stageRef.current;
                  if (stage && interactive) stage.container().style.cursor = 'text';
                }}
                onMouseLeave={() => {
                  const stage = stageRef.current;
                  if (stage) stage.container().style.cursor = 'default';
                }}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* No-photo fallback (HTML overlay for non-Konva placeholder if no photoZone) */}
      {!photoImage && !photoZone && (
        <button
          onClick={onClickPlaceholder}
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#374151] hover:border-[#003366] flex items-center justify-center mx-auto mb-3 transition-colors bg-black/30">
              <User className="w-8 h-8 text-[#525252]" />
            </div>
            <p className="text-sm text-[#737373]">Clicca per caricare la foto</p>
          </div>
        </button>
      )}
    </div>
  );
}

// ---------- Export helper for high-res ----------

export function exportStageToDataURL(
  stageRef: React.RefObject<Konva.Stage | null>,
  templateWidth: number,
  displayWidth: number
): string | null {
  const stage = stageRef.current;
  if (!stage) return null;

  const pixelRatio = templateWidth / displayWidth;
  return stage.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
    quality: 1,
  });
}
