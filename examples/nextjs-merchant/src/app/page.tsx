export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        PincerPay Next.js Merchant
      </h1>
      <p className="mt-3 text-gray-400">
        A minimal Next.js app with paywalled API routes using PincerPay.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Endpoints</h2>
        <div className="mt-4 space-y-3">
          <Endpoint
            method="GET"
            path="/api/health"
            price="Free"
            description="Health check"
          />
          <Endpoint
            method="GET"
            path="/api/weather"
            price="0.001 USDC"
            description="Current weather data"
          />
          <Endpoint
            method="GET"
            path="/api/joke"
            price="0.001 USDC"
            description="Random AI joke"
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Test with Agent SDK</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-relaxed">
          <code>{`import { PincerPayAgent } from "@pincerpay/agent";

const agent = await PincerPayAgent.create({
  chains: ["solana-devnet"],
  solanaPrivateKey: process.env.AGENT_SOLANA_KEY!,
});

const res = await agent.fetch("http://localhost:3000/api/weather");
console.log(await res.json());`}</code>
        </pre>
      </section>
    </main>
  );
}

function Endpoint({
  method,
  path,
  price,
  description,
}: {
  method: string;
  path: string;
  price: string;
  description: string;
}) {
  return (
    <div className="flex items-baseline gap-3 rounded-lg border border-gray-800 px-4 py-3">
      <span className="shrink-0 rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
        {method}
      </span>
      <code className="font-mono text-sm text-gray-200">{path}</code>
      <span className="ml-auto shrink-0 text-xs text-gray-500">
        {price}
      </span>
      <span className="hidden text-xs text-gray-600 sm:inline">
        {description}
      </span>
    </div>
  );
}
