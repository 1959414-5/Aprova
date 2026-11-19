# Professor IA e correção de redação — configuração

## Estado
As Edge Functions `study-tutor` e `essay-feedback` estão implantadas com `verify_jwt=true`. Ambas usam OpenAI Responses API no servidor e leem `OPENAI_API_KEY` apenas dos Secrets do Supabase.

O modelo padrão é `gpt-6.2-sol`, modelo suportado pela Responses API e com preço inferior ao GPT-6.2 Astra. Opcionalmente, o Secret `OPENAI_MODEL` pode substituir o padrão; não configure um ID de modelo que não esteja disponível na organização.

## 1. Chave da API
A chave deve ficar em Supabase → Edge Functions → Secrets:
- Name: `OPENAI_API_KEY`
- Value: chave secreta da OpenAI API Platform.

A chave não deve ser colocada em arquivos `.env` versionados, variáveis `VITE_*`, GitHub, navegador ou mensagens.

## 2. Faturamento e créditos
A assinatura ChatGPT não inclui automaticamente o consumo da API. O faturamento da API é separado.

Novas contas usam faturamento pré-pago. A compra inicial mínima informada pela OpenAI é de **US$ 5**; o valor padrão é US$ 10. Créditos gratuitos/promocionais, quando houver, são utilizados antes dos créditos comprados.

Durante a configuração do faturamento, confira a opção de recarga automática: ela pode vir ativada por padrão. Desative-a para comprar créditos manualmente e evitar novas compras automáticas.

Links oficiais:
- [Visão geral de faturamento da API](https://platform.openai.com/settings/organization/billing/overview)
- [Configuração de faturamento pré-pago](https://help.openai.com/pt-br/articles/8264644-setting-up-and-managing-prepaid-api-billing)
- [Modelos e preços](https://developers.openai.com/api/docs/models)

## 3. Limites de uso
- Professor IA: até 35 perguntas por dia por conta.
- Correção de redação: até 35 solicitações por dia por conta.
- As cotas são separadas e registradas em `ai_tutor_usage`.
- Chamadas recusadas por falha do provedor também podem ser registradas como falha.
- Limites internos não substituem os limites financeiros da organização OpenAI.

## 4. Teste do Professor IA
1. Faça login no SBMG Aprova.
2. Abra Sala de Estudos e escolha um tópico.
3. Clique em **Tirar dúvida com o Professor IA**.
4. Pergunte: “Explique esse assunto desde o começo e me dê um exemplo do trabalho administrativo”.
5. Confirme se a resposta considera o tópico selecionado.

## 5. Teste da redação
1. Abra Laboratório de Redação.
2. Selecione um tema e digite 20 a 30 linhas manuais.
3. Salve o rascunho.
4. Solicite correção por IA.
5. Confira as notas de 0 a 25 nos quatro critérios, comentários, melhorias e aviso de que a nota é formativa.

O contador considera quebras de linha digitadas; não reproduz a contagem visual da folha manuscrita. A avaliação automática não é nota oficial da banca.

## 6. Privacidade e custo
As funções enviam o texto e o contexto necessário para a API processar a solicitação. As chamadas usam `store=false`. Não coloque dados pessoais desnecessários nos textos.

O modelo GPT-6.2 Sol custa por token conforme a tabela atual da API; o custo real depende do tamanho do contexto e da resposta. Confira os preços antes de aumentar limites.
