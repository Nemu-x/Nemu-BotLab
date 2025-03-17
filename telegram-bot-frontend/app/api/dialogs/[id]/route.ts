import { NextResponse } from 'next/server';
import { fetchApiServer } from '@/src/config/apiServer';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const dialog = await fetchApiServer(`/api/dialogs/${id}`);
    return NextResponse.json(dialog);
  } catch (error) {
    console.error(`Error fetching dialog ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch dialog' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const dialog = await fetchApiServer(`/api/dialogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return NextResponse.json(dialog);
  } catch (error) {
    console.error(`Error updating dialog ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update dialog' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const result = await fetchApiServer(`/api/dialogs/${id}`, {
      method: 'DELETE',
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error deleting dialog ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete dialog' }, { status: 500 });
  }
} 