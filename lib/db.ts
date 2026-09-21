import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { randomUUID } from "node:crypto";

const defaultConfig = {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "prepwise",
};

let pool: mysql.Pool | null = null;

function parseJsonArray<T>(value: string | null | undefined): T[] {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function getConnectionConfig() {
    return defaultConfig;
}

export async function ensureDatabaseReady() {
    const config = await getConnectionConfig();

    try {
        const adminPool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        await adminPool.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
        await adminPool.end();

        pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

        await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sessions_user_id (user_id),
      INDEX idx_sessions_token (token)
    )
  `);

        await pool.execute(`
    CREATE TABLE IF NOT EXISTS interviews (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      role VARCHAR(255) NOT NULL,
      level VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      techstack JSON NOT NULL,
      questions JSON NOT NULL,
      finalized BOOLEAN NOT NULL DEFAULT FALSE,
      cover_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_interviews_user_id (user_id),
      INDEX idx_interviews_finalized (finalized)
    )
  `);

        await pool.execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id VARCHAR(36) PRIMARY KEY,
      interview_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      total_score INT NOT NULL,
      category_scores JSON NOT NULL,
      strengths JSON NOT NULL,
      areas_for_improvement JSON NOT NULL,
      final_assessment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_feedback_interview_id (interview_id),
      INDEX idx_feedback_user_id (user_id)
    )
  `);

        return pool;
    } catch (error: any) {
        const message =
            error?.message || "Unknown MySQL error";

        throw new Error(
            `MySQL connection failed. Check that your local MySQL server is running and update MYSQL_USER / MYSQL_PASSWORD in .env.local. Current values: user='${config.user}', database='${config.database}'. Original error: ${message}`
        );
    }
}

export async function getDatabasePool() {
    if (!pool) {
        return ensureDatabaseReady();
    }

    return pool;
}

export async function createUser(params: {
    name: string;
    email: string;
    passwordHash: string;
}) {
    const db = await getDatabasePool();
    const id = randomUUID();

    await db.execute<ResultSetHeader>(
        "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())",
        [id, params.name, params.email, params.passwordHash]
    );

    return { id, name: params.name, email: params.email };
}

export async function findUserByEmail(email: string) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [email]
    );

    if (!rows.length) return null;

    const row = rows[0];
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
    };
}

export async function findUserById(id: string) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE id = ? LIMIT 1",
        [id]
    );

    if (!rows.length) return null;

    const row = rows[0];
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
    };
}

export async function createSession(userId: string, token: string) {
    const db = await getDatabasePool();
    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);
    const mysqlExpiresAt = expiresAt
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    await db.execute<ResultSetHeader>(
        "INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())",
        [randomUUID(), userId, token, mysqlExpiresAt]
    );
}

export async function getSessionByToken(token: string) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1",
        [token]
    );

    if (!rows.length) return null;

    return {
        id: rows[0].id,
        userId: rows[0].user_id,
        token: rows[0].token,
        expiresAt: rows[0].expires_at,
    };
}

export async function deleteSessionByToken(token: string) {
    const db = await getDatabasePool();
    await db.execute("DELETE FROM sessions WHERE token = ?", [token]);
}

export async function interview(params: {
    userId: string;
    role: string;
    level: string;
    type: string;
    techstack: string[];
    questions: string[];
    finalized: boolean;
    coverImage: string;
}) {
    const db = await getDatabasePool();
    const id = randomUUID();

    await db.execute<ResultSetHeader>(
        "INSERT INTO interviews (id, user_id, role, level, type, techstack, questions, finalized, cover_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [
            id,
            params.userId,
            params.role,
            params.level,
            params.type,
            JSON.stringify(params.techstack),
            JSON.stringify(params.questions),
            params.finalized ? 1 : 0,
            params.coverImage,
        ]
    );

    return { id };
}

export async function getInterviewById(id: string) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM interviews WHERE id = ? LIMIT 1",
        [id]
    );

    if (!rows.length) return null;

    const row = rows[0];
    return {
        id: row.id,
        role: row.role,
        level: row.level,
        type: row.type,
        techstack: parseJsonArray<string>(row.techstack),
        questions: parseJsonArray<string>(row.questions),
        userId: row.user_id,
        finalized: Boolean(row.finalized),
        coverImage: row.cover_image,
        createdAt: row.created_at,
    };
}

export async function getInterviewsByUserId(userId: string) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
    );

    return rows.map((row) => ({
        id: row.id,
        role: row.role,
        level: row.level,
        type: row.type,
        techstack: parseJsonArray<string>(row.techstack),
        questions: parseJsonArray<string>(row.questions),
        userId: row.user_id,
        finalized: Boolean(row.finalized),
        coverImage: row.cover_image,
        createdAt: row.created_at,
    }));
}

export async function getLatestInterviews(userId: string, limit = 20) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM interviews WHERE finalized = TRUE AND user_id != ? ORDER BY created_at DESC LIMIT ?",
        [userId, limit]
    );

    return rows.map((row) => ({
        id: row.id,
        role: row.role,
        level: row.level,
        type: row.type,
        techstack: parseJsonArray<string>(row.techstack),
        questions: parseJsonArray<string>(row.questions),
        userId: row.user_id,
        finalized: Boolean(row.finalized),
        coverImage: row.cover_image,
        createdAt: row.created_at,
    }));
}

export async function createFeedback(params: {
    interviewId: string;
    userId: string;
    totalScore: number;
    categoryScores: Array<{ name: string; score: number; comment: string }>;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
}) {
    const db = await getDatabasePool();
    const id = randomUUID();

    await db.execute<ResultSetHeader>(
        "INSERT INTO feedback (id, interview_id, user_id, total_score, category_scores, strengths, areas_for_improvement, final_assessment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [
            id,
            params.interviewId,
            params.userId,
            params.totalScore,
            JSON.stringify(params.categoryScores),
            JSON.stringify(params.strengths),
            JSON.stringify(params.areasForImprovement),
            params.finalAssessment,
        ]
    );

    return { id };
}

export async function getFeedbackByInterviewId(interviewId: string, userId: string) {
    const db = await getDatabasePool();
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM feedback WHERE interview_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1",
        [interviewId, userId]
    );

    if (!rows.length) return null;

    const row = rows[0];
    return {
        id: row.id,
        interviewId: row.interview_id,
        userId: row.user_id,
        totalScore: row.total_score,
        categoryScores: parseJsonArray<{ name: string; score: number; comment: string }>(row.category_scores),
        strengths: parseJsonArray<string>(row.strengths),
        areasForImprovement: parseJsonArray<string>(row.areas_for_improvement),
        finalAssessment: row.final_assessment,
        createdAt: row.created_at,
    };
}
