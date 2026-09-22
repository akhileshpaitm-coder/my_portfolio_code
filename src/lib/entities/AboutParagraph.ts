import type { Document } from "mongodb";
import { Entity, Column, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * About bio paragraphs (dashboard-managed, homepage section).
 * Mirrors the old MySQL `about_paragraphs` table.
 */
@Entity("about_paragraphs")
export class AboutParagraph {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "body" })
  body!: string;

  /** 1/0 = intro style (larger, brighter) — same semantics as the old TINYINT. */
  @Column({ type: "boolean", name: "emphasized" })
  emphasized!: boolean;

  @Column({ type: "int", name: "sort_order" })
  sort_order!: number;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}

export interface AboutParagraphStored extends Document, AboutParagraph {}
