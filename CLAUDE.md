# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

P2PMNEE is a React application that enables transferring MNEE tokens from address-based wallets to Metanet Desktop for identity-based payments. The app uses BSV blockchain technology and integrates with the BSV SDK for wallet functionality and peer-to-peer token transfers.

## Development Commands

- `npm run dev` - Start the development server using Vite
- `npm run build` - Build the project (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the built application

## Architecture

### Core Technologies
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (@mui/material) with Emotion for styling
- **Routing**: React Router DOM v7
- **BSV Integration**: @bsv/sdk for wallet operations and blockchain interactions
- **Peer Payments**: @bsv/message-box-client for P2P messaging

### Key Components

#### Wallet Context (`src/context/WalletContext.tsx`)
Central state management for:
- BSV WalletClient instance
- MNEE token balance and transaction management
- Peer-to-peer payment client integration
- Token display formatting (USD conversion at 1:100000 ratio)

#### Token Transfer System (`src/mnee/TokenTransfer.ts`)
Custom ScriptTemplate implementation for MNEE token transactions:
- Creates BSV-20 compliant locking scripts with inscription data
- Handles P2PKH + approver signature validation
- Implements BRC-29 pattern for wallet signature creation

#### Peer Payment Client (`src/p2p/MneePeerPayClient.ts`)
Extends MessageBoxClient for MNEE token transfers:
- Creates multi-input/output transactions with change handling
- Manages atomic BEEF transaction broadcasting
- Implements live payment listening via WebSockets
- Handles payment acceptance/rejection workflows

### Application Structure

#### Pages
- `/` - P2Identity: Main identity-based transfer interface
- `/address` - P2Address: Address-based transfer interface
- `/fund` - FundMetanet: Funding interface for Metanet Desktop
- `/tokens` - Token balance and transaction history

#### Token Management
- MNEE tokens stored in 'MNEE tokens' basket within BSV wallet
- Inscription parsing for BSV-20 token metadata extraction
- Multi-UTXO consolidation for transfers with automatic change calculation
- Fee structure: 100 units for small transfers, 1000 units for large transfers

### BSV Integration Details

#### Wallet Operations
- Uses @bsv/sdk WalletClient for all blockchain operations
- Implements custom instructions for BRC-29 key derivation
- Manages UTXO relinquishment and action internalization
- Supports both self and counterparty key generation

#### Message Box Integration
- Uses message box 'mnee_payment_inbox' for P2P communications
- Implements live payment streaming via WebSockets
- Atomic BEEF format for transaction packaging and transmission

### Environment Configuration
- Production MNEE API integration with token ID and approver constants
- Ngrok development proxy support configured in vite.config.ts
- Public API token for MNEE proxy service integration