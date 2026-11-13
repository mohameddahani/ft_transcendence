// Offline regression checks for the transfer hook; no wallet, RPC or tokens are used.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const ts = require("typescript");
const ethers = require("ethers");
const source = fs.readFileSync(
  path.join(
    __dirname,
    "../src/components/marketplace/hooks/useTokenTransfer.ts",
  ),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;
const sender = ethers.Wallet.createRandom().address,
  recipient = ethers.Wallet.createRandom().address;
let states = [],
  index = 0,
  submissions = 0,
  refreshed = 0;
let balance = 10n ** 20n,
  actualSender = sender,
  failAfterSubmission = false;
const hash = "0x" + "a".repeat(64);
const react = {
  useState(initial) {
    const i = index++;
    if (!(i in states)) states[i] = initial;
    return [
      states[i],
      (value) => {
        states[i] = value;
      },
    ];
  },
  useRef(initial) {
    const i = index++;
    if (!(i in states)) states[i] = { current: initial };
    return states[i];
  },
};
const modules = {
  react,
  ethers: {
    ...ethers,
    Contract: function () {
      return { decimals: async () => 18, balanceOf: async () => balance };
    },
  },
  "@/lib/blockchain/contract": {
    CHAIN_ID: 11155111,
    CONTRACT_ADDRESS: recipient,
    GASLESS_ENABLED: true,
  },
  "@/lib/blockchain/gasless": {
    relayForwarderMethod: async (
      _provider,
      _signer,
      method,
      args,
      onSubmitted,
    ) => {
      submissions++;
      assert.equal(method, "transfer");
      assert.deepEqual(args, [recipient, 1250000000000000000n]);
      onSubmitted(hash);
      if (failAfterSubmission) throw new Error("Receipt timeout");
      return hash;
    },
  },
  "@/lib/blockchain/marketplace-errors": {
    parseError: (error) => error.message,
  },
  "react-toastify": { toast: { success() {} } },
};
const mod = { exports: {} };
vm.runInThisContext("(function(require,module,exports){" + js + "\n})")(
  (name) => {
    assert(name in modules, name);
    return modules[name];
  },
  mod,
  mod.exports,
);
const parse = mod.exports.parseTokenTransfer;
assert.equal(parse(recipient, "1.25", 18).units, 1250000000000000000n);
assert.equal(parse(recipient, ".5", 18).units, 500000000000000000n);
for (const amount of [
  "0",
  "-1",
  "1e3",
  "NaN",
  "1.0000000000000000001",
  "1,5",
  "",
])
  assert.throws(() => parse(recipient, amount, 18));
assert.throws(() => parse(ethers.ZeroAddress, "1", 18));
assert.throws(() => parse("not-a-wallet", "1", 18));
let receipt = null;
const options = {
  provider: {
    getNetwork: async () => ({ chainId: 11155111n }),
    getTransactionReceipt: async () => receipt,
  },
  signer: { getAddress: async () => actualSender },
  account: sender,
  chainId: 11155111,
  tokenDecimals: 18,
  refresh: async () => {
    refreshed++;
  },
};
function render() {
  index = 0;
  return mod.exports.useTokenTransfer(options);
}
function prepare() {
  let hook = render();
  hook.setRecipient(recipient);
  hook.setAmount("1.25");
  hook = render();
  hook.prepare();
  return render();
}
(async () => {
  let hook = prepare();
  assert(hook.review);
  await Promise.all([hook.send(), hook.send()]);
  hook = render();
  assert.equal(submissions, 1);
  assert.equal(refreshed, 1);
  assert.equal(hook.amount, "");
  assert.equal(hook.lastHash, hash);
  states = [];
  balance = 1n;
  hook = prepare();
  await hook.send();
  hook = render();
  assert.equal(submissions, 1);
  assert.match(hook.error, /enough G/);
  states = [];
  balance = 10n ** 20n;
  actualSender = recipient;
  hook = prepare();
  await hook.send();
  hook = render();
  assert.equal(submissions, 1);
  assert.match(hook.error, /wallet changed/);
  states = [];
  actualSender = sender;
  failAfterSubmission = true;
  hook = prepare();
  await hook.send();
  hook = render();
  assert.equal(submissions, 2);
  assert.equal(hook.pendingHash, hash);
  await hook.send();
  assert.equal(submissions, 2, "Pending transfer cannot be submitted again");
  await hook.checkStatus();
  hook = render();
  assert.match(hook.error, /still pending/);
  receipt = { status: 1 };
  await hook.checkStatus();
  hook = render();
  assert.equal(hook.pendingHash, null);
  assert.equal(hook.lastHash, hash);
  assert.equal(submissions, 2);
  states = [];
  options.chainId = 1;
  hook = prepare();
  assert.equal(hook.review, null);
  assert.match(hook.error, /Sepolia/);
  console.log(
    "PASS: exact token units, invalid amounts/addresses, balance/network/wallet checks, double-click guard, transfer-only signing and confirmation retry without resending.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
