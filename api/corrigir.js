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
    const { texto } = req.body;

    if (!texto || texto.trim() === '') {
      return res.status(400).json({ error: 'O campo "texto" não pode estar vazio.' });
    }

    // --- PROMPT ATUALIZADO ---
    const systemMessage = `
      Você é um assistente especialista em checagem de fatos e um professor.
      Sua tarefa é analisar o texto fornecido e avaliar se as afirmações contidas nele são verdadeiras ou falsas.

      Siga estritamente estas regras para a sua resposta:
      1. Leia cada afirmação no texto.
      2. Para cada afirmação, determine se ela é "Correta", "Incorreta" ou "Parcialmente Correta".
      3. Se uma afirmação for incorreta ou parcialmente correta, forneça a informação correta e uma breve explicação.
      4. Apresente o resultado de forma clara e organizada, em formato de lista ou tópicos.
      5. Ao final de toda a análise, em uma nova linha, escreva "Nota do Aluno:" seguido de uma nota de 0 a 10, que reflete a veracidade geral das afirmações no texto.
    `; // <-- MUDANÇA REALIZADA AQUI

    const userMessage = `Por favor, analise as afirmações no seguinte texto e verifique sua veracidade: "${texto}"`;
    // --------------------------------------------------------

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1,
    });

    const analiseCompleta = completion.choices[0].message.content;

    res.status(200).json({ resultado: analiseCompleta });

  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    res.status(500).json({ error: 'Falha ao se comunicar com a IA da OpenAI.' });
  }
}
