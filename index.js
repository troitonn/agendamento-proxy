const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // para gerar IDs únicos
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Armazenamento temporário de relatórios (em memória)
const relatoriosCache = {};

// Função para formatar data dd/MM/yyyy
function formatarData(date) {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Função para adicionar dias
function adicionarDias(date, dias) {
  const novaData = new Date(date);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

// Endpoint para criar relatório (assíncrono)
app.get('/relatorio', (req, res) => {
  const { report } = req.query;
  if (!report) return res.status(400).json({ error: 'Parâmetro obrigatório: report' });

  const id = uuidv4(); // ID único para este relatório
  relatoriosCache[id] = { status: 'pendente', data: null, erro: null };

  // Processamento assíncrono
  (async () => {
    const hoje = new Date();
    const payload = {
      report,
      DATA_INICIO: formatarData(hoje),
      DATA_FIM: formatarData(adicionarDias(hoje, 59))
    };

    try {
      const response = await axios.post(
        'https://api.feegow.com/v1/api/reports/generate',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': process.env.FEEGOW_TOKEN
          },
          timeout: 120000 // 2 minutos
        }
      );

      relatoriosCache[id] = { status: 'pronto', data: response.data, erro: null };
    } catch (error) {
      relatoriosCache[id] = { status: 'erro', data: null, erro: error.response?.data || error.message };
    }
  })();

  // Retorna imediatamente o ID do relatório
  res.json({ id, status: 'pendente' });
});

// Endpoint para consultar relatório pelo ID
app.get('/relatorio/:id', (req, res) => {
  const { id } = req.params;
  const relatorio = relatoriosCache[id];

  if (!relatorio) return res.status(404).json({ error: 'Relatório não encontrado' });

  res.json(relatorio);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
