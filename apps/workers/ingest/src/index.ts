import dotenv from 'dotenv';
import cron from 'node-cron';
import { IngestOrchestrator } from './ingest-orchestrator';

// Load environment variables
dotenv.config({ path: '../../.env' });

console.log('🚀 NBA Betting Bot Workers starting...');
console.log('📊 Configured APIs:', {
  oddsApi: process.env.THE_ODDS_API_KEY ? '✅ Configured' : '❌ Missing',
  nbaApi: process.env.NBA_API_KEY ? '✅ Configured' : '❌ Missing',
  supabase: process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
});

let orchestrator: IngestOrchestrator;
let cronJob: cron.ScheduledTask | null = null;
let isRunning = false;

async function runSingleIngest(): Promise<void> {
  if (isRunning) {
    console.log('⏳ Previous ingestion still running, skipping this cycle');
    return;
  }

  isRunning = true;
  try {
    await orchestrator.runIngestCycle();
  } catch (error) {
    console.error('❌ Error in scheduled ingestion:', error);
  } finally {
    isRunning = false;
  }
}

async function startScheduler(): Promise<void> {
  console.log('🚀 NBA Betting Bot - Odds Ingest Worker starting...');
  
  try {
    // Initialize orchestrator
    orchestrator = new IngestOrchestrator();
    console.log('✅ Orchestrator initialized');

    // Run initial ingestion
    console.log('🏃‍♂️ Running initial ingestion...');
    await runSingleIngest();

    // Schedule cron job for 60-second intervals
    console.log('⏰ Setting up cron scheduler (60-second intervals)...');
    cronJob = cron.schedule('*/60 * * * * *', async () => {
      console.log(`🕐 ${new Date().toISOString()} - Running scheduled ingestion`);
      await runSingleIngest();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log('✅ Cron scheduler started successfully');
    console.log('📊 Worker Status:');
    console.log(`   • Schedule: Every 60 seconds`);
    console.log(`   • Timezone: UTC`);
    console.log(`   • Status: Running`);

  } catch (error) {
    console.error('❌ Failed to start ingest worker:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`🛑 Received ${signal}, starting graceful shutdown...`);
  
  // Stop the cron job
  if (cronJob) {
    cronJob.destroy();
    console.log('⏹️ Cron scheduler stopped');
  }

  // Wait for current ingestion to complete
  if (isRunning) {
    console.log('⏳ Waiting for current ingestion to complete...');
    let attempts = 0;
    while (isRunning && attempts < 30) { // Wait up to 30 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  // Shutdown orchestrator
  if (orchestrator) {
    await orchestrator.shutdown();
  }

  console.log('✅ Graceful shutdown completed');
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the application
if (require.main === module) {
  startScheduler().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  });
}

export { IngestOrchestrator, runSingleIngest }; 