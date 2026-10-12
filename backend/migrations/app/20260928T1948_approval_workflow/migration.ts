#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/37c7868863fc3424e32cd4d07a0dbed3ffce2abf69826af9a9944845a9625cfa/contract';
import endContract from '../../snapshots/37c7868863fc3424e32cd4d07a0dbed3ffce2abf69826af9a9944845a9625cfa/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b5bedaf442300aeb087be6591eb15c0eeffe8d52567883e751f5203397ea456d/contract';
import startContract from '../../snapshots/b5bedaf442300aeb087be6591eb15c0eeffe8d52567883e751f5203397ea456d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'approval',
        column: col('assetId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'approval',
        column: col('regenerationWorkflowId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'approval',
        column: col('reviewedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.dropNotNull({ schema: 'public', table: 'approval', column: 'reviewedById' }),
      this.addUnique({
        schema: 'public',
        table: 'approval',
        constraint: 'approval_assetId_key',
        columns: ['assetId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'approval',
        constraint: 'approval_regenerationWorkflowId_key',
        columns: ['regenerationWorkflowId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'approval',
        index: 'approval_decision_idx_cb87c9d6',
        columns: ['decision'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'approval',
        foreignKey: {
          name: 'approval_assetId_fkey',
          columns: ['assetId'],
          references: { schema: 'public', table: 'asset', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'approval',
        foreignKey: {
          name: 'approval_regenerationWorkflowId_fkey',
          columns: ['regenerationWorkflowId'],
          references: { schema: 'public', table: 'aIWorkflow', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
