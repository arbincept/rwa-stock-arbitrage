import { createPublicClient, http, parseAbi } from "viem";
import { bsc } from "viem/chains";

type Hex = `0x${string}`;

export const NATIVE_TOKEN: Hex = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const ERC20_ABI = parseAbi([
	"function balanceOf(address owner) view returns (uint256)",
	"function allowance(address owner, address spender) view returns (uint256)",
	"function approve(address spender, uint256 amount) returns (bool)",
]);

// Reads go through a public RPC so they work even if the wallet provider has limited method support.
export const publicClient = createPublicClient({
	chain: bsc,
	transport: http("https://bsc-dataseed.binance.org"),
});

export function isNativeToken(address: string): boolean {
	return address.toLowerCase() === NATIVE_TOKEN.toLowerCase();
}

export async function readBalance(token: Hex, owner: Hex): Promise<bigint> {
	if (isNativeToken(token)) {
		return publicClient.getBalance({ address: owner });
	}
	return publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "balanceOf", args: [owner] });
}

export async function readAllowance(token: Hex, owner: Hex, spender: Hex): Promise<bigint> {
	if (isNativeToken(token)) return 0n; // native BNB transfers never require an allowance
	return publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "allowance", args: [owner, spender] });
}
