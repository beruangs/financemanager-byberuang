import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Wallet from '@/models/Wallet';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await dbConnect();

    const query: any = { userId: session.user.id };
    if (walletId) query.walletId = walletId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('walletId', 'name type')
      .sort({ date: -1 });

    return NextResponse.json(transactions); // Return array directly
  } catch (error: any) {
    console.error('Get transactions error:', error);
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

    const {
      walletId,
      type,
      category,
      amount,
      description,
      date,
      isRecurring,
      recurringPattern,
    } = await request.json();

    if (!walletId || !type || !category || !amount) {
      return NextResponse.json(
        { error: 'Wallet, type, category, and amount are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify wallet belongs to user
    const wallet = await Wallet.findOne({
      _id: walletId,
      userId: session.user.id,
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: session.user.id,
      walletId,
      type,
      category,
      amount,
      description,
      date: date || new Date(),
      isRecurring: isRecurring || false,
      recurringPattern,
    });

    // Update wallet balance
    if (type === 'income') {
      wallet.balance += amount;
    } else if (type === 'expense' || type === 'bill') {
      wallet.balance -= amount;
    }
    await wallet.save();

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
