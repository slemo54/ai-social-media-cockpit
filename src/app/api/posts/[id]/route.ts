import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { supabase, userId } = await getAuthenticatedUser();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
        }

        const { data: post, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('[API] Error fetching post:', error);
            return NextResponse.json({ success: false, error: 'Post not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: post });
    } catch (error) {
        console.error('[API] Unexpected error fetching post:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { supabase, userId } = await getAuthenticatedUser();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
        }

        const { data: post, error } = await supabase
            .from('posts')
            .update(body)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating post:', error);
            return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: post });
    } catch (error) {
        console.error('[API] Unexpected error updating post:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
