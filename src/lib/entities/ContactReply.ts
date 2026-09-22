import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";

/**
 * Threaded reply history for contact messages.
 * Mirrors the old MySQL `contact_replies` table (message_id is a numeric
 * ContactMessage id; deletes of the parent message cascade in lib/contact).
 */
@Entity("contact_replies")
export class ContactReply {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column({ type: "int", name: "id" })
  id!: number;

  /** Numeric id of the parent ContactMessage. */
  @Column({ type: "int", name: "message_id" })
  message_id!: number;

  @Column({ type: "string", name: "subject" })
  subject!: string;

  @Column({ type: "string", name: "body" })
  body!: string;

  /** Message-ID of the sent reply email — extends the thread chain. */
  @Column({ type: "string", name: "email_message_id", nullable: true })
  email_message_id!: string | null;

  @Column({ type: "date", name: "created_at" })
  created_at!: Date;
}
