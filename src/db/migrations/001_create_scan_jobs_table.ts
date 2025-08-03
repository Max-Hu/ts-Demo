import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('scan_jobs', (table) => {
    table.uuid('id').primary();
    table.string('jenkins_job_id').nullable();
    table.enum('scan_type', ['SAST', 'FOSS', 'DAST']).notNullable();
    table.enum('status', ['pending', 'running', 'completed', 'failed']).notNullable();
    table.json('parameters').notNullable();
    table.string('report_url').nullable();
    table.text('summary').nullable();
    table.json('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    
    // Indexes
    table.index(['jenkins_job_id']);
    table.index(['status']);
    table.index(['scan_type']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('scan_jobs');
} 