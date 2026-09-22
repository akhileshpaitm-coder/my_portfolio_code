import "server-only";
import type { ReactNode } from "react";
import { getDb, getNativeDb, nextId } from "@/lib/db";
import {
  AboutParagraph as AboutParagraphEntity,
  CoreValue as CoreValueEntity,
} from "@/lib/entities";

export interface AboutParagraph {
  id: number;
  body: string;
  /** Intro-style paragraph (larger, brighter) — mirrors the old hardcoded first paragraph. */
  emphasized: boolean;
  sort_order: number;
}

export interface CoreValue {
  id: number;
  /** Emoji shown before the title. */
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}

type AboutParagraphStored = AboutParagraph & { _id?: unknown };
type CoreValueStored = CoreValue & { _id?: unknown };

/* ─────────────────────────────────────────────
 * Paragraphs
 * ───────────────────────────────────────────── */

export async function getAboutParagraphs(): Promise<AboutParagraph[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection<AboutParagraphStored>("about_paragraphs")
    .find(
      {},
      { projection: { _id: 0, id: 1, body: 1, emphasized: 1, sort_order: 1 } }
    )
    .sort({ sort_order: 1, id: 1 })
    .toArray();
  return rows;
}

export async function getAboutParagraphById(id: number): Promise<AboutParagraph | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<AboutParagraphStored>("about_paragraphs")
    .findOne(
      { id },
      { projection: { _id: 0, id: 1, body: 1, emphasized: 1, sort_order: 1 } }
    );
  return row ?? null;
}

export async function createAboutParagraph(input: {
  body: string;
  emphasized: boolean;
  sort_order: number;
}): Promise<number> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(AboutParagraphEntity);
  const id = await nextId("about_paragraphs");
  const now = new Date();
  await repo.insertOne({
    id,
    body: input.body,
    emphasized: input.emphasized,
    sort_order: input.sort_order,
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateAboutParagraph(
  id: number,
  input: { body: string; emphasized: boolean; sort_order: number }
): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(AboutParagraphEntity);
  const result = await repo.updateMany(
    { id },
    {
      $set: {
        body: input.body,
        emphasized: input.emphasized,
        sort_order: input.sort_order,
        updated_at: new Date(),
      },
    }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteAboutParagraph(id: number): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(AboutParagraphEntity);
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function nextAboutParagraphSortOrder(): Promise<number> {
  const db = await getNativeDb();
  const rows = await db
    .collection("about_paragraphs")
    .aggregate<{ max: number | null }>([
      { $group: { _id: null, max: { $max: "$sort_order" } } },
    ])
    .toArray();
  const max = rows[0]?.max ?? 0;
  return max + 1;
}

/* ─────────────────────────────────────────────
 * Core values
 * ───────────────────────────────────────────── */

export async function getCoreValues(): Promise<CoreValue[]> {
  const db = await getNativeDb();
  const rows = await db
    .collection<CoreValueStored>("core_values")
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          icon: 1,
          title: 1,
          description: 1,
          sort_order: 1,
        },
      }
    )
    .sort({ sort_order: 1, id: 1 })
    .toArray();
  return rows;
}

export async function getCoreValueById(id: number): Promise<CoreValue | null> {
  const db = await getNativeDb();
  const row = await db
    .collection<CoreValueStored>("core_values")
    .findOne(
      { id },
      {
        projection: {
          _id: 0,
          id: 1,
          icon: 1,
          title: 1,
          description: 1,
          sort_order: 1,
        },
      }
    );
  return row ?? null;
}

export async function createCoreValue(input: {
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}): Promise<number> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(CoreValueEntity);
  const id = await nextId("core_values");
  const now = new Date();
  await repo.insertOne({
    id,
    icon: input.icon,
    title: input.title,
    description: input.description,
    sort_order: input.sort_order,
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function updateCoreValue(
  id: number,
  input: { icon: string; title: string; description: string; sort_order: number }
): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(CoreValueEntity);
  const result = await repo.updateMany(
    { id },
    {
      $set: {
        icon: input.icon,
        title: input.title,
        description: input.description,
        sort_order: input.sort_order,
        updated_at: new Date(),
      },
    }
  );
  return (result.modifiedCount ?? 0) > 0;
}

export async function deleteCoreValue(id: number): Promise<boolean> {
  const ds = await getDb();
  const repo = ds.getMongoRepository(CoreValueEntity);
  const result = await repo.deleteMany({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function nextCoreValueSortOrder(): Promise<number> {
  const db = await getNativeDb();
  const rows = await db
    .collection("core_values")
    .aggregate<{ max: number | null }>([
      { $group: { _id: null, max: { $max: "$sort_order" } } },
    ])
    .toArray();
  const max = rows[0]?.max ?? 0;
  return max + 1;
}

/* ─────────────────────────────────────────────
 * Inline markup → JSX
 * ───────────────────────────────────────────── */

/**
 * Render the paragraph markup understood by the admin form:
 *   **text**  → semibold white highlight
 *   ==text==  → cyan highlight
 *   *text*    → soft white emphasis
 * Plain text is escaped by React — raw HTML is never injected.
 */
export function renderInlineMarkup(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|==([^=]+)==|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-zinc-100">
          {m[1]}
        </strong>
      );
    } else if (m[2] !== undefined) {
      nodes.push(
        <span key={key++} className="text-cyan-300">
          {m[2]}
        </span>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <span key={key++} className="text-zinc-200">
          {m[3]}
        </span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
