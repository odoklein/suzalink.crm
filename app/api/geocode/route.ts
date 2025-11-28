import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geocodeAddress } from '@/lib/geo/geocode';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });

    const result = await geocodeAddress(address);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Geocode failed' }, { status: 500 });
  }
}
