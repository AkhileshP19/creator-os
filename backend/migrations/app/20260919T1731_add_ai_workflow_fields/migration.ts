#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/633fe3119f5905d6b9b1f8144bcd872e60ea3f1ad913565150e116d1ab1f21aa/contract';
import endContract from '../../snapshots/633fe3119f5905d6b9b1f8144bcd872e60ea3f1ad913565150e116d1ab1f21aa/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dff93810729c3b4b697e1be983091afedd99cc73daae6064ab3d39934e786392/contract';
import startContract from '../../snapshots/dff93810729c3b4b697e1be983091afedd99cc73daae6064ab3d39934e786392/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'aIRequest',
        column: col('errorMessage', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIRequest',
        column: col('input', 'json', { codecRef: { codecId: 'pg/json@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIRequest',
        column: col('model', 'text', {
          notNull: true,
          default: lit('gemini-3.5-flash'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIRequest',
        column: col('output', 'json', { codecRef: { codecId: 'pg/json@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIRequest',
        column: col('provider', 'text', {
          notNull: true,
          default: lit('GEMINI'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIWorkflow',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIWorkflow',
        column: col('model', 'text', {
          notNull: true,
          default: lit('gemini-3.5-flash'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIWorkflow',
        column: col('provider', 'text', {
          notNull: true,
          default: lit('GEMINI'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'aIWorkflow',
        column: col('updatedAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'aIWorkflow',
        column: 'status',
        defaultSql: "DEFAULT 'QUEUED'",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'aIRequest',
        constraint: 'aIRequest_provider_check_76b212d5',
        expression: "\"provider\" IN ('GEMINI', 'OPENAI', 'CLAUDE', 'CUSTOM')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'aIWorkflow',
        constraint: 'aIWorkflow_provider_check_76b212d5',
        expression: "\"provider\" IN ('GEMINI', 'OPENAI', 'CLAUDE', 'CUSTOM')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'aIWorkflow',
        constraint: 'aIWorkflow_workflowType_check_2b9649b5',
        expression:
          "\"workflowType\" IN ('SCRIPT_GENERATION', 'VIDEO_GENERATION', 'AUDIO_GENERATION', 'IMAGE_GENERATION')",
      }),
      this.createIndex({
        schema: 'public',
        table: 'aIWorkflow',
        index: 'aIWorkflow_contentId_status_idx_9952abf4',
        columns: ['contentId', 'status'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
