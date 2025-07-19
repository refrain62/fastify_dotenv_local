// src/server.ts
import fastify, { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import path, { parse } from 'path';

// .env.local ファイルを読み込む
// path.resolve(__dirname, '..', '.env.local') は
// src/app.ts の親ディレクトリ（プロジェクトルート）にある .env.local を指定します。
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

// 環境変数の内容を変数に保持
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY;

// Fastifyサーバーのインスタンスを作成
// logger: true にするとリクエストのログがコンソールに表示されて便利
const server: FastifyInstance = fastify({ logger: true });

// ルートを定義(環境変数も出力)
server.get('/', async (request, reply) => {
  return { 
    message: 'Hello, Fastify with TypeScript! 👋',
    port: PORT,
    url: URL,
    // APIキーはセキュリティのために直接表示しない方が良いですが、ここでは例として出力
    apiKey: API_KEY
   };
});

// リクエストBodyの型を定義
interface ICreateUserBody {
  name: string;
  email: string;
}

// レスポンスの型を定義
interface IUserResponse {
  id: string;
  name: string;
  email: string;
}

// 型を指定してルートを定義
server.post<{ Body: ICreateUserBody, Reply: IUserResponse }>('/users', async (request, reply) => {
  // request.body は ICreateUserBody 型になっている！
  const { name, email } = request.body;

  console.log(`Creating user: ${name} (${email})`);

  // 本来はここでDBに保存などの処理を行う
  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
  };
  
  // 201 Created ステータスで、型定義されたレスポンスを返す
  reply.code(201).send(newUser);
});

// サーバーを起動
const start = async () => {
  try {
    await server.listen({ port: parseInt(PORT as string, 10) || 3000 });
    
    // サーバーが起動したらコンソールにメッセージを表示
    console.log(`Server listening on port ${PORT}`);
    console.log(`Database URL: ${URL}`);
    console.log(`API Key: ${API_KEY ? 'Loaded' : 'Not Loaded'}`); // セキュリティのためAPIキーは直接表示しない
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
