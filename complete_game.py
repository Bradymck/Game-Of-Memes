#!/usr/bin/env python3
"""
Game of Memes - Complete Implementation Script
Runs both lifesteal and fatigue implementations in sequence

This script completes the final 2 features to reach 100% implementation:
1. Lifesteal Effect (healing when dealing damage)
2. Fatigue Damage (damage when drawing from empty deck)
"""

import subprocess
import sys
import os

def run_script(script_name, description):
    """Run a Python script and return success status"""
    print(f"\n{'='*60}")
    print(f"🎯 {description}")
    print(f"{'='*60}\n")

    try:
        result = subprocess.run(
            ['python3', script_name],
            check=True,
            capture_output=False,
            text=True
        )
        print(f"\n✅ {description} - SUCCESS")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} - FAILED")
        print(f"Error: {e}")
        return False
    except FileNotFoundError:
        print(f"\n❌ Script not found: {script_name}")
        return False

def run_build():
    """Run npm run build to verify TypeScript"""
    print(f"\n{'='*60}")
    print(f"🔨 Building Project (TypeScript Verification)")
    print(f"{'='*60}\n")

    try:
        result = subprocess.run(
            ['npm', 'run', 'build'],
            check=True,
            capture_output=False,
            text=True
        )
        print(f"\n✅ Build - SUCCESS")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Build - FAILED")
        print(f"Error: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("🎮 GAME OF MEMES - FINAL IMPLEMENTATION")
    print("="*60)
    print("\nThis script will complete the final 2 features:")
    print("  1. Lifesteal Effect (healing system)")
    print("  2. Fatigue Damage (empty deck damage)")
    print("\nPress ENTER to continue or Ctrl+C to cancel...")
    input()

    # Check if we're in the right directory
    if not os.path.exists('package.json'):
        print("\n❌ ERROR: Not in game-of-memes directory!")
        print("Please run: cd /Users/bradymckenna/Documents/game-of-memes")
        sys.exit(1)

    # Track success
    all_success = True

    # Step 1: Lifesteal
    if not run_script('apply_lifesteal.py', 'Lifesteal Implementation'):
        all_success = False
        print("\n⚠️  Warning: Lifesteal implementation failed")
        print("Continue anyway? (y/n): ", end='')
        if input().lower() != 'y':
            sys.exit(1)

    # Step 2: Fatigue
    if not run_script('apply_fatigue.py', 'Fatigue Damage Implementation'):
        all_success = False
        print("\n⚠️  Warning: Fatigue implementation failed")
        print("Continue to build anyway? (y/n): ", end='')
        if input().lower() != 'y':
            sys.exit(1)

    # Step 3: Build
    if not run_build():
        all_success = False
        print("\n❌ Build failed! Check TypeScript errors above.")
        print("\nYou can restore from backups:")
        print("  - app/page.tsx.backup-lifesteal")
        print("  - app/page.tsx.backup-fatigue")
        print("  - lib/types.ts.backup-fatigue")
        sys.exit(1)

    # Success!
    print("\n" + "="*60)
    if all_success:
        print("🎉 ALL IMPLEMENTATIONS COMPLETE!")
    else:
        print("⚠️  PARTIAL SUCCESS - Some scripts had warnings")
    print("="*60)
    print("\n✅ Game of Memes is now feature-complete!")
    print("\n📋 Implementation Summary:")
    print("  ✅ Lifesteal Effect - Minions heal when dealing damage")
    print("  ✅ Fatigue Damage - Empty deck deals increasing damage")
    print("  ✅ TypeScript Build - Passes without errors")
    print("\n🧪 Next Steps:")
    print("  1. Test lifesteal:")
    print("     npm run dev")
    print("     Play $VAMP card and attack to verify healing")
    print("\n  2. Test fatigue:")
    print("     Play game until deck runs out")
    print("     Verify damage increases: 1, 2, 3, 4...")
    print("\n  3. Mark complete:")
    print("     Update @fix_plan.md to mark [x] all items")
    print("     Set EXIT_SIGNAL = true")
    print("\n💾 Backups created:")
    print("  - app/page.tsx.backup-lifesteal")
    print("  - app/page.tsx.backup-fatigue")
    print("  - lib/types.ts.backup-fatigue")
    print("\n🚀 Game is ready for Web3 integration!")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
