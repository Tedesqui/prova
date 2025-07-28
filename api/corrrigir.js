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
    // --- MUDANÇA AQUI: Voltamos a esperar "pergunta" e "resposta" ---
    const { pergunta, resposta } = req.body;

    // Validação para os dois campos
    if (!pergunta || !resposta) {
      return res.status(400).json({ error: 'Os campos "pergunta" e "resposta" são obrigatórios.' });
    }

    // --- PROMPT DE CORREÇÃO DE PROVA ---
    // Instruímos a IA a comparar a resposta com a pergunta.
    const systemMessage = `
      Você é um professor assistente especialista em avaliação de provas.
      Sua função é analisar a resposta de um aluno com base na pergunta fornecida.
      
      Siga estas regras na sua correção:
      1. Compare a resposta do aluno com o que era esperado pela pergunta.
      2. Aponte os acertos e os erros de forma clara e construtiva.
      3. Forneça a informação correta caso a resposta esteja errada ou incompleta.
      4. No final, em uma nova linha, escreva "Nota:" seguido de uma nota de 0 a 10, que reflita o quão bem a resposta atende à pergunta.
    `;

    const userMessage = `
      A pergunta foi: "${pergunta}"
      
      A resposta do aluno foi: "${resposta}"
      
      Por favor, avalie esta resposta.
    `;
    // --------------------------------------------------------

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
