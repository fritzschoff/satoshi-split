import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          About SatoshiSplit
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
          Cross-Chain Expense Splitting for decentralized friends
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>For The Hackathon Judges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                With SatoshiSplit I wanted to build a dApp that actually helps
                you in a direct way. Its not another DEFI product that promises
                you 50% yield. Its a simple but effective dApp that makes things
                just easier for you and your friends. Plus it is free, no pay
                wall, no ads no BS.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GitHub Repository:{' '}
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  https://github.com/fritzschoff/satoshi-split
                </code>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Documentation: check out the README.md in the repository
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What is SatoshiSplit?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              Share your expesnes with your friends and dont worry about the
              math and the chains which your friends are on. The contract lives
              on Sepolia, but you can have your money on any chain you want and
              pay your debt with one button click. It also allows you to track
              your spending history and your friends' spending history. Also you
              can add or remove friends later on or add people later to an
              expense.
            </p>
            <p>
              Thanks to Envio for indexing all the events and lets you have a
              understading where you money went. Thanks to Hardhat and their
              Smart Contract development suite for making it easy to develop and
              deploy the contract. Thanks for Nexus Avail SDK for making it easy
              to bridge tokens across chains.
            </p>
          </CardContent>
        </Card>
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
                    friends' wallet addresses and choose a default token (ETH or
                    USDC).
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technologies Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
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
                  {['ETH', 'USDC'].map((token) => (
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
      </div>
    </div>
  );
}
