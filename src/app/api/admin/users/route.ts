import { NextResponse } from 'next/server';
import { connect } from '@/db/dbConfig';
import User from '@/models/User';
import { getAdminSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    await connect();
    const session = await getAdminSession();

    if (!session || (session.type !== 'admin' && !['super_admin', 'admin', 'moderator'].includes(session.role as string))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Increased limit to show all users
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const filter = searchParams.get('filter') || 'all';
    
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: parseInt(search) || 0 },
      ];
    }
    
    // Filter logic
    if (status === 'active') {
      query.isActive = true;
      query.isBanned = { $ne: true };
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (filter === 'banned') {
      query.isBanned = true;
    } else if (filter === 'readonly') {
      query.isReadOnly = true;
    }
    
    // Handle challenge users filter separately
    if (filter === 'challenge') {
      const ChallengeAccount = (await import('@/models/ChallengeAccount')).default;
      const challengeUserIds = await ChallengeAccount.distinct('userId');
      query.userId = { $in: challengeUserIds };
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Get stats for dashboard
    const totalAll = await User.countDocuments({});
    const totalActive = await User.countDocuments({ isActive: true, isBanned: { $ne: true } });
    const totalInactive = await User.countDocuments({ isActive: false });
    const totalBanned = await User.countDocuments({ isBanned: true });
    const totalReadOnly = await User.countDocuments({ isReadOnly: true });
    
    // Get challenge users count
    const ChallengeAccount = (await import('@/models/ChallengeAccount')).default;
    const challengeUserIds = await ChallengeAccount.distinct('userId');
    const totalChallengeUsers = challengeUserIds.length;

    return NextResponse.json({
      success: true,
      users,
      totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      stats: {
        totalAll,
        totalActive,
        totalInactive,
        totalBanned,
        totalReadOnly,
        totalChallengeUsers,
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connect();
    const session = await getAdminSession();

    if (!session || (session.type !== 'admin' && !['super_admin', 'admin', 'moderator'].includes(session.role as string))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { email, password, name, phone, role, isActive, balance, kycVerified } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lastUser = await User.findOne().sort({ userId: -1 }).lean();
    const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 100000;

    const user = new User({
      userId: nextUserId,
      email,
      password: hashedPassword,
      name,
      phone,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
      balance: balance !== undefined ? balance : 0,
      kycVerified: kycVerified !== undefined ? kycVerified : false,
      createdByAdmin: session.adminId, // Track which admin created this user
    });

    await user.save();

    // Track this user in the admin's referredUsers list
    const AdminUser = (await import('@/models/AdminUser')).default;
    await AdminUser.updateOne(
      { adminId: session.adminId },
      { $addToSet: { referredUsers: nextUserId } }
    );

    // Create wallet for new user - always start at 0 unless admin explicitly sets balance > 0
    const Wallet = (await import('@/models/Wallet')).default;
    const initialBalance = (balance && balance > 0) ? balance : 0;
    const wallet = new Wallet({
      userId: user.userId,
      balance: initialBalance,
      equity: initialBalance,
      margin: 0,
      freeMargin: initialBalance,
      marginLevel: 0,
      floatingProfit: 0,
    });
    await wallet.save();

    return NextResponse.json({
      success: true,
      message: 'User created successfully by admin',
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

