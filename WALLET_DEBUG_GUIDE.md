# Wallet Connection Debug Guide

## Current Issue Analysis

The wallet modal is showing "Freighter Wallet Not Found" which indicates:

1. **Freighter Extension**: Not installed OR not detected properly
2. **Detection Logic**: May need improvement for proper wallet state management

## Debug Steps

### Step 1: Check Freighter Installation
1. Open browser and go to Chrome Extensions (`chrome://extensions/`)
2. Look for "Freighter" extension
3. If not installed, install from: https://www.freighter.app/

### Step 2: Test Wallet Detection
Open browser console (F12) and run:
```javascript
// Check if Freighter API is available
console.log('Freighter API:', window.freighterApi);
console.log('Freighter available:', !!window.freighterApi);

// Test detection
if (window.freighterApi) {
  window.freighterApi.isConnected().then(connected => {
    console.log('Is connected:', connected);
  });
}
```

### Step 3: Monitor Debug Logs
With the updated code, check browser console for these logs:
- `requireWalletWithModal called` - Shows when wallet check happens
- `Wallet already connected, returning true` - Should appear after first connection
- `handleEarnTokens called` - Shows current wallet state when clicking buttons
- `Executing pending action` - Shows when pending actions execute

## Expected Flow (After Fix)

### First Time:
1. Click "Earn Tokens" → Console: `requireWalletWithModal called - isConnected: false`
2. Modal appears → Install/Connect Freighter
3. Modal closes → Console: `Wallet already connected, returning true`
4. Console: `Executing pending action: earnTokens`

### Subsequent Times:
1. Click "Earn Tokens" → Console: `Wallet already connected, returning true`
2. Action proceeds immediately (no modal)

## Quick Fix if Freighter is Installed

If Freighter is installed but not detected:

1. **Refresh the page** - Sometimes extension needs reload
2. **Check extension is enabled** - Verify in Chrome extensions
3. **Try different browser** - Test in Chrome/Brave
4. **Clear browser cache** - Reset extension state

## Code Changes Made

1. **Enhanced Detection**: Better Freighter installation checking
2. **Debug Logging**: Console logs to track wallet state
3. **Immediate Check**: Wallet address check before showing modal
4. **Auto-Close**: Modal closes when wallet connects

The key fix is that now the code checks `if (address)` FIRST before showing the modal, so once connected, it should never show the modal again.
