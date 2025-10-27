import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import LoginHistory from '@/models/LoginHistory';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const loginHistories = await LoginHistory.find({ userId: session.user.id })
      .sort({ loginTime: -1 })
      .limit(50);

    return NextResponse.json(loginHistories);
  } catch (error) {
    console.error('Error fetching login history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const loginHistory = await LoginHistory.create({
      userId: session.user.id,
      device: body.device || 'Unknown',
      browser: body.browser || 'Unknown',
      os: body.os || 'Unknown',
      ip: body.ip || '0.0.0.0',
      isActive: true,
    });

    return NextResponse.json(loginHistory, { status: 201 });
  } catch (error) {
    console.error('Error creating login history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
