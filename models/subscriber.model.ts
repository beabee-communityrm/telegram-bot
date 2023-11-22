import { Entity, PrimaryColumn, Column } from "typeorm";

/**
 * A subscriber is a telegram user who has subscribed to a callout.
 */
@Entity()
export class SubscriberModel {
    @PrimaryColumn()
    id!: number;

    @Column({ nullable: true })
    first_name!: string | null;

    @Column({ nullable: true })
    last_name!: string | null;

    @Column({ nullable: true })
    username!: string | null;

    @Column({ nullable: true })
    language_code!: string | null;

    @Column({ nullable: true })
    is_bot!: boolean | null;

    @Column({ type: String })
    anonymityStatus!: 'full' | 'partial' | 'none';
}