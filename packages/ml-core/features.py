"""
NBA Feature Engineering Module

Joins games + last 10 odds_snapshots + Ball Don't Lie team stats
for machine learning model training.
"""

import os
import pandas as pd
import numpy as np
import requests
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class FeatureBuilder:
    """Builds feature vectors for NBA game prediction by joining multiple data sources."""
    
    def __init__(self):
        """Initialize connections to Supabase and Ball Don't Lie API."""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') 
        self.nba_api_key = os.getenv('NBA_API_KEY')
        
        if not all([self.supabase_url, self.supabase_key, self.nba_api_key]):
            raise ValueError("Missing required environment variables")
            
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.ball_dont_lie_base_url = "https://api.balldontlie.io/v1"
        
    def fetch_games(self, limit: int = 100) -> pd.DataFrame:
        """Fetch recent games from Supabase."""
        try:
            response = self.supabase.table('games').select('*').limit(limit).execute()
            games_df = pd.DataFrame(response.data)
            
            if not games_df.empty:
                games_df['tipoff'] = pd.to_datetime(games_df['tipoff'])
                
            return games_df
        except Exception as e:
            raise RuntimeError(f"Failed to fetch games: {e}")
    
    def fetch_odds_snapshots(self, game_id: str, limit: int = 10) -> pd.DataFrame:
        """Fetch last N odds snapshots for a specific game."""
        try:
            response = self.supabase.table('odds_snapshots')\
                .select('*')\
                .eq('game_id', game_id)\
                .order('ts', desc=True)\
                .limit(limit)\
                .execute()
                
            odds_df = pd.DataFrame(response.data)
            
            if not odds_df.empty:
                odds_df['ts'] = pd.to_datetime(odds_df['ts'])
                
            return odds_df
        except Exception as e:
            raise RuntimeError(f"Failed to fetch odds for game {game_id}: {e}")
    
    def fetch_team_stats(self, team_name: str) -> Dict:
        """Fetch team statistics from Ball Don't Lie API."""
        try:
            # First get team ID
            teams_response = requests.get(
                f"{self.ball_dont_lie_base_url}/teams",
                headers={'Authorization': self.nba_api_key},
                timeout=30
            )
            teams_response.raise_for_status()
            teams_data = teams_response.json()
            
            # Find team by name (fuzzy match)
            team_id = None
            for team in teams_data.get('data', []):
                if team_name.lower() in team.get('full_name', '').lower() or \
                   team_name.lower() in team.get('name', '').lower():
                    team_id = team.get('id')
                    break
            
            if not team_id:
                return {}
            
            # Get current season stats (simplified for now)
            # Note: Ball Don't Lie API has limited stats endpoints
            stats = {
                'team_id': team_id,
                'team_name': team_name,
                # Placeholder stats - in production would fetch from games/stats endpoints
                'games_played': 0,
                'avg_points': 0.0,
                'avg_rebounds': 0.0,
                'avg_assists': 0.0,
                'field_goal_pct': 0.0,
                'three_point_pct': 0.0,
                'free_throw_pct': 0.0
            }
            
            return stats
            
        except requests.RequestException as e:
            raise RuntimeError(f"Failed to fetch team stats for {team_name}: {e}")
    
    def create_odds_features(self, odds_df: pd.DataFrame) -> Dict:
        """Create features from odds snapshots."""
        if odds_df.empty:
            return {
                'latest_home_odds': np.nan,
                'latest_away_odds': np.nan,
                'home_odds_trend': np.nan,
                'away_odds_trend': np.nan,
                'odds_volatility': np.nan,
                'num_bookmakers': 0
            }
        
        # Sort by timestamp for trend analysis
        odds_df = odds_df.sort_values('ts')
        
        # Get latest odds
        latest_odds = odds_df.iloc[-1]
        latest_home_odds = latest_odds.get('home_odds', np.nan)
        latest_away_odds = latest_odds.get('away_odds', np.nan)
        
        # Calculate trends (slope of odds over time)
        home_odds_trend = np.nan
        away_odds_trend = np.nan
        
        if len(odds_df) >= 2:
            home_odds_values = odds_df['home_odds'].dropna()
            away_odds_values = odds_df['away_odds'].dropna()
            
            if len(home_odds_values) >= 2:
                home_odds_trend = (home_odds_values.iloc[-1] - home_odds_values.iloc[0]) / len(home_odds_values)
            if len(away_odds_values) >= 2:
                away_odds_trend = (away_odds_values.iloc[-1] - away_odds_values.iloc[0]) / len(away_odds_values)
        
        # Calculate volatility (standard deviation)
        odds_volatility = odds_df[['home_odds', 'away_odds']].std().mean()
        
        # Count unique bookmakers
        num_bookmakers = odds_df['bookmaker'].nunique()
        
        return {
            'latest_home_odds': latest_home_odds,
            'latest_away_odds': latest_away_odds, 
            'home_odds_trend': home_odds_trend,
            'away_odds_trend': away_odds_trend,
            'odds_volatility': odds_volatility,
            'num_bookmakers': num_bookmakers
        }
    
    def create_team_features(self, home_stats: Dict, away_stats: Dict) -> Dict:
        """Create features from team statistics."""
        home_prefix = 'home_'
        away_prefix = 'away_'
        
        features = {}
        
        # Add home team features
        for key, value in home_stats.items():
            if key != 'team_id' and key != 'team_name':
                features[f"{home_prefix}{key}"] = value
        
        # Add away team features  
        for key, value in away_stats.items():
            if key != 'team_id' and key != 'team_name':
                features[f"{away_prefix}{key}"] = value
        
        # Create differential features (always create these)
        features['points_differential'] = home_stats.get('avg_points', 0) - away_stats.get('avg_points', 0)
        features['rebounds_differential'] = home_stats.get('avg_rebounds', 0) - away_stats.get('avg_rebounds', 0)
        features['assists_differential'] = home_stats.get('avg_assists', 0) - away_stats.get('avg_assists', 0)
            
        return features
    
    def build_features_for_game(self, game_id: str) -> Dict:
        """Build complete feature vector for a single game."""
        # Get game details
        game_response = self.supabase.table('games').select('*').eq('id', game_id).execute()
        
        if not game_response.data:
            raise ValueError(f"Game {game_id} not found")
        
        game = game_response.data[0]
        home_team = game['home']
        away_team = game['away']
        tipoff = game['tipoff']
        
        try:
            # Fetch odds snapshots (last 10)
            odds_df = self.fetch_odds_snapshots(game_id, limit=10)
            
            # Fetch team stats
            home_stats = self.fetch_team_stats(home_team)
            away_stats = self.fetch_team_stats(away_team)
            
            # Create feature groups
            odds_features = self.create_odds_features(odds_df)
            team_features = self.create_team_features(home_stats, away_stats)
            
            # Combine all features
            features = {
                'game_id': game_id,
                'home_team': home_team,
                'away_team': away_team,
                'tipoff': tipoff,
                **odds_features,
                **team_features
            }
            
            return features
            
        except Exception as e:
            raise RuntimeError(f"Failed to build features for game {game_id}: {e}")
    
    def build_features_dataset(self, game_ids: Optional[List[str]] = None, limit: int = 50) -> pd.DataFrame:
        """Build feature dataset for multiple games."""
        if game_ids is None:
            # Get recent games if no specific IDs provided
            games_df = self.fetch_games(limit=limit)
            if games_df.empty:
                return pd.DataFrame()
            game_ids = games_df['id'].tolist()
        
        features_list = []
        
        for game_id in game_ids:
            try:
                features = self.build_features_for_game(game_id)
                features_list.append(features)
            except Exception as e:
                print(f"Warning: Failed to process game {game_id}: {e}")
                continue
        
        if not features_list:
            return pd.DataFrame()
        
        features_df = pd.DataFrame(features_list)
        return features_df


def create_feature_builder() -> FeatureBuilder:
    """Factory function to create a FeatureBuilder instance."""
    return FeatureBuilder() 