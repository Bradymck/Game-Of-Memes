# Fix Draft Page to Use Vibe Market API

## Problem
Newly minted packs from Vibe Market don't show up on the `/draft` page because:
- Currently using Alchemy's indexer which has a delay
- Need to use Vibe Market API for real-time pack data

## Plan

### 1. Backend Changes
- [ ] Create new Vibe Market API integration function
- [ ] Add function to fetch packs using Vibe Market API endpoint
- [ ] Handle API key from environment variables

### 2. Update useUnopenedPacks Hook
- [ ] Modify hook to use Vibe Market API instead of Alchemy
- [ ] Keep fallback to existing Alchemy method if Vibe API fails
- [ ] Ensure proper error handling

### 3. Testing
- [ ] Test with newly minted packs
- [ ] Verify existing packs still show correctly
- [ ] Test error states

## Review

### Changes Made

#### 1. Added Vibe Market API Integration ([lib/vibemarket.ts:260-313](lib/vibemarket.ts#L260-L313))
- Created `fetchUnopenedPacksFromVibeMarket()` function
- **Fixed API endpoint**: Now using correct base URL `https://build.wield.xyz/vibe/boosterbox`
- **Fixed endpoint path**: Using `/owner/{address}` (documented endpoint)
- **Added authentication**: Includes `API-KEY` header with Wield API key
- Filters for unopened packs using `rarity === 0`
- Returns real-time data without indexing delays

#### 2. Updated Pack Fetching Logic ([lib/basescanIndexer.ts:9-38](lib/basescanIndexer.ts#L9-L38))
- Modified `getUnopenedPacksFromBaseScan()` to try Vibe Market API first
- Added fallback to Alchemy NFT API if Vibe Market fails or returns no results
- Renamed original Alchemy function to `getUnopenedPacksFromAlchemy()` for clarity
- Added proper error handling and logging

#### 3. Added Environment Variable ([.env.local:10](.env.local#L10))
- Added `WIELD_API_KEY` for API authentication

### How It Works
1. When user visits `/draft` page, `useUnopenedPacks` hook is triggered
2. Hook calls `getUnopenedPacksFromBaseScan(walletAddress)`
3. Function tries Vibe Market API first for real-time data
4. If successful, returns packs immediately (newly minted packs included)
5. If Vibe Market API fails, falls back to Alchemy indexer
6. UI displays all unopened packs with updated metadata

### Security Review
✅ No SQL injection risk - using fetch API with query parameters
✅ No XSS risk - data is properly sanitized through React
✅ No CSRF risk - read-only GET requests
✅ API key properly stored in environment variables
✅ No sensitive data exposed to frontend beyond what's already public (NFT metadata)

### Benefits
- ✅ Newly minted packs appear immediately without waiting for Alchemy indexing
- ✅ More reliable data source (Vibe Market knows about packs instantly)
- ✅ Graceful fallback if Vibe Market API is unavailable
- ✅ No breaking changes to existing UI/UX
- ✅ Minimal code changes (added ~40 lines total)
