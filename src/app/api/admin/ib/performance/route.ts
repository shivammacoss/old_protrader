import { NextResponse } from 'next/server';
import { getSession, getAdminSessionFromRequest } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import IBCommission from '@/models/IBCommission';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    let session = await getSession();

    if (!session) {
      session = await getAdminSessionFromRequest(req);
    }

    if (!session || (session.type !== 'admin' && !['super_admin', 'admin', 'moderator'].includes(session.role as string))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connect();

    const performanceStats = await IBCommission.aggregate([
      {
        $group: {
          _id: '$ib_user_id',
          totalCommission: { $sum: '$commission_amount' },
          referredUsersCount: { $addToSet: '$referred_user_id' }
        }
      },
      {
        $project: {
          ib_user_id: '$_id',
          totalCommission: 1,
          referredUsersCount: { $size: '$referredUsersCount' },
          _id: 0
        }
      }
    ]);

    if (!performanceStats.length) {
      return NextResponse.json({
        success: true,
        performance: [],
      });
    }

    const ibUserIds = performanceStats.map(stat => stat.ib_user_id);
    const users = await User.find({ userId: { $in: ibUserIds } })
      .select('userId name')
      .lean();
    
    const userMap = new Map<number, { name: string }>();
    users.forEach(u => {
      userMap.set(u.userId, { name: u.name });
    });

    const enrichedPerformance = performanceStats.map(stat => ({
      ...stat,
      ib_user_name: userMap.get(stat.ib_user_id)?.name || 'N/A',
    }));

    return NextResponse.json({
      success: true,
      performance: enrichedPerformance,
    });

  } catch (error: any) {
    console.error('Failed to fetch IB performance:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch IB performance' },
      { status: 500 }
    );
  }
}
