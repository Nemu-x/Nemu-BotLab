import { NextResponse } from 'next/server';
import { fetchApiServer } from '@/src/config/apiServer';

export async function GET() {
  try {
    const dialogs = await fetchApiServer('/api/dialogs');
    return NextResponse.json(dialogs);
  } catch (error) {
    console.error('Error fetching dialogs:', error);
    return NextResponse.json({ error: 'Failed to fetch dialogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dialog = await fetchApiServer('/api/dialogs', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(dialog);
  } catch (error) {
    console.error('Error creating dialog:', error);
    return NextResponse.json({ error: 'Failed to create dialog' }, { status: 500 });
  }
} 