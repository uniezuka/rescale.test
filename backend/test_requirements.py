#!/usr/bin/env python3
"""
Simple test script to verify that all requirements can be imported without errors.
This helps catch compatibility issues before deployment.
"""

import sys
import importlib

# List of packages to test
packages_to_test = [
    "fastapi",
    "uvicorn",
    "pydantic",
    "supabase",
    "psycopg2",
    "httpx",
    "aiofiles",
    "PIL",  # This is how Pillow is imported
    "jose",
    "multipart",
    "dotenv",
]

def test_imports():
    """Test importing all required packages."""
    failed_imports = []
    
    for package in packages_to_test:
        try:
            importlib.import_module(package)
            print(f"✅ {package} imported successfully")
        except ImportError as e:
            print(f"❌ {package} failed to import: {e}")
            failed_imports.append(package)
        except Exception as e:
            print(f"⚠️  {package} had unexpected error: {e}")
            failed_imports.append(package)
    
    if failed_imports:
        print(f"\n❌ Failed imports: {failed_imports}")
        return False
    else:
        print(f"\n✅ All packages imported successfully!")
        return True

if __name__ == "__main__":
    print(f"Testing package imports with Python {sys.version}")
    print("=" * 50)
    
    success = test_imports()
    sys.exit(0 if success else 1)
