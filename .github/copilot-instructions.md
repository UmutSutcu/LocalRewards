# Starnance - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a modern Stellar blockchain-based P2P freelance marketplace with escrow & reputation system featuring:

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Blockchain**: Stellar network with Soroban smart contracts
- **Authentication**: Passkey-based smart wallet integration
- **Paymaster**: Launchtube integration for gas sponsorship
- **Architecture**: Modular component-based design

## Code Style Guidelines

1. **TypeScript**: Use strict typing, avoid `any` when possible
2. **React**: Use functional components with hooks
3. **Styling**: TailwindCSS utility classes, custom components for reusability
4. **File Structure**: Follow the established folder conventions:
   - `src/components/` - Reusable UI components organized by feature
   - `src/services/` - API and blockchain service integrations
   - `src/hooks/` - Custom React hooks
   - `src/types/` - TypeScript type definitions
   - `src/utils/` - Helper functions

## Stellar/Blockchain Specific Guidelines

1. **Smart Contracts**: When working with Soroban contracts, use proper error handling
2. **Wallet Integration**: Always check wallet connection status before transactions
3. **Transaction Handling**: Include proper loading states and user feedback
4. **Network**: Default to testnet for development, make network configurable

## Component Guidelines

1. **Props**: Use TypeScript interfaces for component props
2. **State Management**: Use React hooks (useState, useEffect, etc.)
3. **Error Handling**: Include proper error boundaries and user-friendly error messages
4. **Loading States**: Always provide loading indicators for async operations
5. **Accessibility**: Include proper ARIA attributes and semantic HTML

## Naming Conventions

1. **Components**: PascalCase (e.g., `WalletConnect`, `TokenBalance`)
2. **Files**: Match component names, use kebab-case for utilities
3. **Functions**: camelCase, descriptive names
4. **Constants**: UPPER_SNAKE_CASE
5. **Types/Interfaces**: PascalCase with descriptive names

## Best Practices

1. **Performance**: Use React.memo for expensive components, implement proper key props
2. **Security**: Validate all user inputs, sanitize data from external sources
3. **User Experience**: Provide clear feedback for all user actions
4. **Testing**: Write unit tests for utilities and hooks
5. **Documentation**: Comment complex logic, especially blockchain interactions

## Architecture Notes

- The app supports both business and customer user types
- Passkey authentication replaces traditional private key management
- All transactions should include Launchtube paymaster for gas sponsorship
- Smart contracts handle token minting, burning, and transfers
- Off-chain backend stores metadata and facilitates complex business logic
