import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Projects (dashboard-managed, shown on /projects and the homepage section).
 * Mirrors the old MySQL `projects` table. features/tech stay newline-
 * separated strings, exactly like the old TEXT columns.
 */
@Entity("projects")
export class Project {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "title" })
  title!: string;

  @Column({ type: "string", name: "description" })
  description!: string;

  @Column({ type: "string", name: "icon" })
  icon!: string;

  @Column({ type: "string", name: "color" })
  color!: string;

  /** One feature per line (newline-separated), as before. */
  @Column({ type: "string", name: "features", nullable: true })
  features!: string | null;

  /** One tech per line (newline-separated), as before. */
  @Column({ type: "string", name: "tech", nullable: true })
  tech!: string | null;

  @Column({ type: "string", name: "demo_url", nullable: true })
  demo_url!: string | null;

  @Column({ type: "string", name: "screenshot_url", nullable: true })
  screenshot_url!: string | null;

  @Column({ type: "string", name: "video_url", nullable: true })
  video_url!: string | null;

  @Column({ type: "string", name: "video_path", nullable: true })
  video_path!: string | null;

  @Column({ type: "int", name: "sort_order" })
  sort_order!: number;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
