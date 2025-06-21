# Wallet Connection Test Guide

## Testing the Single Wallet Connection Flow

### Test Scenario 1: Customer Dashboard
1. **Open Customer Dashboard**
2. **Click "Earn Tokens" button** - Wallet modal should appear
3. **Connect wallet** - Modal closes, token earning process starts
4. **Click "Scan QR Code"** - QR scanner opens directly (no wallet prompt)
5. **Click "Use" on any reward** - Reward redemption starts directly (no wallet prompt)
6. **Navigate to different tabs** - All actions work without wallet prompts

### Test Scenario 2: Business Dashboard  
1. **Open Business Dashboard**
2. **Click "Create Token" button** - Wallet modal should appear
3. **Connect wallet** - Modal closes, token creation dialog opens
4. **Close token creation dialog**
5. **Click "Distribute Tokens"** - Token distribution dialog opens directly (no wallet prompt)
6. **All subsequent actions** - Work without wallet prompts

### Test Scenario 3: Donation Dashboard
1. **Open Donation Dashboard**
2. **Click "Donate" on any campaign** - Wallet modal should appear  
3. **Connect wallet** - Modal closes, donation dialog opens
4. **Close donation dialog**
5. **Click "Donate" on another campaign** - Donation dialog opens directly (no wallet prompt)
6. **All subsequent actions** - Work without wallet prompts

### Expected Behavior
- ✅ **First action**: Shows wallet connection modal
- ✅ **After connection**: All subsequent actions work without prompting
- ✅ **Pending actions**: Queued actions execute automatically after connection
- ✅ **Session persistence**: Connection persists across different dashboard sections
- ✅ **English only**: All text is in English, no Turkish anywhere

### Key Implementation Features
1. **Smart Queuing**: Actions are queued when wallet not connected
2. **Auto-execution**: Pending actions execute automatically after connection
3. **State Management**: Wallet state is shared across all components
4. **User Experience**: Seamless flow without interruptions
5. **Error Handling**: Graceful handling of connection failures

### Code Pattern Used
```typescript
const handleAction = async () => {
  // Check wallet connection first
  const isWalletConnected = await requireWalletWithModal();
  if (!isWalletConnected) {
    // Modal was shown, set pending action to execute after wallet connects
    setPendingAction('actionType');
    setPendingActionData(actionData);
    return;
  }
  
  // Wallet is connected, proceed with action
  executeAction();
};

// Auto-execute pending actions when wallet connects
useEffect(() => {
  if (address && pendingAction) {
    // Execute the pending action now that wallet is connected
    executePendingAction();
    setPendingAction(null);
  }
}, [address, pendingAction]);
```

This pattern ensures a smooth, uninterrupted user experience with single wallet connection per session.
