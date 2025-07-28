import OpenAI from 'openai';

// Configura o cliente da OpenAI com a chave da Vercel Environment Variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- MUDANÇA AQUI ---
    // Agora recebemos apenas um campo "texto" do frontend.
    const { texto } = req.body;

    // Validação para o novo campo "texto".
    if (!texto || texto.trim() === '') {
      return res.status(400).json({ error: 'O campo "texto" não pode estar vazio.' });
    }

    // --- NOVO PROMPT ---
    // Instruímos a IA a ser um revisor geral.
    const systemMessage = `
      Você é um assistente de escrita e um revisor especialista. 
      Sua tarefa é analisar o texto fornecido, identificar e corrigir quaisquer erros gramaticais, ortográficos ou factuais.
      Seu objetivo é melhorar a clareza e a precisão do texto.

      Forneça uma resposta estruturada:
      1. Apresente o texto corrigido e aprimorado.
      2. Em seguida, adicione uma seção chamada "Principais Alterações" e liste de forma breve (em tópicos) as correções mais importantes que você fez.
    `;

    const userMessage = `Por favor, revise e corrija o seguinte texto: "${texto}"`;
    // --------------------------------------------------------

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.2, // Temperatura muito baixa para focar em correções precisas.
    });

    const correcaoCompleta = completion.choices[0].message.content;

    res.status(200).json({ resultado: correcaoCompleta });

  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    res.status(500).json({ error: 'Falha ao se comunicar com a IA da OpenAI.' });
  }
}
