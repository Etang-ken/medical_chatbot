import { ChatOpenAI } from '@langchain/openai';
import { Prisma } from '@prisma/client';
import { SystemMessage, createAgent, tool } from 'langchain';
import * as z from 'zod';
import prisma from '../config/database.js';
import { config } from '../config/env.js';
import type { Message } from '../types/index.js';

const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0,
  openAIApiKey: config.openaiApiKey,
});

const DENY_RE = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE|COPY|INTO)\b/i;
const HAS_LIMIT_RE = /\blimit\b/i;
const OFFSET_TAIL_RE = /\boffset\b\s+(\d+)\s*$/i;

function sanitizeSqlQuery(q: unknown): string {
  let query = String(q ?? '').trim();
  const semis = [...query].filter((c) => c === ';').length;
  if (semis > 1 || (query.endsWith(';') && query.slice(0, -1).includes(';'))) {
    throw new Error('multiple statements are not allowed.');
  }
  query = query.replace(/;+\s*$/g, '').trim();

  const lower = query.toLowerCase();
  if (!(lower.startsWith('select') || lower.startsWith('with'))) {
    throw new Error('Only SELECT statements are allowed');
  }
  if (DENY_RE.test(query)) {
    throw new Error('DML/DDL detected. Only read-only queries are permitted.');
  }

  if (!HAS_LIMIT_RE.test(query)) {
    const offsetMatch = query.match(OFFSET_TAIL_RE);
    if (offsetMatch) {
      query = query.replace(OFFSET_TAIL_RE, `LIMIT 5 OFFSET ${offsetMatch[1]}`);
    } else {
      query += ' LIMIT 5';
    }
  }
  return query;
}

async function listTables(): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return rows.map((r) => r.table_name);
}

async function getTableSchema(tableName?: string): Promise<string> {
  const where = tableName
    ? Prisma.sql`AND table_name = ${tableName}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<
    Array<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>
  >(Prisma.sql`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ${where}
    ORDER BY table_name, ordinal_position
  `);

  const grouped = new Map<string, Array<{ column_name: string; data_type: string; is_nullable: string }>>();
  for (const r of rows) {
    if (!grouped.has(r.table_name)) grouped.set(r.table_name, []);
    grouped.get(r.table_name)!.push({
      column_name: r.column_name,
      data_type: r.data_type,
      is_nullable: r.is_nullable,
    });
  }

  const parts: string[] = [];
  for (const [t, cols] of grouped.entries()) {
    parts.push(`Table ${t}:`);
    for (const c of cols) {
      parts.push(`- ${c.column_name} (${c.data_type}, nullable=${c.is_nullable})`);
    }
    parts.push('');
  }
  return parts.join('\n').trim();
}

const listTablesTool = tool(
  async () => {
    const tables = await listTables();
    return JSON.stringify(tables, null, 2);
  },
  {
    name: 'list_tables',
    description: 'List available tables in the PostgreSQL database.',
    schema: z.object({}),
  }
);

const getTableSchemaTool = tool(
  async ({ tableName }) => {
    return await getTableSchema(tableName);
  },
  {
    name: 'get_table_schema',
    description: 'Get the schema for a given table (or all tables if omitted).',
    schema: z.object({
      tableName: z.string().optional().describe('Table name to fetch schema for'),
    }),
  }
);

const executeSqlTool = tool(
  async ({ query }) => {
    try {
      const q = sanitizeSqlQuery(query);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[execute_sql]', q);
      }

      const result = await prisma.$queryRawUnsafe(q);
      return JSON.stringify(result, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      return `Error: ${msg}`;
    }
  },
  {
    name: 'execute_sql',
    description: 'Execute a READ-ONLY PostgreSQL SELECT query and return results.',
    schema: z.object({
      query: z.string().describe('PostgreSQL SELECT query to execute (read-only).'),
    }),
  }
);

async function buildSystemPrompt(): Promise<SystemMessage> {
  const schema = await getTableSchema();
  return new SystemMessage(`You are Dr. Sarah, a sympathetic, professional medical assistant.

You MUST answer questions using ONLY information retrieved from the database via SQL.

Follow this procedure strictly:
1) Fetch available tables and schemas (use tools)
2) Decide which tables are relevant
3) Fetch schemas for relevant tables
4) Generate a SQL query based on the question and schema
5) Double-check the SQL for common mistakes
6) Execute the SQL and inspect the results
7) If the database returns an error, correct the SQL and retry (max 5 attempts)
8) Formulate the final response based on the SQL results

Rules:
- Use only tools: list_tables, get_table_schema, execute_sql
- Read-only only; no INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/REPLACE/TRUNCATE
- Prefer explicit column lists; avoid SELECT *
- Default to LIMIT 5 unless the user explicitly asks otherwise

Authoritative schema snapshot (do not invent columns/tables):
${schema}
`);
}

let agentPromise: Promise<any> | null = null;

async function getAgent(): Promise<any> {
  if (!agentPromise) {
    agentPromise = (async () => {
      const systemPrompt = await buildSystemPrompt();
      return createAgent({
        model,
        tools: [listTablesTool, getTableSchemaTool, executeSqlTool],
        systemPrompt,
      });
    })();
  }
  return agentPromise;
}

export async function generateAIResponse(
  userMessage: string,
  chatHistory: Message[]
): Promise<string> {
  try {
    const agent = await getAgent();

    const messages = [
      ...chatHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const stream = await agent.stream(
      { messages },
      { streamMode: 'values' }
    );

    let lastContent = '';
    for await (const step of stream) {
      const message = step?.messages?.at(-1);
      const content = message?.content;
      if (typeof content === 'string') {
        lastContent = content;
      } else if (content != null) {
        lastContent = JSON.stringify(content);
      }
    }

    return lastContent || 'No response generated.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}
