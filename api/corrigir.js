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
    // Recebemos apenas um campo "texto" do frontend.
    const { texto } = req.body;

    if (!texto || texto.trim() === '') {
      return res.status(400).json({ error: 'O campo "texto" não pode estar vazio.' });
    }

    // --- NOVO PROMPT: SOLUCIONADOR INTELIGENTE ---
    // Instruímos a IA a identificar a tarefa implícita no texto.
    const systemMessage = `
      Você é um assistente de IA altamente inteligente e versátil. Sua principal função é analisar o texto do usuário e determinar a tarefa implícita para fornecer uma resposta direta e precisa.

      Siga estas regras para determinar a tarefa:
      1.  **Se o texto for uma equação matemática ou um problema para resolver (ex: "9 * 9 =", "calcule a área de um círculo com raio 5"),** resolva o problema e forneça apenas o resultado final, a menos que uma explicação seja solicitada.
      2.  **Se o texto for uma pergunta direta (ex: "Qual é a capital do Japão?"),** responda à pergunta de forma completa e precisa.
      3.  **Se o texto for uma afirmação a ser verificada (ex: "O sol gira em torno da Terra."),** analise sua veracidade, corrija-a se estiver incorreta e forneça uma breve explicação.
      4.  **Se o texto for uma frase para completar,** complete-a de forma lógica e coerente.

      Sempre priorize a resposta mais direta e útil para a tarefa que você identificou.
    `;

    const userMessage = `Analise e execute a tarefa implícita no seguinte texto: "${texto}"`;
    // --------------------------------------------------------

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1, // Temperatura baixa para respostas mais diretas e factuais.
    });

    const resultadoFinal = completion.choices[0].message.content;

    res.status(200).json({ resultado: resultadoFinal });

  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    res.status(500).json({ error: 'Falha ao se comunicar com a IA da OpenAI.' });
  }
}
