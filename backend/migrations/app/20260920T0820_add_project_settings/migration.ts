#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/633fe3119f5905d6b9b1f8144bcd872e60ea3f1ad913565150e116d1ab1f21aa/contract';
import startContract from '../../snapshots/633fe3119f5905d6b9b1f8144bcd872e60ea3f1ad913565150e116d1ab1f21aa/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b5bedaf442300aeb087be6591eb15c0eeffe8d52567883e751f5203397ea456d/contract';
import endContract from '../../snapshots/b5bedaf442300aeb087be6591eb15c0eeffe8d52567883e751f5203397ea456d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'projectSettings',
        columns: [
          col('brandName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('defaultAspectRatio', 'text', {
            notNull: true,
            default: lit('9:16'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('defaultDuration', 'int4', {
            notNull: true,
            default: lit(10),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'projectSettings',
        constraint: 'projectSettings_projectId_key',
        columns: ['projectId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'projectSettings',
        foreignKey: {
          name: 'projectSettings_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'project', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
