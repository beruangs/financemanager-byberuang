import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Wallet from '@/models/Wallet';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const transaction = await Transaction.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update wallet balance (reverse the transaction)
    const wallet = await Wallet.findById(transaction.walletId);
    if (wallet) {
      if (transaction.type === 'income') {
        wallet.balance -= transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'bill') {
        wallet.balance += transaction.amount;
      }
      await wallet.save();
    }

    await Transaction.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    await dbConnect();

    const oldTransaction = await Transaction.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!oldTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // If amount or type changed, update wallet balance
    if (updates.amount !== undefined || updates.type !== undefined) {
      const wallet = await Wallet.findById(oldTransaction.walletId);
      if (wallet) {
        // Reverse old transaction
        if (oldTransaction.type === 'income') {
          wallet.balance -= oldTransaction.amount;
        } else {
          wallet.balance += oldTransaction.amount;
        }

        // Apply new transaction
        const newType = updates.type || oldTransaction.type;
        const newAmount = updates.amount || oldTransaction.amount;
        if (newType === 'income') {
          wallet.balance += newAmount;
        } else {
          wallet.balance -= newAmount;
        }

        await wallet.save();
      }
    }

    const transaction = await Transaction.findByIdAndUpdate(
      params.id,
      updates,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ transaction });
  } catch (error: any) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
