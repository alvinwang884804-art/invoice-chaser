import { getDb } from "./index";
import { Client } from "./schema";
import { newId } from "../ids";

export function getAllClients(): Client[] {
  return getDb()
    .prepare("SELECT * FROM Client ORDER BY name ASC")
    .all() as Client[];
}

export function getClientById(id: string): Client | null {
  return (
    (getDb().prepare("SELECT * FROM Client WHERE id = ?").get(id) as Client) ??
    null
  );
}

export function createClient(
  data: Omit<Client, "id" | "createdAt">
): Client {
  const id = newId();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO Client (id, name, email, phone, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, data.name, data.email ?? null, data.phone ?? null, data.notes ?? null, now);
  return getClientById(id)!;
}

export function updateClient(
  id: string,
  data: Partial<Omit<Client, "id" | "createdAt">>
): Client | null {
  const client = getClientById(id);
  if (!client) return null;

  const updated = { ...client, ...data };
  getDb()
    .prepare(
      `UPDATE Client SET name=?, email=?, phone=?, notes=? WHERE id=?`
    )
    .run(updated.name, updated.email ?? null, updated.phone ?? null, updated.notes ?? null, id);
  return getClientById(id)!;
}

export function deleteClient(id: string): boolean {
  const result = getDb()
    .prepare("DELETE FROM Client WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

/** Total outstanding (unpaid balance) for a client across all their invoices. */
export function clientOutstandingCents(clientId: string): number {
  const row = getDb()
    .prepare(
      `SELECT
         SUM(i.amountCents) - COALESCE(SUM(p.amountCents), 0) as outstanding
       FROM Invoice i
       LEFT JOIN Payment p ON p.invoiceId = i.id
       WHERE i.clientId = ? AND i.status != 'paid'`
    )
    .get(clientId) as { outstanding: number | null };
  return row.outstanding ?? 0;
}
