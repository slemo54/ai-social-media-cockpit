import { NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validazione tipo file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validazione dimensione (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log(`[ImageUpload] Processing upload: ${file.name} (${file.size} bytes)`);

    // Converti file in base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Upload a Supabase Storage
    const publicUrl = await uploadImageToStorage(
      `data:${file.type};base64,${base64}`,
      file.name
    );

    if (!publicUrl) {
      throw new Error('Failed to upload image to storage');
    }

    console.log(`[ImageUpload] Success: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
    });

  } catch (error) {
    console.error('[ImageUpload] Error:', error);
    return NextResponse.json(
      { 
        error: 'Image upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
