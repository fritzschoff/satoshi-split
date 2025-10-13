import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          About SatoshiSplit
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
          Cross-Chain Expense Splitting for the Decentralized Web
        </p>

        {/* Project Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What is SatoshiSplit?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              SatoshiSplit is a decentralized application that brings the
              convenience of Splitwise to the blockchain era. Split expenses
              with friends across multiple chains while maintaining full
              transparency and control over your funds.
            </p>
            <p>
              Unlike traditional expense-splitting apps, SatoshiSplit leverages
              blockchain technology to create immutable records of all
              transactions, eliminates centralized intermediaries, and enables
              cross-chain settlements through Avail Nexus SDK.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Create a Split
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Connect your wallet and create a new split group. Add your
                    friends' wallet addresses and choose a default token (ETH,
                    USDC, or USDT).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center font-bold text-purple-600 dark:text-purple-400">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Add Expenses
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    When someone pays for a group expense, they record it
                    on-chain. Select which members participated (exclude those
                    who weren't there), and the smart contract automatically
                    calculates equal splits.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Settle Debts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    View your outstanding debts and pay them directly on-chain.
                    Nexus SDK enables you to bridge tokens from any supported
                    chain to settle your debts on Sepolia.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Track Everything
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Envio indexes all events across multiple chains, giving you
                    a complete view of your spending history, received payments,
                    and gas costs in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technologies Used */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technologies Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">⚡</span>
                  Hardhat 3
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Latest version of Hardhat for smart contract development,
                  testing with both Solidity and TypeScript tests, and
                  deployment with Hardhat Ignition.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400">
                    📊
                  </span>
                  Envio
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Multi-chain event indexing in real-time. Tracks all contract
                  events across Sepolia, Optimism, Base, Arbitrum, and more for
                  comprehensive activity tracking.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">🌉</span>
                  Avail Nexus SDK
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enables cross-chain token bridging and unified balance
                  management. Users can hold tokens on any supported chain and
                  seamlessly bridge them for debt settlement.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    🎨
                  </span>
                  RainbowKit & Next.js 15
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modern wallet connection with RainbowKit, server-side
                  rendering with Next.js 15, and responsive design with Tailwind
                  CSS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Chains & Tokens */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Supported Chains & Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Testnets Supported
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Sepolia',
                    'Optimism Sepolia',
                    'Base Sepolia',
                    'Arbitrum Sepolia',
                    'Polygon zkEVM Cardona',
                    'Avalanche Fuji',
                  ].map((chain) => (
                    <span
                      key={chain}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {chain}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Tokens Supported
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['ETH', 'USDC', 'USDT'].map((token) => (
                    <span
                      key={token}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-mono"
                    >
                      {token}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  All tokens are supported across chains via Avail Nexus SDK
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Architecture Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="space-y-3 text-sm font-mono">
                <div>
                  📱{' '}
                  <span className="text-blue-600 dark:text-blue-400">
                    Frontend (Next.js + RainbowKit)
                  </span>
                </div>
                <div className="ml-6">↓ User interactions</div>
                <div>
                  ⚡{' '}
                  <span className="text-purple-600 dark:text-purple-400">
                    Smart Contracts (Sepolia)
                  </span>
                </div>
                <div className="ml-6">↓ Emit events</div>
                <div>
                  📊{' '}
                  <span className="text-green-600 dark:text-green-400">
                    Envio Indexer (Multi-chain)
                  </span>
                </div>
                <div className="ml-6">↓ Query data</div>
                <div>
                  💾{' '}
                  <span className="text-orange-600 dark:text-orange-400">
                    GraphQL API
                  </span>
                </div>
                <div className="ml-6">↓ Display on UI</div>
                <div>
                  🎯{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Dashboard & Analytics
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              All components work together to provide a seamless cross-chain
              expense splitting experience with real-time updates and
              comprehensive tracking.
            </p>
          </CardContent>
        </Card>

        {/* For Judges */}
        <Card>
          <CardHeader>
            <CardTitle>For Hackathon Judges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Key Innovation
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                SatoshiSplit demonstrates practical use of cross-chain
                infrastructure (Avail Nexus) combined with comprehensive event
                indexing (Envio) to solve a real-world problem (expense
                splitting) in a decentralized manner.
              </p>
            </div>

            <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
              <p>
                <strong>✅ Complete Implementation:</strong> Full-stack dApp
                with smart contracts, tests, indexer, and responsive UI
              </p>
              <p>
                <strong>✅ Multi-Chain:</strong> Supports 6+ testnets with
                unified balance management
              </p>
              <p>
                <strong>✅ Production-Ready:</strong> Comprehensive test
                coverage (Solidity + TypeScript)
              </p>
              <p>
                <strong>✅ User Experience:</strong> Server-side rendering,
                wallet state persistence, intuitive interface
              </p>
              <p>
                <strong>✅ Real-Time Data:</strong> Envio indexing provides
                instant updates across all chains
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📂 GitHub Repository:{' '}
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  satoshi-split/
                </code>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                📝 Documentation: Complete README with setup instructions in the
                repository
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
