import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import ChallengeSettings from '@/models/ChallengeSettings';

export async function GET(req: NextRequest) {
  try {
    await connect();
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const settings = await (ChallengeSettings as any).getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching challenge settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
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

    const body = await req.json();
    const {
      challengeTypePrices,
      accountSizePrices,
      profitTargetModifiers,
      maxDailyLoss,
      maxTotalLoss,
      minTradingDays,
      tradingPeriodDays,
    } = body;

    let settings = await ChallengeSettings.findOne();
    if (!settings) {
      settings = new ChallengeSettings();
    }

    if (challengeTypePrices) settings.challengeTypePrices = challengeTypePrices;
    if (accountSizePrices) settings.accountSizePrices = accountSizePrices;
    if (profitTargetModifiers) settings.profitTargetModifiers = profitTargetModifiers;
    if (maxDailyLoss !== undefined) settings.maxDailyLoss = maxDailyLoss;
    if (maxTotalLoss !== undefined) settings.maxTotalLoss = maxTotalLoss;
    if (minTradingDays !== undefined) settings.minTradingDays = minTradingDays;
    if (tradingPeriodDays !== undefined) settings.tradingPeriodDays = tradingPeriodDays;
    settings.updatedAt = new Date();
    settings.updatedBy = session.userId;

    await settings.save();

    return NextResponse.json({ success: true, settings, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating challenge settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
