import { NextResponse } from 'next/server';
import { fetchApiServer } from '@/src/config/apiServer';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const dialog = await fetchApiServer(`/api/dialogs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json(dialog);
  } catch (error) {
    console.error(`Error updating dialog status ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update dialog status' }, { status: 500 });
  }
} 