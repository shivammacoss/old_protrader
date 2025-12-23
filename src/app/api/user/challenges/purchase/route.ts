import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import User from '@/models/User';
import ChallengeAccount from '@/models/ChallengeAccount';
import ChallengeSettings from '@/models/ChallengeSettings';

export async function POST(req: NextRequest) {
  try {
    await connect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { challengeType, profitTarget, accountSize, price, couponCode } = await req.json();

    // Validate inputs
    if (!challengeType || !profitTarget || !accountSize || !price) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check wallet balance and user restrictions
    const user = await User.findOne({ userId: session.userId });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Check if user is banned
    if (user.isBanned) {
      return NextResponse.json({ success: false, message: 'Your account has been banned.' }, { status: 403 });
    }

    // Check if user is read-only (can't buy challenges)
    if (user.isReadOnly) {
      return NextResponse.json({ success: false, message: 'Your account is in read-only mode. You cannot purchase challenges.' }, { status: 403 });
    }

    if (user.walletBalance < price) {
      return NextResponse.json({ success: false, message: 'Insufficient wallet balance' }, { status: 400 });
    }

    // Deduct from wallet
    user.walletBalance -= price;
    await user.save();

    // Generate account number
    const accountNumber = `CH${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(-4).toUpperCase()}`;

    // Calculate target profit
    const targetProfit = (accountSize * profitTarget) / 100;
    const targetBalance = accountSize + targetProfit;

    // Create challenge account
    const challengeAccount = await ChallengeAccount.create({
      userId: session.userId,
      challengeType,
      profitTarget,
      accountSize,
      price,
      accountNumber,
      status: 'active',
      result: 'pending',
      phase: challengeType === 'zero_step' ? 0 : 1,
      startingBalance: accountSize,
      currentBalance: accountSize,
      targetBalance,
      targetProfit,
      currentProfit: 0,
      currentProfitPercent: 0,
      startDate: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Challenge purchased successfully',
      challenge: {
        id: challengeAccount._id,
        accountNumber: challengeAccount.accountNumber,
        challengeType,
        accountSize,
        profitTarget,
      },
    });
  } catch (error: any) {
    console.error('Error purchasing challenge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to purchase challenge' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connect();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const challenges = await ChallengeAccount.find({ userId: session.userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      challenges,
    });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}
