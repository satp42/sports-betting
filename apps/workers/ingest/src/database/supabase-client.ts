import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NormalizedOddsRecord } from '../processors/odds-normalizer';

export class SupabaseIngestor {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async insertGames(oddsRecords: NormalizedOddsRecord[]): Promise<void> {
    // Extract unique games
    const uniqueGames = new Map<string, any>();
    
    for (const record of oddsRecords) {
      if (!uniqueGames.has(record.game_id)) {
        uniqueGames.set(record.game_id, {
          id: record.game_id,
          home: record.home_team,
          away: record.away_team,
          tipoff: record.commence_time,
        });
      }
    }

    const games = Array.from(uniqueGames.values());
    
    if (games.length === 0) {
      console.log('📭 No games to insert');
      return;
    }

    console.log(`📤 Inserting ${games.length} games into database...`);

    const { data: _data, error } = await this.supabase
      .from('games')
      .upsert(games, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Error inserting games:', error);
      throw new Error(`Failed to insert games: ${error.message}`);
    }

    console.log(`✅ Successfully upserted ${games.length} games`);
  }

  async insertOddsSnapshots(oddsRecords: NormalizedOddsRecord[]): Promise<void> {
    if (oddsRecords.length === 0) {
      console.log('📭 No odds snapshots to insert');
      return;
    }

    console.log(`📤 Inserting ${oddsRecords.length} odds snapshots into database...`);

    // Transform to database format
    const snapshots = oddsRecords.map(record => ({
      game_id: record.game_id,
      market: record.market,
      ts: new Date().toISOString(),
      bookmaker: record.bookmaker,
      home_odds: record.home_odds,
      away_odds: record.away_odds,
      home_point: record.home_point,
      away_point: record.away_point,
      over_under: record.over_under,
      raw_data: record.raw_data,
    }));

    // Insert in batches to handle large datasets
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < snapshots.length; i += batchSize) {
      const batch = snapshots.slice(i, i + batchSize);
      
      const { data: _data, error } = await this.supabase
        .from('odds_snapshots')
        .insert(batch);

      if (error) {
        console.error('❌ Error inserting odds snapshots batch:', error);
        throw new Error(`Failed to insert odds snapshots: ${error.message}`);
      }

      totalInserted += batch.length;
      console.log(`📊 Inserted batch ${Math.ceil((i + 1) / batchSize)} - ${totalInserted}/${snapshots.length} snapshots`);
    }

    console.log(`✅ Successfully inserted ${totalInserted} odds snapshots`);
  }

  async insertOddsData(oddsRecords: NormalizedOddsRecord[]): Promise<void> {
    try {
      // First insert/update games
      await this.insertGames(oddsRecords);
      
      // Then insert odds snapshots
      await this.insertOddsSnapshots(oddsRecords);
      
      console.log(`🎯 Successfully processed ${oddsRecords.length} odds records`);
    } catch (error) {
      console.error('❌ Error in insertOddsData:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { data: _data, error } = await this.supabase
        .from('games')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database health check failed:', error);
        return false;
      }

      console.log('✅ Database connection healthy');
      return true;
    } catch (error) {
      console.error('❌ Database health check error:', error);
      return false;
    }
  }
} 