declare module 'oracledb' {
  // Namespace with types so `oracledb.Pool` works in type positions
  namespace oracledb {
    interface Pool {
      getConnection(): Promise<Connection>;
      close(graceful?: number): Promise<void>;
    }

    interface Connection {
      execute<T = any>(
        sql: string,
        binds?: Record<string, unknown> | unknown[],
        options?: ExecuteOptions
      ): Promise<{ rows?: T[] }>;
      close(): Promise<void>;
    }

    interface ExecuteOptions {
      outFormat?: number;
      maxRows?: number;
      fetchArraySize?: number;
    }

    const OUT_FORMAT_OBJECT: number;

    function createPool(opts: {
      user: string;
      password: string;
      connectString: string;
      poolMin?: number;
      poolMax?: number;
      poolTimeout?: number;
      homogeneous?: boolean;
    }): Promise<Pool>;
  }

  // The value exported by the module
  const oracledb: {
    createPool: typeof oracledb.createPool;
    OUT_FORMAT_OBJECT: typeof oracledb.OUT_FORMAT_OBJECT;
  };

  // CommonJS-style export to support default import with esModuleInterop
  export = oracledb;
}