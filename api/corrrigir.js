import OpenAI from 'openai';

// Configura o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { pergunta, resposta } = req.body;
    if (!pergunta || !resposta) {
      return res.status(400).json({ error: 'Os campos "pergunta" e "resposta" são obrigatórios.' });
    }

    const systemMessage = `Você é um professor assistente. Sua função é analisar a resposta de um aluno para uma pergunta, usando seu conhecimento para julgar a correção. Forneça um feedback construtivo e, no final, em uma nova linha, escreva "Nota:" seguido de uma nota de 0 a 10.`;
    const userMessage = `Pergunta: "${pergunta}"\n\nResposta do Aluno: "${resposta}"\n\nAvalie esta resposta.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
    });

    const correcaoCompleta = completion.choices[0].message.content;

    res.status(200).json({ resultado: correcaoCompleta });
  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    res.status(500).json({ error: 'Falha ao se comunicar com a IA da OpenAI.' });
  }
}
