import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import SavingsGoal from '@/models/SavingsGoal';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const goals = await SavingsGoal.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json({ goals });
  } catch (error: any) {
    console.error('Get savings goals error:', error);
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

    const { name, targetAmount, currentAmount, deadline, icon, color } = await request.json();

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: 'Name and target amount are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const goal = await SavingsGoal.create({
      userId: session.user.id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline || undefined,
      icon: icon || 'target',
      color: color || '#10b981',
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    console.error('Create savings goal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
