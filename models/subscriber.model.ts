import { DataTypes, Model, } from 'denodb';

import type { SubscriberFields } from '../types/index.ts';

// See https://eveningkid.com/denodb-docs/docs/guides/create-models
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