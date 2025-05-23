"""
Unit tests for NBA Feature Engineering Module

Tests feature builder with static fixture sets to ensure
reliable and reproducible feature generation.
"""

import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from features import FeatureBuilder, create_feature_builder


class TestFeatureBuilder:
    """Test suite for FeatureBuilder class using static fixtures."""
    
    @pytest.fixture
    def mock_env_vars(self):
        """Mock environment variables for testing."""
        env_vars = {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
            'NBA_API_KEY': 'test-nba-key'
        }
        with patch.dict('os.environ', env_vars):
            yield env_vars
    
    @pytest.fixture
    def sample_games_data(self):
        """Static fixture for games table data."""
        return [
            {
                'id': 'game-123',
                'home': 'Los Angeles Lakers', 
                'away': 'Boston Celtics',
                'tipoff': '2024-01-15T19:00:00Z'
            },
            {
                'id': 'game-456',
                'home': 'Golden State Warriors',
                'away': 'Miami Heat', 
                'tipoff': '2024-01-16T20:00:00Z'
            }
        ]
    
    @pytest.fixture
    def sample_odds_data(self):
        """Static fixture for odds snapshots data."""
        return [
            {
                'game_id': 'game-123',
                'market': 'h2h',
                'ts': '2024-01-15T18:00:00Z',
                'bookmaker': 'fanduel',
                'home_odds': 1.95,
                'away_odds': 1.87,
                'home_point': None,
                'away_point': None,
                'over_under': None
            },
            {
                'game_id': 'game-123',
                'market': 'h2h', 
                'ts': '2024-01-15T17:30:00Z',
                'bookmaker': 'draftkings',
                'home_odds': 1.92,
                'away_odds': 1.90,
                'home_point': None,
                'away_point': None,
                'over_under': None
            },
            {
                'game_id': 'game-123',
                'market': 'h2h',
                'ts': '2024-01-15T17:00:00Z', 
                'bookmaker': 'fanduel',
                'home_odds': 1.88,
                'away_odds': 1.94,
                'home_point': None,
                'away_point': None,
                'over_under': None
            }
        ]
    
    @pytest.fixture
    def sample_team_stats(self):
        """Static fixture for team statistics data."""
        return {
            'Lakers': {
                'team_id': 14,
                'team_name': 'Los Angeles Lakers',
                'games_played': 41,
                'avg_points': 118.5,
                'avg_rebounds': 44.2,
                'avg_assists': 26.8,
                'field_goal_pct': 0.487,
                'three_point_pct': 0.351,
                'free_throw_pct': 0.781
            },
            'Celtics': {
                'team_id': 2,
                'team_name': 'Boston Celtics', 
                'games_played': 42,
                'avg_points': 121.2,
                'avg_rebounds': 46.1,
                'avg_assists': 27.5,
                'field_goal_pct': 0.492,
                'three_point_pct': 0.375,
                'free_throw_pct': 0.826
            }
        }
    
    @pytest.fixture
    def feature_builder(self, mock_env_vars):
        """Create FeatureBuilder instance with mocked dependencies."""
        with patch('features.create_client') as mock_create_client:
            mock_supabase = Mock()
            mock_create_client.return_value = mock_supabase
            
            builder = FeatureBuilder()
            builder.supabase = mock_supabase
            return builder
    
    def test_create_feature_builder_factory(self, mock_env_vars):
        """Test factory function creates FeatureBuilder instance."""
        with patch('features.create_client'):
            builder = create_feature_builder()
            assert isinstance(builder, FeatureBuilder)
    
    def test_feature_builder_init_missing_env_vars(self):
        """Test FeatureBuilder raises error with missing environment variables."""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="Missing required environment variables"):
                FeatureBuilder()
    
    def test_fetch_games(self, feature_builder, sample_games_data):
        """Test fetching games from Supabase."""
        # Mock Supabase response
        mock_response = Mock()
        mock_response.data = sample_games_data
        feature_builder.supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_response
        
        # Test fetch
        games_df = feature_builder.fetch_games(limit=2)
        
        # Assertions
        assert len(games_df) == 2
        assert games_df.iloc[0]['id'] == 'game-123'
        assert games_df.iloc[0]['home'] == 'Los Angeles Lakers'
        assert isinstance(games_df.iloc[0]['tipoff'], pd.Timestamp)
    
    def test_fetch_odds_snapshots(self, feature_builder, sample_odds_data):
        """Test fetching odds snapshots for a game."""
        # Mock Supabase response
        mock_response = Mock()
        mock_response.data = sample_odds_data
        feature_builder.supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
        
        # Test fetch
        odds_df = feature_builder.fetch_odds_snapshots('game-123', limit=10)
        
        # Assertions
        assert len(odds_df) == 3
        assert all(odds_df['game_id'] == 'game-123')
        assert isinstance(odds_df.iloc[0]['ts'], pd.Timestamp)
        assert odds_df.iloc[0]['home_odds'] == 1.95
    
    def test_fetch_team_stats_success(self, feature_builder):
        """Test successful team stats fetch from Ball Don't Lie API."""
        mock_teams_response = {
            'data': [
                {'id': 14, 'name': 'Lakers', 'full_name': 'Los Angeles Lakers'},
                {'id': 2, 'name': 'Celtics', 'full_name': 'Boston Celtics'}
            ]
        }
        
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = mock_teams_response
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            stats = feature_builder.fetch_team_stats('Los Angeles Lakers')
            
            assert stats['team_id'] == 14
            assert stats['team_name'] == 'Los Angeles Lakers'
            assert 'avg_points' in stats
    
    def test_fetch_team_stats_team_not_found(self, feature_builder):
        """Test team stats when team is not found."""
        mock_teams_response = {'data': []}
        
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.json.return_value = mock_teams_response
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            stats = feature_builder.fetch_team_stats('Nonexistent Team')
            
            assert stats == {}
    
    def test_create_odds_features_empty_data(self, feature_builder):
        """Test odds feature creation with empty DataFrame."""
        empty_df = pd.DataFrame()
        features = feature_builder.create_odds_features(empty_df)
        
        expected_features = {
            'latest_home_odds': np.nan,
            'latest_away_odds': np.nan,
            'home_odds_trend': np.nan,
            'away_odds_trend': np.nan,
            'odds_volatility': np.nan,
            'num_bookmakers': 0
        }
        
        for key, expected_value in expected_features.items():
            if pd.isna(expected_value):
                assert pd.isna(features[key])
            else:
                assert features[key] == expected_value
    
    def test_create_odds_features_with_data(self, feature_builder, sample_odds_data):
        """Test odds feature creation with actual data."""
        odds_df = pd.DataFrame(sample_odds_data)
        odds_df['ts'] = pd.to_datetime(odds_df['ts'])
        
        features = feature_builder.create_odds_features(odds_df)
        
        # Check basic features exist
        assert 'latest_home_odds' in features
        assert 'latest_away_odds' in features
        assert 'home_odds_trend' in features
        assert 'away_odds_trend' in features
        assert 'odds_volatility' in features
        assert 'num_bookmakers' in features
        
        # Check specific values
        assert features['num_bookmakers'] == 2  # fanduel and draftkings
        assert isinstance(features['latest_home_odds'], (int, float))
        assert isinstance(features['latest_away_odds'], (int, float))
    
    def test_create_team_features(self, feature_builder, sample_team_stats):
        """Test team feature creation from stats."""
        home_stats = sample_team_stats['Lakers']
        away_stats = sample_team_stats['Celtics']
        
        features = feature_builder.create_team_features(home_stats, away_stats)
        
        # Check home team features
        assert features['home_games_played'] == 41
        assert features['home_avg_points'] == 118.5
        assert features['home_field_goal_pct'] == 0.487
        
        # Check away team features  
        assert features['away_games_played'] == 42
        assert features['away_avg_points'] == 121.2
        assert features['away_field_goal_pct'] == 0.492
        
        # Check differential features
        assert features['points_differential'] == 118.5 - 121.2
        assert features['rebounds_differential'] == 44.2 - 46.1
        assert features['assists_differential'] == 26.8 - 27.5
    
    def test_create_team_features_empty_stats(self, feature_builder):
        """Test team feature creation with empty stats."""
        features = feature_builder.create_team_features({}, {})
        
        # Should have differential features with 0 values
        assert features['points_differential'] == 0
        assert features['rebounds_differential'] == 0
        assert features['assists_differential'] == 0
    
    def test_build_features_for_game_success(self, feature_builder, sample_games_data, sample_odds_data, sample_team_stats):
        """Test complete feature building for a single game."""
        game_id = 'game-123'
        
        # Mock game fetch
        game_response = Mock()
        game_response.data = [sample_games_data[0]]
        feature_builder.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = game_response
        
        # Mock odds fetch
        odds_response = Mock()
        odds_response.data = sample_odds_data
        feature_builder.supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = odds_response
        
        # Mock team stats
        def mock_fetch_team_stats(team_name):
            if 'Lakers' in team_name:
                return sample_team_stats['Lakers']
            elif 'Celtics' in team_name:
                return sample_team_stats['Celtics']
            return {}
        
        feature_builder.fetch_team_stats = Mock(side_effect=mock_fetch_team_stats)
        
        # Test feature building
        features = feature_builder.build_features_for_game(game_id)
        
        # Assertions
        assert features['game_id'] == game_id
        assert features['home_team'] == 'Los Angeles Lakers'
        assert features['away_team'] == 'Boston Celtics'
        assert 'latest_home_odds' in features
        assert 'home_avg_points' in features
        assert 'away_avg_points' in features
        assert 'points_differential' in features
    
    def test_build_features_for_game_not_found(self, feature_builder):
        """Test feature building when game is not found."""
        # Mock empty game response
        game_response = Mock()
        game_response.data = []
        feature_builder.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = game_response
        
        with pytest.raises(ValueError, match="Game .* not found"):
            feature_builder.build_features_for_game('nonexistent-game')
    
    def test_build_features_dataset_empty_games(self, feature_builder):
        """Test dataset building with no games."""
        # Mock empty games response
        games_response = Mock()
        games_response.data = []
        feature_builder.supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = games_response
        
        dataset = feature_builder.build_features_dataset()
        
        assert isinstance(dataset, pd.DataFrame)
        assert len(dataset) == 0
    
    def test_build_features_dataset_with_game_ids(self, feature_builder):
        """Test dataset building with specific game IDs."""
        game_ids = ['game-123', 'game-456']
        
        # Mock the build_features_for_game method
        def mock_build_features(game_id):
            return {
                'game_id': game_id,
                'home_team': 'Team A',
                'away_team': 'Team B',
                'latest_home_odds': 1.5,
                'latest_away_odds': 2.5
            }
        
        feature_builder.build_features_for_game = Mock(side_effect=mock_build_features)
        
        dataset = feature_builder.build_features_dataset(game_ids=game_ids)
        
        assert len(dataset) == 2
        assert list(dataset['game_id']) == game_ids
        assert 'latest_home_odds' in dataset.columns
    
    def test_build_features_dataset_with_errors(self, feature_builder):
        """Test dataset building handles individual game errors gracefully."""
        game_ids = ['game-123', 'game-456', 'game-789']
        
        def mock_build_features(game_id):
            if game_id == 'game-456':
                raise RuntimeError("API Error")
            return {
                'game_id': game_id,
                'home_team': 'Team A',
                'away_team': 'Team B'
            }
        
        feature_builder.build_features_for_game = Mock(side_effect=mock_build_features)
        
        # Capture print output
        with patch('builtins.print') as mock_print:
            dataset = feature_builder.build_features_dataset(game_ids=game_ids)
        
        # Should have 2 successful games (123 and 789), skip 456
        assert len(dataset) == 2
        assert list(dataset['game_id']) == ['game-123', 'game-789']
        
        # Should print warning
        mock_print.assert_called_once()
        assert "Warning: Failed to process game game-456" in str(mock_print.call_args)


if __name__ == '__main__':
    pytest.main([__file__]) 