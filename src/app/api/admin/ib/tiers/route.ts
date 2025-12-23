import { NextResponse } from 'next/server';
import { getSession, getAdminSessionFromRequest } from '@/lib/auth';
import { connect } from '@/db/dbConfig';
import IBTier from '@/models/IBTier';

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

    const tiers = await IBTier.find({}).sort({ minReferrals: 1 });

    return NextResponse.json({
      success: true,
      tiers,
    });
  } catch (error: any) {
    console.error('Failed to fetch tiers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tiers' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const { name, minReferrals, maxReferrals, commissionRate } = await req.json();

    if (!name || minReferrals === undefined || maxReferrals === undefined || commissionRate === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newTier = new IBTier({
      name,
      minReferrals,
      maxReferrals,
      commissionRate,
    });

    await newTier.save();

    return NextResponse.json({
      success: true,
      message: 'Tier created successfully',
      tier: newTier,
    });
  } catch (error: any) {
    console.error('Failed to create tier:', error);
    if (error.code === 11000) {
        return NextResponse.json(
            { success: false, message: 'A tier with this name already exists.' },
            { status: 409 }
          );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create tier' },
      { status: 500 }
    );
  }
}
