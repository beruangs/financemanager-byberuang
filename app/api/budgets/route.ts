import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Budget from '@/models/Budget';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM

    await dbConnect();

    if (month) {
      const budget = await Budget.findOne({
        userId: session.user.id,
        month,
      });
      return NextResponse.json({ budget });
    }

    const budgets = await Budget.find({ userId: session.user.id }).sort({
      month: -1,
    });

    return NextResponse.json({ budgets });
  } catch (error: any) {
    console.error('Get budgets error:', error);
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

    const { month, totalBudget, allocations } = await request.json();
    console.log('Budget POST - month:', month, 'totalBudget:', totalBudget, 'allocations:', allocations);

    if (!month || !totalBudget || !allocations) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Month, total budget, and allocations are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if budget for this month already exists
    const existingBudget = await Budget.findOne({
      userId: session.user.id,
      month,
    });

    if (existingBudget) {
      // Update existing budget
      existingBudget.totalBudget = totalBudget;
      existingBudget.allocations = allocations;
      await existingBudget.save();
      return NextResponse.json({ budget: existingBudget });
    }

    // Create new budget
    const budget = await Budget.create({
      userId: session.user.id,
      month,
      totalBudget,
      allocations,
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error: any) {
    console.error('Create budget error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
