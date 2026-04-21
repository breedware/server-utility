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

export const fetchFromPg = async (param: FetchProcedureProps, firestoreDB: Firestore, dbInit: DBInit): Promise<any> => {
  try {

    // 1. Ensure Knex is ready
    const knex = getKnex(dbInit);
    
    // 2. Instantiate locally
    const db = new PgBaseModel(
       'public',
       'proc_db_fetcher',
       ["formData", "returnValue"],
       knex,
       firestoreDB
    );

    return await db.call({
      formData: { formData: param.formData },
      backups: param.firebaseBackups,
    });
    
  } catch (error) {
    logger.log("fetchFromPg Error: ", error);
    return false;
  }
};

// Move the class definition inside the function or make it highly resilient
export const saveToPg = async (param: ProcedureProps, firestoreDB: Firestore, dbInit: DBInit): Promise<any> => {
  try {
    // 1. Ensure Knex is ready
    const knex = getKnex(dbInit);
    
    // 2. Instantiate locally
    const db = new PgBaseModel(
       param.schema,
       param.procedure,
       ["formData", "returnValue"],
       knex,
       firestoreDB
    );

    return await db.call({
      formData: { formData: param.formData },
      backups: param.firebaseBackups,
    });

  } catch (error) {
    logger.error("saveToPg Runtime Error: ", error);
    return false;
  }
};