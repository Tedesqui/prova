/*
 * FICHEIRO: /api/read-text-aws.js
 *
 * DESCRIÇÃO:
 * Este é o endpoint do backend que recebe a imagem do frontend,
 * envia-a para o AWS Textract para reconhecimento de texto e
 * devolve o texto extraído.
 * (ESTE FICHEIRO NÃO SOFREU ALTERAÇÕES)
 *
 * COMO CONFIGURAR:
 * 1. Instale o SDK da AWS: npm install @aws-sdk/client-textract
 * 2. Configure as suas variáveis de ambiente na sua plataforma de alojamento (Vercel, Netlify, etc.):
 * - AWS_ACCESS_KEY_ID: A sua chave de acesso da AWS.
 * - AWS_SECRET_ACCESS_KEY: A sua chave de acesso secreta da AWS.
 * - AWS_REGION: A região da AWS onde pretende usar o Textract (ex: 'us-east-1').
 */

// Importa o cliente do AWS Textract
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";

export default async function handler(req, res) {
  // Apenas permite pedidos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 1. Extrai os dados da imagem do corpo do pedido
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    // Remove o prefixo "data:image/jpeg;base64," para obter apenas os dados da imagem
    const base64Image = image.split(';base64,').pop();
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // 2. Configura o cliente do AWS Textract
    const client = new TextractClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // 3. Prepara o comando para enviar ao Textract
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer,
      },
    });

    // 4. Envia a imagem para o Textract e aguarda a resposta
    const data = await client.send(command);

    // 5. Processa a resposta para extrair e juntar o texto
    let extractedText = '';
    if (data.Blocks) {
      extractedText = data.Blocks
        .filter(block => block.BlockType === 'LINE') // Filtra apenas por linhas de texto
        .map(block => block.Text) // Pega o texto de cada bloco
        .join('\n'); // Junta as linhas com uma quebra de linha
    }

    // 6. Envia o texto extraído de volta para o frontend
    res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('Erro ao processar com o AWS Textract:', error);
    res.status(500).json({ error: 'Falha ao analisar a imagem.' });
  }
}


/*
 * FICHEIRO: /api/corrigir.js
 *
 * DESCRIÇÃO:
 * Este é o endpoint que recebe o texto (já extraído pelo Textract),
 * envia-o para a API da OpenAI (modelo gpt-4o) para correção
 * e devolve o resultado.
 *
 * COMO CONFIGURAR:
 * 1. Crie uma chave de API na sua conta da OpenAI.
 * 2. Configure a sua variável de ambiente na sua plataforma de alojamento:
 * - OPENAI_API_KEY: A sua chave de API da OpenAI.
 */
export async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { texto } = req.body;
        if (!texto) {
            return res.status(400).json({ error: 'Nenhum texto fornecido.' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        const payload = {
            model: "gpt-4o", // Pode usar outros modelos como "gpt-3.5-turbo"
            messages: [
                {
                    // A mensagem do sistema define o comportamento da IA
                    role: "system",
                    content: `Você é um assistente de correção de provas. Analise a resposta de um aluno. Forneça uma correção clara e construtiva. Se a resposta estiver correta, elogie o aluno. Se estiver incorreta ou incompleta, explique o que está errado e qual seria a resposta correta. Seja objetivo e educado.`
                },
                {
                    // A mensagem do utilizador contém o texto a ser analisado
                    role: "user",
                    content: `Por favor, corrija a seguinte resposta: "${texto}"`
                }
            ]
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Autenticação da OpenAI
            },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            console.error("Erro da API da OpenAI:", errorBody);
            throw new Error(errorBody.error.message || 'A API da OpenAI não conseguiu processar o pedido.');
        }

        const responseData = await apiResponse.json();
        
        // Extrai o texto da resposta da IA
        const resultado = responseData.choices[0].message.content;

        res.status(200).json({ resultado });

    } catch (error) {
        console.error('Erro no endpoint de correção:', error);
        res.status(500).json({ error: 'Falha ao obter a correção da IA.' });
    }
}
