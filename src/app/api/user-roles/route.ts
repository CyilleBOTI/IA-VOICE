import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// This is a workaround for the build process
// During build, we'll return mock data
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

export async function GET(request: NextRequest) {
  // During build time, return mock data to avoid Firebase errors
  if (isBuildTime) {
    console.log('Build time detected, returning mock data');
    return NextResponse.json([], { status: 200 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get user roles
    const userRolesSnapshot = await db.collection('userRoles')
      .where('user_id', '==', userId)
      .get();

    if (userRolesSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    // Get role IDs
    const roleIds = userRolesSnapshot.docs.map(doc => doc.data().role_id);

    // Get role details
    const roles = [];
    for (const roleId of roleIds) {
      const roleDoc = await db.collection('roles').doc(roleId).get();
      if (roleDoc.exists) {
        roles.push({
          id: roleDoc.id,
          ...roleDoc.data()
        });
      }
    }

    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
  }
}
