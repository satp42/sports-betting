"""
NBA ML Core Package

Feature engineering and machine learning package for NBA betting prediction.
"""

__version__ = "0.1.0"
__author__ = "Sports Betting Bot"

from .features import FeatureBuilder, create_feature_builder

__all__ = [
    "FeatureBuilder",
    "create_feature_builder",
] 