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
  const dataFimFinal = formatarData(hoje);
  const dataInicioFinal = formatarData(adicionarDias(hoje, -50));

  const payload = {
    report,
    DATA_INICIO: dataInicioFinal,
    DATA_FIM: dataFimFinal
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
        timeout: 0 // 🔥 sem limite de tempo
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    res.status(500).json({ error: 'Erro ao obter dados do Feegow' });
  }
});

// 🔥 Aumenta também o timeout padrão do Express (caso o cliente demore muito para receber)
app.use((req, res, next) => {
  res.setTimeout(0); // sem limite
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
