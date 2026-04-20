import { PgBaseModel } from "firebase-admin-ql";
import { logger } from "firebase-functions";
import { Firestore } from "firebase-admin/firestore";

interface DBInit  {
    host: string;
    port: number;
    database: string;
    user: string
    password: string;
    ssl: boolean;
  };

let knexInstance: any = null;

// ✔️ Create Knex ONLY when needed (runtime)
function getKnex(param: DBInit) {
  if (!knexInstance) {
    // Dynamically require to ensure it doesn't break during discovery
    const knex = require("knex");

    // Use a try-catch to log EXACTLY what is missing during the Cloud Run boot
    try {
      const connectionConfig = {
        ...param,
        ssl: param.ssl ? { rejectUnauthorized: false } : undefined,
      };

      knexInstance = knex({
        client: "pg",
        pool: { min: 0, max: 5 },
        connection: connectionConfig,
      });
    } catch (e) {
      logger.error("Failed to initialize Knex. Check if Environment Variables are set:", e);
      throw e; // Rethrow so the function doesn't try to run in a broken state
    }
  }
  return knexInstance;
}

class BaseDb extends PgBaseModel {
  constructor(procedure: string, schema: string, firestoreDB: Firestore, init: DBInit) {
    const knex = getKnex(init);

    super(
      schema,
      procedure,
      ["formData", "returnValue"],
      knex,
      firestoreDB
    );
  }
}

interface ProcedureProps {
  procedure: string;
  schema: string;
  firebaseBackups?: {
    dbLabel: string;
    backupDb: string;
    whereKeys?: string | string[];
    firestorReference?: string;
  }[];
  formData: object;
}

interface FetchProcedureProps {
  firebaseBackups?: {
    dbLabel: string;
    backupDb: string;
    whereKeys?: string | string[];
    firestorReference?: string;
  }[];
  formData: object;
}

export const saveToPg = async (param: ProcedureProps, firestoreDB: Firestore, dbInit: DBInit): Promise<any> => {
  try {
    const db = new BaseDb(param.procedure, param.schema, firestoreDB, dbInit);
    const result = (await db.call({
      formData: { formData: param.formData },
      backups: param.firebaseBackups,
    })) as any;

    const { message, sqlstate, detail, hint, context } = result;
    logger.log(
      "message: ",
      message,
      " debug: ",
      result.debugger,
      " state: ",
      sqlstate,
      " details: ",
      detail,
      " hint: ",
      hint,
      " context: ",
      context
    );

    return result;
  } catch (error) {
    logger.log("saveToPg Error: ", error);
    return false;
  }
};

export const fetchFromPg = async (param: FetchProcedureProps, firestoreDB: Firestore, dbInit: DBInit): Promise<any> => {
  try {
    const db = new BaseDb('proc_db_fetcher', 'public', firestoreDB, dbInit);
    const result = (await db.call({
      formData: { formData: param.formData },
      backups: (param.formData as any).backups,
    })) as any;

    const { message, sqlstate, detail, hint, context, status, data } = result;
    logger.log(
      "message: ",
      message,
      " debug: ",
      result.debugger,
      " state: ",
      sqlstate,
      " details: ",
      detail,
      " hint: ",
      hint,
      " context: ",
      context
    );

    return {status, message, data};
  } catch (error) {
    logger.log("fetchFromPg Error: ", error);
    return false;
  }
};