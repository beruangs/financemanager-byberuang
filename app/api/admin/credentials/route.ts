import { NextResponse } from 'next/server';

// This route reads `request.headers` and must be rendered dynamically.
export const dynamic = 'force-dynamic';
import * as fs from 'fs';
import * as path from 'path';

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) {
      return false; // Token expired
    }

    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}

function updateEnvFile(updates: { [key: string]: string }) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    
    // Read current .env.local
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Parse existing values
    const envLines = envContent.split('\n');
    const envVars: { [key: string]: string } = {};

    envLines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key.trim()) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Update with new values
    Object.assign(envVars, updates);

    // Rebuild .env.local content (preserve order, put admin vars at top)
    const orderedVars: { [key: string]: string } = {};
    
    // First, add admin-related vars
    if (envVars.ADMIN_EMAIL) orderedVars.ADMIN_EMAIL = envVars.ADMIN_EMAIL;
    if (envVars.ADMIN_PASSWORD) orderedVars.ADMIN_PASSWORD = envVars.ADMIN_PASSWORD;
    if (envVars.ADMIN_USERNAME) orderedVars.ADMIN_USERNAME = envVars.ADMIN_USERNAME;

    // Then add other vars
    Object.entries(envVars).forEach(([key, value]) => {
      if (!key.startsWith('ADMIN_')) {
        orderedVars[key] = value;
      }
    });

    // Write back to file
    const newContent = Object.entries(orderedVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync(envPath, newContent, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error updating .env.local:', error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return current credential info (without password for security)
    return NextResponse.json({
      email: process.env.ADMIN_EMAIL || '',
      username: process.env.ADMIN_USERNAME || '',
      // Never return password in response
    });
  } catch (error: any) {
    console.error('Get credentials error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, username } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Update .env.local
    const updates: { [key: string]: string } = {
      ADMIN_EMAIL: email,
      ADMIN_PASSWORD: password,
    };

    if (username && username.trim()) {
      updates.ADMIN_USERNAME = username.trim();
    }

    const success = updateEnvFile(updates);

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal menyimpan kredensial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kredensial berhasil diperbarui',
      email,
      username: username || '',
    });
  } catch (error: any) {
    console.error('Update credentials error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
