/**
 * Simple cuid-like ID generator that works without external dependencies.
 * Uses crypto.randomUUID() (available in Node 14.17+ and all modern browsers).
 */

import { randomUUID } from "crypto";

export function newId(): string {
  return randomUUID();
}
