-- Enable Row Level Security on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Games table policies
CREATE POLICY "Anyone can read games" ON public.games
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert games" ON public.games
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update games" ON public.games
    FOR UPDATE USING (auth.role() = 'service_role');

-- Odds snapshots table policies
CREATE POLICY "Anyone can read odds snapshots" ON public.odds_snapshots
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert odds snapshots" ON public.odds_snapshots
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update odds snapshots" ON public.odds_snapshots
    FOR UPDATE USING (auth.role() = 'service_role');

-- Features table policies
CREATE POLICY "Anyone can read features" ON public.features
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert features" ON public.features
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update features" ON public.features
    FOR UPDATE USING (auth.role() = 'service_role');

-- Predictions table policies
CREATE POLICY "Anyone can read predictions" ON public.predictions
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert predictions" ON public.predictions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update predictions" ON public.predictions
    FOR UPDATE USING (auth.role() = 'service_role');

-- Bets table policies
CREATE POLICY "Anyone can read bets" ON public.bets
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert bets" ON public.bets
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update bets" ON public.bets
    FOR UPDATE USING (auth.role() = 'service_role');
