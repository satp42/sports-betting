-- Create features table for ML feature engineering
CREATE TABLE IF NOT EXISTS public.features (
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    team_id text NOT NULL, -- team identifier (home/away or team code)
    feature_vector jsonb NOT NULL, -- ML features as JSON
    feature_metadata jsonb, -- metadata about feature generation
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Composite primary key
    PRIMARY KEY (game_id, team_id)
);

-- Create index for game lookups
CREATE INDEX idx_features_game_id ON public.features(game_id);

-- Create index for team lookups
CREATE INDEX idx_features_team_id ON public.features(team_id);

-- Create GIN index for JSONB feature vector queries
CREATE INDEX idx_features_vector_gin ON public.features USING gin(feature_vector);

-- Create index for timestamps
CREATE INDEX idx_features_created_at ON public.features(created_at);
