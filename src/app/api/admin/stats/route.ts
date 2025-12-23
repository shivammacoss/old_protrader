import { NextResponse } from 'next/server';
import { getSession, getAdminSessionFromRequest } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import Transaction from '@/models/Transaction';

export async function GET(req: Request) {
  try {
    let session = await getSession();

    // Fallback: attempt to parse cookies from the Request if session is missing
    if (!session) {
      session = await getAdminSessionFromRequest(req);
    }

    // Check for admin type (super_admin, admin, or moderator)
    const isAdmin = session && (session.type === 'admin' || ['super_admin', 'admin', 'moderator'].includes(session.role as string));
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connect();

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalAdmins,
      totalBalance,
      totalTransactions,
      pendingTransactions,
      depositStats,
      withdrawalStats,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'user', isActive: false }),
      User.countDocuments({ role: 'admin' }),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('userId name email balance isActive createdAt')
        .lean(),
    ]);

    const totalBalanceAmount = totalBalance[0]?.total || 0;
    const totalDeposits = depositStats[0]?.total || 0;
    const totalWithdrawals = withdrawalStats[0]?.total || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalAdmins,
        totalBalance: totalBalanceAmount,
        totalTransactions,
        pendingTransactions,
        totalDeposits,
        totalWithdrawals,
        recentUsers,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

