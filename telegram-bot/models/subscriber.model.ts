import { Entity, PrimaryColumn, Column } from "npm:typeorm";

/**
 * A subscriber is a telegram user who has subscribed to a callout.
 */
@Entity()
export class SubscriberModel {
    @PrimaryColumn()
    id!: number;

    @Column({ type: String, nullable: true })
    first_name!: string | null;

    @Column({ type: String, nullable: true })
    last_name!: string | null;

    @Column({ type: String, nullable: true })
    username!: string | null;

    @Column({ type: String, nullable: true })
    language_code!: string | null;

    @Column({ type: String, nullable: true })
    is_bot!: boolean | null;

    @Column({ type: String })
    anonymityStatus!: 'full' | 'partial' | 'none';
}