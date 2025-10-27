import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import LoginHistory from '@/models/LoginHistory';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const loginHistory = await LoginHistory.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id,
      },
      {
        logoutTime: new Date(),
        isActive: false,
      },
      { new: true }
    );

    if (!loginHistory) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(loginHistory);
  } catch (error) {
    console.error('Error updating login history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const result = await LoginHistory.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting login history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
