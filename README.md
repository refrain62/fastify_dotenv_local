# fastifyとdotenvでenv.localの内容を反映

## 1. 準備 📦
まず、必要なパッケージをインストールします。

- fastify: Fastify本体
- typescript: TypeScriptコンパイラ
- @types/node: Node.jsの型定義
- ts-node-dev: 開発用に、ファイルの変更を検知して自動で再起動してくれるツール

```
npm i fastify
npm i -D typescript @types/node ts-node-dev
```

## 2. tsconfig.jsonの設定
プロジェクトのルートに tsconfig.json ファイルを作成します。これはTypeScriptのコンパイル設定を定義するファイルです。

```
{
  "compilerOptions": {
    "target": "es2020",          /* コンパイル後のECMAScriptバージョン */
    "module": "commonjs",         /* モジュールシステム */
    "outDir": "./dist",           /* コンパイル後のファイル出力先 */
    "strict": true,               /* 厳格な型チェックを有効化 */
    "esModuleInterop": true,      /* ESモジュールとの相互運用性を向上 */
    "skipLibCheck": true,         /* 型定義ファイルのチェックをスキップ */
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]         /* コンパイル対象のファイル */
}
```

ポイント: include で src ディレクトリ配下をコンパイル対象としています。ソースコードは src ディレクトリに置くのが一般的です。

## 3. 基本的なサーバーの書き方
src/server.ts のようなファイルを作成し、サーバーを記述します。

FastifyInstance 型をインポートして使うことで、server オブジェクト自体にも型が適用されます。

```
// src/server.ts
import fastify, { FastifyInstance } from 'fastify';

// Fastifyサーバーのインスタンスを作成
// logger: true にするとリクエストのログがコンソールに表示されて便利
const server: FastifyInstance = fastify({ logger: true });

// ルートを定義
server.get('/', async (request, reply) => {
  return { message: 'Hello, Fastify with TypeScript! 👋' };
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
```

## 4. ルートに型を定義する (TypeScriptの真骨頂) ✨
Fastifyでは、リクエストのBody、Query、Params、Headersに簡単に型を定義できます。これにより、request オブジェクトから値を取り出す際に、型補完が効き、タイプミスを防げます。

ジェネリクスを使ってルートごとに型を指定するのが特徴です。

例: POSTリクエストのBodyに型を定義する
```
// src/server.ts (追記)

// ... (上記のコードの続き) ...

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

// ... (start()関数の呼び出し) ...
```

このように <{ Body: ICreateUserBody }> と指定するだけで、request.body が安全に型付けされます。

## 5. サーバーの実行
package.json にスクリプトを登録すると便利です。

```
// package.json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

開発時: 以下のコマンドを実行します。ファイルが変更されるたびにサーバーが自動で再起動します。

```
npm run dev
```

本番環境: まずTypeScriptをJavaScriptにコンパイルし、その結果生成されたJavaScriptファイルをNode.jsで実行します。

```
# 1. コンパイル (distディレクトリにJSファイルが生成される)
npm run build

# 2. 実行
npm run start
```


*****

## dotenvの導入
```
npm i dotenv
```

.env.localに設定
```
// .env.local
PORT=3002
#URL=http://localhost:3002
API_KEY=env_local_key
```

.envと.env.localの使い分けについて
一般的に、dotenvは以下の優先順位で環境変数を読み込みます（設定による）。

process.env（既に存在する環境変数）

.env.{NODE_ENV}.local (例: .env.development.local, .env.production.local)

.env.local

.env.{NODE_ENV} (例: .env.development, .env.production)

.env

.env: 全ての環境に共通のデフォルト値。通常はバージョン管理下に置かれません。

.env.local: ローカル開発環境でのみ使用する設定。.envよりも優先されます。これも通常はバージョン管理下に置きません。

.env.development, .env.production など: 特定の環境（開発環境、本番環境など）に合わせた設定。

この例では、dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });と明示的に指定することで、確実に.env.localを読み込むようにしています。本番環境では、環境変数はDockerやCI/CDパイプラインなどで直接設定することが多いため、.envファイルは利用しないのが一般的です。

## .env.development も読むように

※windowsも考慮して以下も必要
「'NODE_ENV' は、内部コマンドまたは外部コマンド、操作可能なプログラムまたはバッチ ファイルとして認識されていません。」になるので
```
npm install --save-dev cross-env
```

ファイルを作成
```
// .env.develpment
PORT=3001
URL=http://localhost:3001
API_KEY=env_development_key
```

package.jsonスクリプトの修正:
devスクリプトで「cross-env NODE_ENV=development」を設定します。

