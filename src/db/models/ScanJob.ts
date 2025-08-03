import { Model } from 'objection';
import { getDatabase } from '../connection';

// Register the database connection with Objection
Model.knex(getDatabase());

export interface IScanJob {
  id?: string;
  jenkinsJobId?: string;
  scanType: 'SAST' | 'FOSS' | 'DAST';
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  reportUrl?: string;
  summary?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export class ScanJob extends Model implements IScanJob {
  id!: string;
  jenkinsJobId?: string;
  scanType!: 'SAST' | 'FOSS' | 'DAST';
  status!: 'pending' | 'running' | 'completed' | 'failed';
  parameters!: Record<string, any>;
  reportUrl?: string;
  summary?: string;
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
  completedAt?: Date;

  static get tableName() {
    return 'scan_jobs';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['scanType', 'status', 'parameters'],
      properties: {
        id: { type: 'string' },
        jenkinsJobId: { type: ['string', 'null'] },
        scanType: { 
          type: 'string', 
          enum: ['SAST', 'FOSS', 'DAST'] 
        },
        status: { 
          type: 'string', 
          enum: ['pending', 'running', 'completed', 'failed'] 
        },
        parameters: { type: 'object' },
        reportUrl: { type: ['string', 'null'] },
        summary: { type: ['string', 'null'] },
        metadata: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: ['string', 'null'], format: 'date-time' }
      }
    };
  }

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }

  static getDatabase() {
    return getDatabase();
  }
} 