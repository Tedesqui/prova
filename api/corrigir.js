// O ficheiro /api/corrigir.js

// Esta função é o nosso "manipulador" de pedidos.
// A Vercel executa esta função sempre que um pedido chega a /api/corrigir.
export default async function handler(req, res) {
  // 1. Verificar se o pedido é do tipo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  // 2. Obter a chave da API a partir das Variáveis de Ambiente (SEGURO)
  // Esta chave NUNCA está no código, apenas nas configurações da Vercel.
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "A chave da API da OpenAI não está configurada no servidor." });
  }

  // 3. Obter o texto enviado pelo frontend
  const { texto } = req.body;

  if (!texto || texto.trim() === '') {
    return res.status(400).json({ error: "Nenhum texto foi fornecido para correção." });
  }

  // 4. Preparar e enviar o pedido para a API da OpenAI
  const openAIEndpoint = 'https://api.openai.com/v1/chat/completions';

  // O "prompt" que instrui o ChatGPT sobre o que fazer.
  const systemPrompt = "Você é um assistente de correção de provas. Analise o texto seguinte, que é a resposta de um aluno. Corrija a resposta de forma clara e concisa, explicando os erros, se houver, e fornecendo a resposta correta. Seja direto e objetivo.";

  try {
    const openAIResponse = await fetch(openAIEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // Usar a chave segura aqui
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Ou "gpt-4", etc.
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: texto }
        ],
        temperature: 0.5, // Controla a criatividade (mais baixo = mais factual)
        max_tokens: 200, // Limita o tamanho da resposta
      }),
    });

    const data = await openAIResponse.json();

    // Se a OpenAI devolver um erro, reencaminha-o.
    if (!openAIResponse.ok) {
        console.error("Erro da API da OpenAI:", data);
        throw new Error(data.error?.message || 'Ocorreu um erro ao comunicar com a IA.');
    }

    const correcao = data.choices[0]?.message?.content?.trim() || "Não foi possível obter uma correção.";

    // 5. Enviar a correção de volta para o frontend
    return res.status(200).json({ resultado: correcao });

  } catch (error) {
    console.error("Erro interno do servidor:", error);
    return res.status(500).json({ error: error.message });
  }
}
