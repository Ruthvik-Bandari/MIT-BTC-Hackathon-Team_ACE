import { SATS_PER_BTC } from "./constants";

export function satsToBtc(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8);
}

export function formatSats(sats: number): string {
  return new Intl.NumberFormat("en-US").format(sats);
}

export function formatBtc(sats: number): string {
  return `₿ ${satsToBtc(sats)}`;
}

export function truncateAddress(address: string, chars = 8): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return formatTimestamp(iso);
}
