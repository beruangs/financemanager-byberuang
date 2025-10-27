import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Wallet from '@/models/Wallet';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const wallets = await Wallet.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json(wallets); // Return array directly
  } catch (error: any) {
    console.error('Get wallets error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, balance, icon, color } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const wallet = await Wallet.create({
      userId: session.user.id,
      name,
      type,
      balance: balance || 0,
      icon: icon || 'wallet',
      color: color || '#3b82f6',
    });

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error: any) {
    console.error('Create wallet error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
