import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda';
import { Client } from 'pg';
import jwt from 'jsonwebtoken'


const connectDb = async (): Promise<Client> => {
    const client = new Client({
        database: process.env.DATA_BASE,
        user: process.env.USER,
        host: process.env.HOST,
        password: process.env.PASSWORD,
        port: Number(process.env.PORT),
        ssl: true
    });
    await client.connect();
    return client;
}

const generateJwt = (id: string): string => {
    const sharedKey = process.env.SHARED_KEY || "";
    const algorithm = "HS256";
    return jwt.sign({ id }, sharedKey, { algorithm });
}

const getCpf = (event: any): string | null => {
    const requestBody = JSON.parse(event.body);
    const cpf = requestBody && requestBody.cpf;
    return cpf;
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
    const cpf = getCpf(event);

    if (!cpf) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "CPF não fornecido no corpo da solicitação." })
        };
    }

    const client = await connectDb();

    const result = await client.query(`SELECT id from clientes where cpf = $1`, [cpf]);

    if (result.rows.length === 0) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: "Cliente não encontrado." })
        };
    }
    const jwt = generateJwt(result.rows[0].id)

    return {
        statusCode: 200,
        body: JSON.stringify({jwt})
    };

};