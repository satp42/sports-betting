import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

console.log('🚀 NBA Betting Bot Workers starting...');
console.log('📊 Configured APIs:', {
  oddsApi: process.env.THE_ODDS_API_KEY ? '✅ Configured' : '❌ Missing',
  nbaApi: process.env.NBA_API_KEY ? '✅ Configured' : '❌ Missing',
  supabase: process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
});

export default function main() {
  console.log('Workers application ready for data ingestion tasks!');
}

if (require.main === module) {
  main();
} 