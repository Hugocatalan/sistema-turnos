import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!extension || !extensionesPermitidas.includes(extension)) {
      return NextResponse.json(
        { error: `Extensiones permitidas: ${extensionesPermitidas.join(', ')}` },
        { status: 400 }
      );
    }

    const tamanoMaximo = 2 * 1024 * 1024;
    if (file.size > tamanoMaximo) {
      return NextResponse.json(
        { error: 'La imagen no puede superar los 2MB' },
        { status: 400 }
      );
    }

    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    
    const mimeType = mimeTypes[extension] || file.type || 'image/jpeg';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const userId = session.user.id;
    
    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: { imagenUrl: dataUrl },
      select: { id: true, imagenUrl: true }
    });

    return NextResponse.json({ 
      url: updatedUser.imagenUrl,
      success: true 
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error uploading image:', err.message, err.stack);
    return NextResponse.json(
      { error: `Error al subir imagen: ${err.message}` },
      { status: 500 }
    );
  }
}
