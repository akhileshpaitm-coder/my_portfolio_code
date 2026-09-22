import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Contact form submissions (dashboard-managed history for /contact).
 * Mirrors the old MySQL `contact_messages` table.
 */
@Entity("contact_messages")
export class ContactMessage {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  @Column({ type: "string", name: "name" })
  name!: string;

  @Column({ type: "string", name: "email" })
  email!: string;

  @Column({ type: "string", name: "subject" })
  subject!: string;

  @Column({ type: "string", name: "message" })
  message!: string;

  @Column({ type: "string", name: "status" })
  status!: "new" | "read" | "replied";

  /**
   * Message-ID of the visitor's contact email — anchors the reply thread.
   */
  @Column({ type: "string", name: "email_message_id", nullable: true })
  email_message_id!: string | null;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;

  @Column({ type: "date", name: "updated_at" })
  updated_at!: Date;
}
