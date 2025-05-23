#!/usr/bin/env python3
"""
Demo script for NBA Feature Engineering

Shows how to use the FeatureBuilder to create ML features
from games, odds snapshots, and team statistics.
"""

import os
import sys
from pathlib import Path

# Add the project root to the path so we can load .env
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from features import create_feature_builder


def main():
    """Demonstrate feature builder functionality."""
    print("🏀 NBA Feature Engineering Demo")
    print("=" * 50)
    
    try:
        # Create feature builder instance
        print("📊 Initializing FeatureBuilder...")
        builder = create_feature_builder()
        print("✅ FeatureBuilder initialized successfully")
        
        # Example 1: Build features for a specific game (if it exists)
        print("\n🎮 Example 1: Building features for a specific game")
        print("-" * 30)
        
        # In a real scenario, you'd get this from your database
        example_game_id = "2066c605a729491bce972c57e275108e"  # From our live data
        
        try:
            features = builder.build_features_for_game(example_game_id)
            print(f"✅ Features built for game: {features.get('home_team')} vs {features.get('away_team')}")
            print(f"📈 Latest home odds: {features.get('latest_home_odds')}")
            print(f"📉 Latest away odds: {features.get('latest_away_odds')}")
            print(f"🔢 Number of features: {len(features)}")
            
            # Show some key features
            key_features = [
                'latest_home_odds', 'latest_away_odds', 'odds_volatility',
                'num_bookmakers', 'points_differential'
            ]
            
            print("\n🔍 Key features:")
            for feature in key_features:
                value = features.get(feature, 'N/A')
                print(f"   {feature}: {value}")
                
        except Exception as e:
            print(f"⚠️  Could not build features for specific game: {e}")
            print("   (This is expected if the game doesn't exist in your database)")
        
        # Example 2: Build dataset for multiple games
        print("\n📊 Example 2: Building feature dataset")
        print("-" * 30)
        
        try:
            dataset = builder.build_features_dataset(limit=5)
            if not dataset.empty:
                print(f"✅ Built dataset with {len(dataset)} games")
                print(f"🔢 Number of features per game: {len(dataset.columns)}")
                print(f"📋 Sample columns: {list(dataset.columns[:10])}")
            else:
                print("📭 No games available for feature building")
                
        except Exception as e:
            print(f"⚠️  Could not build dataset: {e}")
        
        print("\n🎯 Demo completed successfully!")
        
    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
        print("💡 Make sure you have the required environment variables set:")
        print("   - SUPABASE_URL")
        print("   - SUPABASE_SERVICE_ROLE_KEY") 
        print("   - NBA_API_KEY")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    main() 