-- Enable Realtime for odds_snapshots table
ALTER publication supabase_realtime ADD TABLE public.odds_snapshots;

-- Enable Realtime for predictions table  
ALTER publication supabase_realtime ADD TABLE public.predictions;

-- Also enable Realtime for bets table for live bet tracking
ALTER publication supabase_realtime ADD TABLE public.bets;
