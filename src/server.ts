// src/server.ts
import fastify, { FastifyInstance } from 'fastify';

// Fastifyサーバーのインスタンスを作成
// logger: true にするとリクエストのログがコンソールに表示されて便利
const server: FastifyInstance = fastify({ logger: true });

// ルートを定義
server.get('/', async (request, reply) => {
  return { message: 'Hello, Fastify with TypeScript! 👋' };
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
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
