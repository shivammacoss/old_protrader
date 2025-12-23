import { NextResponse } from 'next/server';
import { connect } from '@/db/dbConfig';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connect();

    const { email, password, name, phone, ref } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists using Mongoose model
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lastUser = await User.findOne().sort({ userId: -1 });
    const nextUserId = lastUser && lastUser.userId ? lastUser.userId + 1 : 100000;

    // Create user - let MongoDB unique constraint handle duplicates
    let user;
    try {
      user = new User({
        userId: nextUserId,
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim(),
        role: 'user',
        isActive: true,
        balance: 0,
        kycVerified: false,
      });

      // If a referral code was provided, attempt to link the referred_by field
      if (ref && typeof ref === 'string') {
        try {
          const referrer = await User.findOne({ ib_code: ref.trim() });
          if (referrer) {
            (user as any).referred_by = referrer.userId;
          }
        } catch (e) {
          console.error('Referral lookup failed', e);
        }
      }
      await user.save();
    } catch (saveError: any) {
      // If duplicate key error, user already exists
      if (saveError.code === 11000 || saveError.message?.includes('duplicate')) {
        return NextResponse.json(
          { success: false, message: 'User already exists with this email' },
          { status: 400 }
        );
      }
      throw saveError; // Re-throw other errors
    }

    // Create wallet for new user
    try {
      const wallet = new Wallet({
        userId: user.userId,
        balance: 0,
        equity: 0,
        margin: 0,
        freeMargin: 0,
        marginLevel: 0,
        floatingProfit: 0,
      });
      await wallet.save();
    } catch (walletError: any) {
      // If wallet creation fails, log but don't fail signup
      console.error('Wallet creation error:', walletError);
      // Continue - wallet can be created later if needed
    }

    // Create session token
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ userId: user.userId, email: user.email, role: user.role, expires });

    const response = NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }
    
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack || '';
    
    return NextResponse.json(
      { 
        success: false, 
        message: process.env.NODE_ENV === 'development' 
          ? `Signup error: ${errorMessage}` 
          : 'Failed to create user. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { 
          error: errorMessage,
          stack: errorStack,
          code: error.code
        })
      },
      { status: 500 }
    );
  }
}

