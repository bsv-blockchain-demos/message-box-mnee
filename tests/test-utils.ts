import { PrivateKey, ChainTracker, WalletInterface, CachedKeyDeriver } from '@bsv/sdk'
import { Wallet, WalletStorageManager, WalletSigner, Services, StorageKnex } from '@bsv/wallet-toolbox'
import { Knex, knex as makeKnex } from 'knex'
import { config } from 'dotenv'
config()

const PRIVATE_KEY: string = process.env.PRIVATE_KEY || '1'.repeat(64)

/**
 * Creates an in-memory SQLite database connection for testing
 */
function createInMemorySQLite(): Knex {
  const knexConfig: Knex.Config = {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true
  }
  return makeKnex(knexConfig)
}

/**
 * Creates a wallet instance with in-memory storage for testing
 * @param chain - The blockchain network ('test' or 'main')
 * @param privateKey - The root private key in hex format
 * @returns Promise resolving to a WalletInterface
 */
async function makeWallet(
  chain: 'test' | 'main' = 'main',
  privateKey: string = PRIVATE_KEY
): Promise<WalletInterface> {
  const rootKey = PrivateKey.fromHex(privateKey)
  const keyDeriver = new CachedKeyDeriver(rootKey)
  const identityKey = keyDeriver.identityKey

  // Create in-memory SQLite storage
  const knex = createInMemorySQLite()
  const storage = new StorageKnex({
    chain,
    knex,
    commissionSatoshis: 0,
    commissionPubKeyHex: undefined,
    feeModel: { model: 'sat/kb', value: 1 }
  })

  // Initialize storage
  await storage.migrate('test-wallet', identityKey)
  await storage.makeAvailable()

  // Create wallet storage manager
  const storageManager = new WalletStorageManager(identityKey, storage)
  await storageManager.makeAvailable()

  // Create wallet signer
  const signer = new WalletSigner(chain, keyDeriver, storageManager)

  // Create services
  const services = new Services(chain)

  // Create and return wallet
  const wallet = new Wallet(signer, services)

  return wallet
}

export const wallet = await makeWallet()

export class MockChain implements ChainTracker {
  mock: { blockheaders: string[] }

  constructor(mock: { blockheaders: string[] }) {
    this.mock = mock
  }

  addBlock(merkleRoot: string) {
    this.mock.blockheaders.push(merkleRoot)
  }

  async isValidRootForHeight(root: string, height: number): Promise<boolean> {
    return this.mock.blockheaders[height] === root
  }

  async currentHeight(): Promise<number> {
    return this.mock.blockheaders.length
  }
}

/**
 * Helper function to create a new wallet instance for testing
 * Useful when you need multiple wallets in a single test
 */
export async function createTestWallet(
  chain: 'test' | 'main' = 'main',
  privateKey?: string
): Promise<WalletInterface> {
  return makeWallet(chain, privateKey)
}
