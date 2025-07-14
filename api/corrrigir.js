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
