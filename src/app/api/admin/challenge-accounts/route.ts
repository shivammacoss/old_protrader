import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import ChallengeAccount from '@/models/ChallengeAccount';

export async function GET(req: NextRequest) {
  try {
    await connect();
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const result = searchParams.get('result');
    const challengeType = searchParams.get('challengeType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};
    if (status) query.status = status;
    if (result) query.result = result;
    if (challengeType) query.challengeType = challengeType;

    const total = await ChallengeAccount.countDocuments(query);
    const challenges = await ChallengeAccount.find(query)
      .populate('userId', 'name email userId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get statistics
    const stats = await ChallengeAccount.aggregate([
      {
        $group: {
          _id: null,
          totalChallenges: { $sum: 1 },
          activeChallenges: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          passedChallenges: { $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } },
          failedChallenges: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalRevenue: { $sum: '$price' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$result', 'lose'] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      challenges,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || {
        totalChallenges: 0,
        activeChallenges: 0,
        passedChallenges: 0,
        failedChallenges: 0,
        totalRevenue: 0,
        wins: 0,
        losses: 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching challenge accounts:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connect();
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId, status, result } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ success: false, message: 'Challenge ID required' }, { status: 400 });
    }

    const challenge = await ChallengeAccount.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ success: false, message: 'Challenge not found' }, { status: 404 });
    }

    if (status) challenge.status = status;
    if (result) challenge.result = result;
    if (status === 'passed' || status === 'failed') {
      challenge.completedDate = new Date();
    }

    await challenge.save();

    return NextResponse.json({ success: true, challenge, message: 'Challenge updated successfully' });
  } catch (error: any) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update challenge' },
      { status: 500 }
    );
  }
}
