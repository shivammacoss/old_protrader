import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/db/dbConfig';
import ChallengeSettings from '@/models/ChallengeSettings';

// Public API to get challenge settings (for buy-challenge page)
export async function GET(req: NextRequest) {
  try {
    await connect();
    const settings = await (ChallengeSettings as any).getSettings();
    
    return NextResponse.json({
      success: true,
      settings: {
        challengeTypePrices: settings.challengeTypePrices,
        accountSizePrices: settings.accountSizePrices,
        profitTargetModifiers: settings.profitTargetModifiers,
      },
    });
  } catch (error: any) {
    console.error('Error fetching challenge settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
