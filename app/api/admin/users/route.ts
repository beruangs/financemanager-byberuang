import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Wallet from '@/models/Wallet';

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const now = Math.floor(Date.now() / 1000);
    
    if (decoded.exp && decoded.exp < now) {
      return false; // Token expired
    }
    
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all users with their stats
    const users = await User.find().select('-password');
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const transactions = await Transaction.countDocuments({ userId: user._id });
        const wallets = await Wallet.find({ userId: user._id });
        const totalSaldo = wallets.reduce((sum: number, w: any) => sum + w.balance, 0);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalTransactions: transactions,
          totalWallets: wallets.length,
          totalSaldo: totalSaldo,
          createdAt: user.createdAt,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
