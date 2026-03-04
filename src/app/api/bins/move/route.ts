import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fromBinId, toBinId } = await req.json();
    const sql = neon(process.env.DATABASE_URL2!);

    // 1. First, we need to fetch the source data
    const sourceData = await sql`
      SELECT sku, quantity 
      FROM bin_locations 
      WHERE id = ${fromBinId}
    `;
    
    if (!sourceData || sourceData.length === 0 || !sourceData[0].sku) {
      return NextResponse.json({ error: "Source bin is empty" }, { status: 400 });
    }

    const { sku, quantity } = sourceData[0];

    // 2. Perform the Move Transaction
    // Neon's transaction() expects an array of query results
    const newStatus = quantity >= 2000 ? 'full' : 'partial';

    await sql.transaction([
    // Update destination with the calculated status
    sql`UPDATE bin_locations
        SET sku = ${sku}, quantity = ${quantity}, status = ${newStatus} 
        WHERE id = ${toBinId}`,
    
    // Clear source (always becomes empty)
    sql`UPDATE bin_locations
        SET sku = NULL, quantity = 0, status = 'empty' 
        WHERE id = ${fromBinId}`
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Move Transaction Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}