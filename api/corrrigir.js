// Importa a biblioteca da OpenAI
import OpenAI from 'openai';

// Inicializa o cliente da OpenAI com a chave de API que estará nas "Environment Variables" da Vercel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// A função handler é o padrão da Vercel para uma função serverless
export default async function handler(req, res) {
  // Garante que a requisição seja do tipo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { pergunta, resposta } = req.body;

    if (!pergunta || !resposta) {
      return res.status(400).json({ error: 'Os campos "pergunta" e "resposta" são obrigatórios.' });
    }

    const systemMessage = `
      Você é um avaliador especialista e um professor didático.
      Sua função é analisar uma resposta de aluno com base em uma pergunta fornecida, usando seu vasto conhecimento geral para julgar a correção.
      Siga estas regras:
      1. Avalie a precisão e a completude da resposta.
      2. Forneça um feedback construtivo, explicando os pontos corretos e incorretos.
      3. Se a resposta estiver errada ou incompleta, forneça a informação correta.
      4. No final, em uma nova linha, escreva "Nota:" seguido de uma nota de 0 a 10.
    `;

    const userMessage = `
      Pergunta: "${pergunta}"
      Resposta do Aluno: "${resposta}"
      Por favor, avalie esta resposta.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
    });

    const correcaoCompleta = completion.choices[0].message.content;

    // Retorna a resposta com sucesso
    return res.status(200).json({ resultado: correcaoCompleta });

  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    return res.status(500).json({ error: 'Ocorreu um erro ao se comunicar com a IA.' });
  }
}
