import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL2!);

    // Fetch all bins and join with product names
    const data = await sql`
      SELECT 
        b.id, 
        b.row, 
        b.layer, 
        b.position, 
        b.sku, 
        p.name AS product_name, 
        b.quantity, 
        b.status, 
        b.last_updated
      FROM bin_locations b
      LEFT JOIN products p ON b.sku = p.sku
      ORDER BY b.row ASC, b.layer DESC, b.position ASC;
    `;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouse data' }, { status: 500 });
  }
}