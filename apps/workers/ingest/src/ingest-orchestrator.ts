import dotenv from 'dotenv';
import { OddsApiClient } from './api/odds-api';
import { OddsNormalizer } from './processors/odds-normalizer';
import { SupabaseIngestor } from './database/supabase-client';
import { KafkaOddsProducer } from './messaging/kafka-producer';

// Load environment variables
dotenv.config({ path: '../../../.env' });

export class IngestOrchestrator {
  private oddsApi: OddsApiClient;
  private supabaseIngestor: SupabaseIngestor;
  private kafkaProducer: KafkaOddsProducer;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = [
      'THE_ODDS_API_KEY',
      'SUPABASE_URL', 
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    this.oddsApi = new OddsApiClient(process.env.THE_ODDS_API_KEY!);
    this.supabaseIngestor = new SupabaseIngestor(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.kafkaProducer = new KafkaOddsProducer();
  }

  async runIngestCycle(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting odds ingestion cycle...');

    try {
      // 1. Health checks
      console.log('🔍 Performing health checks...');
      const dbHealthy = await this.supabaseIngestor.healthCheck();
      if (!dbHealthy) {
        throw new Error('Database health check failed');
      }

      // 2. Fetch odds from API
      console.log('📡 Fetching NBA odds...');
      const oddsApiResponse = await this.oddsApi.fetchNbaOdds();

      if (oddsApiResponse.length === 0) {
        console.log('📭 No games found, skipping cycle');
        return;
      }

      // 3. Normalize the data
      console.log('🔄 Normalizing odds data...');
      const normalizedRecords = OddsNormalizer.normalize(oddsApiResponse);

      if (normalizedRecords.length === 0) {
        console.log('📭 No odds records after normalization, skipping cycle');
        return;
      }

      // 4. Insert into Supabase
      console.log('💾 Inserting data into Supabase...');
      await this.supabaseIngestor.insertOddsData(normalizedRecords);

      // 5. Publish to Kafka
      console.log('📤 Publishing to Kafka...');
      await this.kafkaProducer.publishOddsUpdates(normalizedRecords);

      const duration = Date.now() - startTime;
      console.log(`🎯 Ingestion cycle completed successfully in ${duration}ms`);
      console.log(`📊 Processed: ${oddsApiResponse.length} games → ${normalizedRecords.length} odds records`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Ingestion cycle failed after ${duration}ms:`, error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down ingest orchestrator...');
    try {
      await this.kafkaProducer.disconnect();
      console.log('✅ Ingest orchestrator shut down successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
} 