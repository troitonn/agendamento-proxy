const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Função para formatar data no padrão dd/MM/yyyy
function formatarData(date) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para adicionar dias a uma data
function adicionarDias(date, dias) {
    const novaData = new Date(date);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
}

// Rota para gerar relatório Feegow
app.get('/relatorio', async (req, res) => {
    const { report } = req.query;
    if (!report) {
        return res.status(400).json({ error: 'Parâmetro obrigatório: report' });
    }

    const hoje = new Date();
    const dataFim = formatarData(hoje);
    const dataInicio = formatarData(adicionarDias(hoje, -59)); // Últimos 60 dias

    const payload = {
        report,
        DATA_INICIO: dataInicio,
        DATA_FIM: dataFim
    };

    try {
        const response = await axios.post(
            'https://api.feegow.com/v1/api/reports/generate',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': process.env.FEEGOW_TOKEN
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Erro ao obter dados do Feegow' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
