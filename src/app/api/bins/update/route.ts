import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { binId, sku, quantity } = await req.json();
    const sql = neon(process.env.DATABASE_URL2!);

    const status = !sku || quantity === 0 
      ? 'empty' 
      : quantity >= 2000 ? 'full' : 'partial';

    // Execute and capture result
    const result = await sql`
      UPDATE bin_locations
      SET 
        sku = ${sku}, 
        quantity = ${quantity}, 
        status = ${status},
        last_updated = NOW()
      WHERE id = ${binId}
      RETURNING id; -- This tells us if a row was actually found
    `;

    if (result.length === 0) {
      console.error(`No bin found with ID: ${binId}`);
      return NextResponse.json({ error: 'Bin ID not found in database' }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedId: result[0].id });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update bin' }, { status: 500 });
  }
}