

type LogLevel = 'info' | 'warning' | 'error' | 'debug';

interface LogParams {
  functionName: string;
  message: string;
  level?: LogLevel;
  payload?: any;
  uid?: string | null;
  systemInfo: object;
  db: any;
  onError: (error: any)=>void;
}

export async function logToFirebase({
  functionName,
  message,
  level = 'info',
  payload = null,
  uid = null,
  systemInfo,
  db,
  onError
}: LogParams) {
  try {
    const timestamp = Date.now();
    const dateKey = new Date(timestamp).toISOString().split('T')[0];

    const logData = {
      functionName,
      message,
      level,
      payload,
      uid,
      timestamp,
      systemInfo
    };

    // const db = database();

    //  Log by date (global logs)
    const dateRef = db.ref(`logs/byDate/${dateKey}`).push();

    //  Log by uid (user-specific logs)
    const uidRef = uid
      ? db.ref(`logs/byUid/${uid}`).push()
      : null;

    const updates: any = {};
    updates[dateRef.toString().replace(db.ref().toString(), '')] = logData;

    if (uidRef) {
      updates[uidRef.toString().replace(db.ref().toString(), '')] = {
        functionName,
        message,
        level,
        payload,
        timestamp,
      };
    }

    await db.ref().update(updates);
  } catch (error) {
    // Prevent recursive logging
    onError(error);
  }
}
