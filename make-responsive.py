#!/usr/bin/env python3
"""
Script to apply mobile responsive Tailwind classes to all frontend pages
"""

import os
import re
from pathlib import Path

# Mapping of non-responsive classes to responsive versions
RESPONSIVE_MAPPINGS = {
    # Spacing
    r'\bp-8\b': 'p-4 md:p-6 lg:p-8',
    r'\bp-6\b': 'p-3 md:p-4 lg:p-6',
    r'\bp-4\b': 'p-2 md:p-3 lg:p-4',
    r'\bspace-y-8\b': 'space-y-4 md:space-y-6 lg:space-y-8',
    r'\bspace-y-6\b': 'space-y-3 md:space-y-4 lg:space-y-6',
    r'\bgap-6\b': 'gap-3 md:gap-4 lg:gap-6',
    r'\bgap-4\b': 'gap-2 md:gap-3 lg:gap-4',
    # Typography
    r'\btext-5xl\b': 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    r'\btext-4xl\b': 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    r'\btext-3xl\b': 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    r'\btext-2xl\b': 'text-base sm:text-lg md:text-xl lg:text-2xl',
    # Flex/Grid layouts
    r'className="flex items-center justify-between"': 'className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"',
    r'className="flex items-center justify-between gap-2"': 'className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"',
    # Heading with description
    r'<h1 className="text-4xl': '<h1 className="text-2xl sm:text-3xl md:text-4xl',
    r'<h1 className="text-3xl': '<h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl',
}

def make_page_responsive(filepath):
    """Apply responsive Tailwind classes to a single page"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply mappings
        for pattern, replacement in RESPONSIVE_MAPPINGS.items():
            # Skip if already applied (contains md: or lg: or sm:)
            if 'md:' in replacement or 'lg:' in replacement or 'sm:' in replacement:
                # Check if pattern doesn't already have responsive classes
                if re.search(pattern, content) and not re.search(pattern.replace(r'\b', '').replace('\\', '') + r'.*?(md:|lg:|sm:)', content):
                    content = re.sub(pattern, replacement, content)
            else:
                content = re.sub(pattern, replacement, content)
        
        # Only write if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {filepath}")
            return True
        else:
            print(f"- Skipped: {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error: {filepath}: {str(e)}")
        return False

def main():
    """Update all pages in the frontend"""
    frontend_path = Path('/workspaces/codespaces-blank/Proj/frontend/src/app')
    page_files = list(frontend_path.rglob('page.tsx'))
    
    print(f"Found {len(page_files)} pages to check...")
    print()
    
    updated = 0
    for page_file in sorted(page_files):
        if make_page_responsive(str(page_file)):
            updated += 1
    
    print()
    print(f"✓ Updated {updated}/{len(page_files)} pages")

if __name__ == '__main__':
    main()
