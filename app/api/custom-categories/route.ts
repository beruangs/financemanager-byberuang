import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import CustomCategory from '@/models/CustomCategory';

// GET - Fetch all custom categories for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // expense, income, or bill

    await dbConnect();

    const query: any = { userId: session.user.id };
    if (type) {
      query.type = type;
    }

    const categories = await CustomCategory.find(query).sort({ name: 1 });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Get custom categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new custom category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, icon, color } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    if (!['expense', 'income', 'bill'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be expense, income, or bill' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if category with same name and type already exists for this user
    const existing = await CustomCategory.findOne({
      userId: session.user.id,
      name: name.trim(),
      type,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Kategori dengan nama ini sudah ada' },
        { status: 400 }
      );
    }

    const category = await CustomCategory.create({
      userId: session.user.id,
      name: name.trim(),
      type,
      icon: icon || '📁',
      color: color || '#6366f1',
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Create custom category error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
