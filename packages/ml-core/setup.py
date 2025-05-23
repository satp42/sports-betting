"""
Setup script for NBA ML Core Package
"""

from setuptools import setup, find_packages

setup(
    name="nba-ml-core",
    version="0.1.0",
    description="NBA Feature Engineering and ML Core Package",
    author="Sports Betting Bot",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "pandas>=2.1.0",
        "numpy>=1.24.3", 
        "requests>=2.31.0",
        "python-dotenv>=1.0.0",
        "supabase>=1.2.0",
    ],
    extras_require={
        "test": [
            "pytest>=7.4.2",
        ]
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
) 