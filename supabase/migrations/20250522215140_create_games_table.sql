-- Create games table for NBA game schedule
CREATE TABLE IF NOT EXISTS public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    home text NOT NULL,
    away text NOT NULL,
    tipoff timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index on tipoff for performance
CREATE INDEX idx_games_tipoff ON public.games(tipoff);

-- Create index on teams for performance
CREATE INDEX idx_games_home ON public.games(home);
CREATE INDEX idx_games_away ON public.games(away);
