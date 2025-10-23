import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <span className="text-white font-bold text-4xl">₿</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SatoshiSplit
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
          Cross-Chain Expense Splitting with Unified Balances
        </p>

        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Split expenses with friends across multiple blockchains. Seamlessly
          bridge tokens and settle debts using Avail Nexus SDK.
        </p>

        <div className="max-w-4xl mx-auto mt-24 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Built With
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              'Hardhat 3',
              'Envio',
              'Avail Nexus SDK',
              'RainbowKit',
              'Wagmi',
              'Next.js 15',
            ].map((tech) => (
              <span
                key={tech}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started →
            </Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Multi-Chain Support
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Split expenses across Sepolia, Optimism, Base, Arbitrum, and more
            testnets with unified balances.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Smart Debt Tracking
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically calculate equal splits and track who owes what with
            on-chain transparency.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Secure & Decentralized
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Built on smart contracts with Hardhat 3. No centralized servers,
            full transparency.
          </p>
        </div>
      </div>
    </div>
  );
}
