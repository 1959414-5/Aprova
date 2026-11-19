# Professor IA — configuração

## Estado
A função `study-tutor` está implantada no Supabase com `verify_jwt=true`. A interface envia a pergunta, o histórico recente e o tópico selecionado. A função recupera a aula publicada do banco e envia somente esse contexto à OpenAI Responses API.

**O Professor IA ainda não responde até existir o secret `OPENAI_API_KEY`.** Sem ele, o servidor retorna `TUTOR_NOT_CONFIGURED`.

## 1. Criar uma chave de API
1. Entre na [OpenAI API Platform](https://platform.openai.com/).
2. Abra um projeto da API ou crie um projeto específico para o SBMG Aprova.
3. Em API Keys, crie uma nova secret key.
4. Salve a chave em um gerenciador seguro. Ela não poderá ser exibida novamente depois.

A documentação oficial explica [como gerenciar projetos e chaves](https://help.openai.com/pt-br/articles/9186755-como-gerenciar-projetos-na-plataforma-da-api).

## 2. Adicionar ao Supabase
1. Abra o projeto [Aprova no Supabase](https://supabase.com/dashboard/project/ehsrjjflwrmmegfvupch).
2. Acesse **Edge Functions → Secrets**.
3. Adicione:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** cole a chave secreta criada na API Platform.
4. Salve.

Opcionalmente, defina `OPENAI_MODEL` se quiser substituir o modelo padrão `gpt-6-astra`. A função já tem esse padrão no servidor.

A chave fica no ambiente da Edge Function; não precisa redeploy depois de salvar o secret. Guia oficial: [Supabase — Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets).

## 3. Custo e limite
- O aplicativo limita cada conta a **35 solicitações por dia** no Professor IA.
- Chamadas que falham por erro do provedor também contam para o limite.
- A API da OpenAI tem faturamento separado da assinatura ChatGPT; adicione método de pagamento ou créditos na API Platform e defina limites de gasto antes de liberar o uso.
- Consulte [a página oficial de faturamento](https://help.openai.com/pt-br/articles/9039756-gerenciamento-do-faturamento-do-chatgpt-e-da-plataforma-de-api) e [preços da API](https://openai.com/api/pricing/).

## 4. Teste
Depois de salvar o secret:
1. Recarregue o Aprova.
2. Abra Sala de Estudos e escolha uma aula.
3. Clique em **Tirar dúvida com o Professor IA**.
4. Pergunte, por exemplo: “Explique esse assunto desde o começo e me dê um exemplo do trabalho administrativo”.
5. Confirme se a resposta considera o tópico selecionado.

A chave nunca deve ser enviada ao chat, colocada no frontend ou commitada no GitHub.
