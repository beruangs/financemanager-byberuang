import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Wallet from '@/models/Wallet';
import Budget from '@/models/Budget';

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { role } = await request.json();
    if (!['user', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      params.id,
      { role },
      { new: true }
    ).select('-password');

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Delete user and all related data
    await Promise.all([
      User.findByIdAndDelete(params.id),
      Transaction.deleteMany({ userId: params.id }),
      Wallet.deleteMany({ userId: params.id }),
      Budget.deleteMany({ userId: params.id }),
    ]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
