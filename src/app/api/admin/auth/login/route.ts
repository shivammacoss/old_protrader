import { NextResponse } from 'next/server';
import { connect } from '@/db/dbConfig';
import AdminUser from '@/models/AdminUser';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connect();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find admin user
    const admin = await AdminUser.findOne({ email: normalizedEmail });
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if admin is active
    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Create admin session token
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ 
      adminId: admin.adminId, 
      email: admin.email, 
      role: admin.role,
      type: 'admin',
      expires 
    });

    const response = NextResponse.json({
      success: true,
      message: 'Admin logged in successfully',
      admin: {
        adminId: admin.adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
    });

    // Set admin session cookie
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    response.cookies.set('admin_session', session, {
      httpOnly: true,
      secure: isProduction,
      expires,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to login. Please try again.' },
      { status: 500 }
    );
  }
}
