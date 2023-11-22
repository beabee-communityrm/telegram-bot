import { DataTypes, Model, } from "denodb/mod.ts";

import type { SubscriberFields } from '../types/index.ts';

/**
 * A subscriber is a telegram user who has subscribed to a callout.
 * @see https://eveningkid.com/denodb-docs/docs/guides/create-models
 */
export class SubscriberModel extends Model {
  static table = 'subscribers';
  static timestamps = true;

  static fields: SubscriberFields = {
    id: { primaryKey: true, type: DataTypes.INTEGER, autoIncrement: false },
    type: { type: DataTypes.STRING, allowNull: true },
    first_name: { type: DataTypes.STRING, allowNull: true },
    last_name: { type: DataTypes.STRING, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: true },
    language_code: { type: DataTypes.STRING, allowNull: true },
    is_bot: { type: DataTypes.BOOLEAN, allowNull: true },
    anonymityStatus: DataTypes.enum(['full', 'partial', 'none'])
  };

  static defaults = {
    anonymityStatus: 'full',
  };
}