import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL2!);
    
    // Fetch skus and names from your products table
    const data = await sql`
      SELECT sku, name 
      FROM products 
      ORDER BY sku ASC
    `;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('NeonDB Product Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}