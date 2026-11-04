/* ===== Consultor dos Milhões · edicao.js =====
   DATA DA EDIÇÃO: o único arquivo que muda todo mês.
   Usado pela landing page (app.js) e pelo link fixo de agenda (/agenda/).
   Horário de Brasília (-03:00). Quando todas as datas passarem, vale a
   regra padrão: última terça do mês, às 19h. */
window.MP_EDICAO = (() => {
  const EDICOES = ['2026-12-10T19:00:00-03:00'];
  const REGRA_PADRAO = { diaDaSemana: 2 /* 0=dom, 2=terça */, hora: 19 };
  const DURACAO_MIN = 90;
  const TITULO = 'Consultor dos Milhões · Aula ao vivo com Gabriel Liberato';
  const PAGINA = 'https://consultordosmilhoes.meupatrimonio.com/';
  const DESCRICAO = 'Aula ao vivo e gratuita com Gabriel Liberato, para profissionais do mercado financeiro: como captar e reter clientes de milhões.\n\n'
    + 'O link da sala chega por e-mail e WhatsApp no dia do encontro.\n\n'
    + 'Página do evento: ' + PAGINA;

  function regraPadrao(from) {
    const { diaDaSemana, hora } = REGRA_PADRAO;
    for (let add = 0; add < 3; add++) {
      const y = from.getUTCFullYear(), m = from.getUTCMonth() + add;
      const last = new Date(Date.UTC(y, m + 1, 0));
      const back = (last.getUTCDay() - diaDaSemana + 7) % 7;
      const d = new Date(Date.UTC(y, m, last.getUTCDate() - back, hora + 3, 0, 0)); // BRT = UTC-3
      if (d.getTime() + DURACAO_MIN * 60000 > from.getTime()) return d;
    }
  }
  function proxima(now = new Date()) {
    const fim = d => d.getTime() + DURACAO_MIN * 60000;
    const prox = EDICOES.map(s => new Date(s)).sort((a, b) => a - b).find(d => fim(d) > now.getTime());
    return prox || regraPadrao(now);
  }
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  function googleUrl(inicio = proxima()) {
    const fim = new Date(inicio.getTime() + DURACAO_MIN * 60000);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(TITULO)
      + '&dates=' + z(inicio) + '/' + z(fim)
      + '&ctz=America/Sao_Paulo'
      + '&details=' + encodeURIComponent(DESCRICAO)
      + '&location=' + encodeURIComponent('Online, ao vivo (link enviado por e-mail e WhatsApp)');
  }
  return { EDICOES, REGRA_PADRAO, DURACAO_MIN, TITULO, DESCRICAO, PAGINA, proxima, googleUrl, z };
})();
