# Publicar o Aprova no GitHub Pages

## Endereço
https://1959414-5.github.io/Aprova/

## 1. Ativar GitHub Pages
No repositório 1959414-5/Aprova:
1. Acesse **Settings**.
2. Abra **Pages** na lateral.
3. Em **Build and deployment → Source**, escolha **GitHub Actions**.
4. Salve, se o GitHub solicitar.

O workflow está em `.github/workflows/deploy-pages.yml`. Cada push em `main` compila o Vite e publica o diretório `dist`.

## 2. Executar o workflow
Abra **Actions → Deploy Aprova to GitHub Pages**. Se já houver uma execução que falhou antes de ativar Pages, use **Run workflow** para executá-la novamente após a configuração.

## 3. Liberar o endereço no Supabase Auth
No Supabase, abra **Authentication → URL Configuration** e acrescente aos Redirect URLs:
`https://1959414-5.github.io/Aprova/`

Mantenha também o endereço local de desenvolvimento:
`http://localhost:5173/`

O cadastro envia a confirmação de e-mail de volta ao caminho atual do site. O endereço do GitHub Pages precisa estar permitido para que o retorno da confirmação seja aceito.

## 4. Variáveis do build
O workflow injeta:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

A publishable key é apropriada para uso no cliente com RLS habilitado. Nunca adicione `service_role` ou secret key em variáveis `VITE_*`, pois elas seriam incluídas no bundle público.

## 5. Verificação
Depois do deploy:
- Abra o endereço do site em computador e celular.
- Alterne entre light e dark e recarregue a página para conferir a persistência.
- Faça cadastro e login com uma conta de teste.
- Responda uma questão do diagnóstico para validar a função autenticada.

Se a página mostrar 404, confira o status do job Deploy e se o Source de Pages está em GitHub Actions.
