export const ESSAY_COURSE = [
  {
    id: "fundamentos",
    number: 1,
    title: "O que é uma redação dissertativo-argumentativa?",
    shortTitle: "Fundamentos",
    duration: "20 min",
    objective: "Entender o que a proposta pede e aprender a defender uma ideia com razões organizadas.",
    introduction: "Uma redação dissertativo-argumentativa não é uma história nem uma lista de opiniões. É um texto em que você apresenta um tema, assume um ponto de vista e explica por que esse ponto de vista faz sentido.",
    sections: [
      {
        heading: "Dissertar é explicar; argumentar é sustentar uma posição",
        text: "A dissertação apresenta e desenvolve ideias sobre um assunto. Na modalidade argumentativa, o autor também defende uma tese: uma afirmação central que pode ser discutida e precisa ser sustentada por argumentos. O leitor deve conseguir identificar qual posição está sendo defendida e acompanhar o raciocínio que a justifica."
      },
      {
        heading: "Não confunda tema, opinião e argumento",
        text: "O tema é o assunto amplo. A tese é o posicionamento específico que você assume sobre ele. O argumento é a razão que sustenta esse posicionamento. Por exemplo: tema — tecnologia nos serviços públicos; tese — a tecnologia pode melhorar o atendimento quando vem acompanhada de segurança e inclusão; argumentos — reduz etapas burocráticas e facilita o acompanhamento das solicitações."
      },
      {
        heading: "O que evitar",
        text: "Evite transformar o texto em relato pessoal, copiar a proposta, repetir a mesma opinião em todos os parágrafos ou usar frases genéricas sem explicar nada. Uma experiência pessoal pode ilustrar uma ideia, mas não substitui o desenvolvimento do argumento. Também não invente estatísticas, leis ou citações para dar aparência de autoridade."
      }
    ],
    example: {
      title: "Da opinião solta para uma tese argumentável",
      weak: "A tecnologia é muito importante e todos sabem que ela é boa.",
      strong: "A tecnologia pode tornar os serviços públicos mais eficientes, desde que os sistemas sejam seguros e também atendam pessoas com dificuldade de acesso digital.",
      notes: [
        "A primeira frase apenas declara uma opinião e usa uma generalização (“todos sabem”).",
        "A segunda apresenta um posicionamento específico e indica dois aspectos que podem ser desenvolvidos: eficiência e inclusão com segurança."
      ]
    },
    exercise: {
      prompt: "Qual alternativa apresenta uma tese clara e que pode ser defendida com argumentos?",
      options: [
        "A tecnologia existe há muito tempo e está presente em vários lugares.",
        "A ampliação dos serviços digitais pode reduzir burocracias, mas precisa considerar a segurança dos dados e o acesso de todos.",
        "Ontem precisei resolver um problema e fiquei esperando por bastante tempo."
      ],
      correctIndex: 1,
      explanation: "A alternativa B apresenta uma posição sobre o tema e delimita dois pontos para argumentação. A alternativa A apenas informa; a C inicia um relato."
    }
  },
  {
    id: "estrutura",
    number: 2,
    title: "Como organizar introdução, desenvolvimento e conclusão",
    shortTitle: "Estrutura do texto",
    duration: "25 min",
    objective: "Planejar a função de cada parte do texto para que o leitor acompanhe o raciocínio.",
    introduction: "A estrutura funciona como um caminho: a introdução apresenta o assunto e a tese; o desenvolvimento demonstra por que a tese é defensável; a conclusão fecha o raciocínio. Cada parte tem uma função diferente.",
    sections: [
      {
        heading: "Introdução: apresente o assunto e sua tese",
        text: "Comece situando o leitor no tema, sem fazer uma abertura longa demais. Em seguida, deixe claro qual é o seu posicionamento. Uma boa introdução responde: sobre o que vou falar e o que vou defender? Não gaste todo o espaço com frases prontas ou definições vagas."
      },
      {
        heading: "Desenvolvimento: explique as razões",
        text: "Cada parágrafo de desenvolvimento deve trabalhar uma ideia principal. Apresente o argumento, explique como ele se relaciona ao tema e acrescente um exemplo, consequência ou situação concreta quando isso ajudar. Não basta escrever “em primeiro lugar” e repetir a tese com outras palavras."
      },
      {
        heading: "Conclusão: encerre o raciocínio",
        text: "Retome a ideia central com palavras próprias e mostre o que o raciocínio permite concluir. Evite introduzir um argumento totalmente novo no último parágrafo. Uma proposta de ação pode ser pertinente ao tema, mas não deve ser incluída de forma mecânica quando não contribui para responder à proposta."
      },
      {
        heading: "Um roteiro inicial possível",
        text: "Para treinar, experimente quatro parágrafos: um de introdução, dois de desenvolvimento e um de conclusão. É apenas um modelo de planejamento, não uma quantidade obrigatória de parágrafos. Ajuste a divisão ao tema e ao limite de 20 a 30 linhas da prova."
      }
    ],
    example: {
      title: "Mapa simples de um texto em quatro parágrafos",
      weak: "Começar com uma frase genérica, escrever um único bloco de ideias e terminar repetindo “portanto, isso é importante”.",
      strong: "P1 apresenta o desafio dos serviços digitais e a tese. P2 explica como a digitalização reduz etapas. P3 mostra por que segurança e inclusão são necessárias. P4 sintetiza que eficiência depende de acesso e proteção de dados.",
      notes: [
        "A introdução orienta o leitor sobre o tema e a posição defendida.",
        "Os parágrafos centrais desenvolvem razões diferentes, sem abandonar a tese.",
        "A conclusão fecha a linha de raciocínio em vez de abrir outro assunto."
      ]
    },
    exercise: {
      prompt: "Qual é a função principal do desenvolvimento?",
      options: [
        "Apresentar o tema pela primeira vez e anunciar a tese.",
        "Sustentar a tese, explicando argumentos e relações com o tema.",
        "Acrescentar um assunto novo para surpreender o leitor."
      ],
      correctIndex: 1,
      explanation: "O desenvolvimento é a parte em que as razões são explicadas e sustentadas. Introdução e conclusão têm funções diferentes."
    }
  },
  {
    id: "tema-tese",
    number: 3,
    title: "Como interpretar o tema e construir uma tese",
    shortTitle: "Tema e tese",
    duration: "25 min",
    objective: "Ler a proposta com atenção, delimitar o recorte e planejar uma posição antes de começar.",
    introduction: "Antes de escrever, transforme a proposta em uma pergunta que você precisa responder. Isso evita fugir do tema e ajuda a escolher uma tese que caiba no espaço disponível.",
    sections: [
      {
        heading: "Leia o comando, não apenas o título",
        text: "Sublinhe o assunto central, o recorte e os aspectos indicados pela proposta. Se o comando pede uma discussão sobre benefícios e desafios, tratar apenas dos benefícios deixa parte da tarefa sem resposta. Observe também o gênero solicitado e o limite de linhas."
      },
      {
        heading: "Transforme o tema em uma pergunta",
        text: "Tema: responsabilidade ambiental nas organizações. Pergunta de planejamento: como uma organização pode reduzir impactos ambientais na rotina? A pergunta ajuda a sair de ideias muito amplas e a selecionar pontos que possam ser explicados em poucos parágrafos."
      },
      {
        heading: "Escreva uma tese específica",
        text: "Uma tese útil apresenta uma resposta ao problema e indica um caminho de argumentação. Evite afirmações absolutas, como “tudo depende do governo” ou “a sociedade inteira é culpada”. Prefira uma posição delimitada que você consiga justificar com conhecimento seguro e exemplos pertinentes."
      },
      {
        heading: "Escolha dois eixos para desenvolver",
        text: "Depois de formular a tese, anote duas razões diferentes que a sustentem. Elas serão o ponto de partida dos parágrafos centrais. Se você não consegue explicar uma razão em duas ou três frases, talvez ela esteja vaga ou precise ser substituída."
      }
    ],
    example: {
      title: "Do tema amplo a uma tese delimitada",
      weak: "Tema: ética nas instituições. Tese: ética é muito importante para todos.",
      strong: "Tese: a transparência fortalece a confiança nas instituições porque permite acompanhar decisões e cobrar responsabilidade por elas.",
      notes: [
        "A versão fraca repete o assunto, mas não apresenta uma afirmação que será defendida.",
        "A versão forte estabelece uma relação de causa e consequência que pode ser desenvolvida com exemplos e explicações."
      ]
    },
    exercise: {
      prompt: "A proposta trata da importância da prevenção de riscos em espaços coletivos. Qual tese responde melhor ao tema?",
      options: [
        "Espaços coletivos são utilizados por muitas pessoas diariamente.",
        "A prevenção de riscos depende de planejamento e comunicação clara, pois permite identificar perigos e orientar as pessoas antes de acidentes.",
        "Acidentes são acontecimentos ruins e ninguém gosta deles."
      ],
      correctIndex: 1,
      explanation: "A alternativa B apresenta um posicionamento e duas razões relacionadas diretamente à prevenção. As demais apenas descrevem ou fazem uma afirmação genérica."
    }
  },
  {
    id: "argumentacao",
    number: 4,
    title: "Como desenvolver argumentos com consistência",
    shortTitle: "Argumentação",
    duration: "25 min",
    objective: "Aprender a explicar uma ideia, sustentá-la e conectá-la novamente à tese.",
    introduction: "Um argumento não fica completo só porque foi mencionado. O leitor precisa entender a afirmação, a explicação que a sustenta e a relação dela com o problema discutido.",
    sections: [
      {
        heading: "Use a sequência: afirmação, explicação e ilustração",
        text: "Comece com uma afirmação ligada à tese. Explique por que ela acontece ou por que importa. Depois, acrescente um exemplo, uma consequência ou uma situação concreta. Por fim, mostre como essa ideia reforça a tese. Essa sequência evita parágrafos que apenas acumulam frases."
      },
      {
        heading: "Exemplos precisam ser pertinentes",
        text: "Um exemplo não precisa ser uma pesquisa sofisticada. Pode ser uma situação administrativa conhecida, desde que seja verdadeira, relevante e explicada. Não invente números, nomes de órgãos, leis, pesquisas ou acontecimentos. Quando não souber um dado exato, use uma explicação geral em vez de apresentar uma informação falsa."
      },
      {
        heading: "Desenvolva ideias diferentes",
        text: "Dois parágrafos que repetem a mesma razão não ampliam a discussão. Procure ângulos complementares. Em um texto sobre serviços digitais, por exemplo, você pode tratar da redução de etapas burocráticas e, em outro, das condições necessárias para proteger dados e incluir quem tem pouco acesso à tecnologia."
      },
      {
        heading: "Volte à pergunta central",
        text: "Ao terminar cada parágrafo, confira se ele ajuda a responder à proposta. Se o trecho poderia aparecer em qualquer redação, talvez esteja genérico. Acrescente uma relação explícita entre o argumento e o tema."
      }
    ],
    example: {
      title: "Desenvolvimento explicado em etapas",
      weak: "A tecnologia ajuda muito os serviços. Ela é moderna e facilita várias coisas.",
      strong: "A digitalização pode reduzir etapas burocráticas. Quando o cidadão acompanha uma solicitação pela internet, por exemplo, diminui a necessidade de deslocamentos apenas para consultar o andamento. Assim, o serviço pode se tornar mais ágil, desde que o sistema seja acessível e confiável.",
      notes: [
        "Afirmação: a digitalização pode reduzir etapas.",
        "Explicação e exemplo: acompanhar uma solicitação pela internet evita deslocamentos desnecessários.",
        "Relação com a tese: a agilidade depende também de acesso e confiabilidade."
      ]
    },
    exercise: {
      prompt: "Qual parágrafo desenvolve melhor um argumento?",
      options: [
        "A comunicação é importante. Ela é necessária e muito útil para todos.",
        "A comunicação clara reduz falhas porque orienta as pessoas sobre procedimentos e responsabilidades. Em um espaço coletivo, avisos objetivos ajudam a evitar dúvidas e permitem agir com antecedência.",
        "A comunicação existe em todos os lugares e sempre existirá."
      ],
      correctIndex: 1,
      explanation: "A alternativa B apresenta uma ideia, explica sua consequência e traz uma situação relacionada ao tema. As outras repetem afirmações sem desenvolvê-las."
    }
  },
  {
    id: "coesao-linguagem",
    number: 5,
    title: "Como conectar ideias e escrever com clareza",
    shortTitle: "Coesão e linguagem",
    duration: "25 min",
    objective: "Melhorar a ligação entre frases e parágrafos e revisar a escrita formal.",
    introduction: "Coesão é a ligação entre as partes do texto. Coerência é a lógica do conjunto. Um texto pode ter conectivos em todas as frases e ainda assim não fazer sentido; por isso, escolha as palavras de ligação de acordo com a relação real entre as ideias.",
    sections: [
      {
        heading: "Escolha conectivos pela relação de sentido",
        text: "“Além disso” acrescenta uma ideia; “porém” indica oposição; “portanto” introduz uma conclusão; “porque” apresenta uma causa ou justificativa; “por exemplo” introduz uma ilustração. Não use conectivos apenas para parecer formal. Leia as duas ideias e pergunte qual relação existe entre elas."
      },
      {
        heading: "Evite repetições e referências confusas",
        text: "Você pode retomar um termo com pronomes, expressões equivalentes ou palavras mais específicas. Mas o leitor precisa saber a que cada expressão se refere. Se usar “isso”, “essa situação” ou “tal medida”, confira se o referente está claro."
      },
      {
        heading: "Prefira clareza à frase complicada",
        text: "Frases muito longas aumentam o risco de perder a lógica e cometer erros de pontuação. Use períodos com uma ideia central, respeite a concordância entre sujeito e verbo e revise a regência e a grafia. Vocabulário simples e preciso costuma ser melhor que palavras difíceis usadas sem necessidade."
      },
      {
        heading: "Faça uma revisão em camadas",
        text: "Primeiro, confira se respondeu ao tema. Depois, veja se os parágrafos seguem uma ordem lógica. Em seguida, procure repetições, conectivos inadequados e referências vagas. Por último, revise pontuação, concordância, regência e ortografia."
      }
    ],
    example: {
      title: "Conectivo escolhido pelo sentido",
      weak: "O sistema pode reduzir filas. Portanto, algumas pessoas não têm acesso à internet.",
      strong: "O sistema pode reduzir filas. Porém, pessoas sem acesso à internet precisam de alternativas de atendimento.",
      notes: [
        "A segunda frase apresenta uma ressalva à primeira, não uma consequência lógica.",
        "“Porém” marca oposição/limitação; “portanto” indicaria uma conclusão."
      ]
    },
    exercise: {
      prompt: "Complete a relação: “O atendimento digital pode agilizar solicitações; ______, é necessário oferecer alternativas a quem não tem acesso à internet.”",
      options: [
        "além disso",
        "porém",
        "portanto"
      ],
      correctIndex: 1,
      explanation: "A segunda ideia limita a primeira e apresenta um contraste. “Porém” é o conectivo adequado. “Além disso” acrescentaria uma razão; “portanto” indicaria conclusão."
    }
  },
  {
    id: "conclusao-revisao",
    number: 6,
    title: "Como concluir, revisar e administrar as 20 a 30 linhas",
    shortTitle: "Conclusão e revisão",
    duration: "20 min",
    objective: "Fechar o texto sem abrir um novo assunto e conferir se ele atende à proposta e ao limite de linhas.",
    introduction: "A conclusão não é apenas a última frase. Ela encerra o percurso iniciado na introdução e desenvolvido nos argumentos. Antes de entregar, faça uma revisão objetiva para encontrar falhas de conteúdo, organização e linguagem.",
    sections: [
      {
        heading: "Retome a tese sem copiar a introdução",
        text: "Reescreva a ideia central com outras palavras e sintetize o que os argumentos demonstraram. Evite repetir literalmente o primeiro parágrafo. A conclusão deve dar sensação de fechamento: o leitor entende qual resposta você construiu para o tema."
      },
      {
        heading: "Não introduza uma discussão nova no final",
        text: "Se uma informação importante aparece pela primeira vez na conclusão e exige explicação, ela provavelmente deveria estar no desenvolvimento. O fechamento pode apontar uma consequência ou uma medida pertinente, mas não deve abrir um novo caminho argumentativo."
      },
      {
        heading: "Planeje o espaço antes de escrever",
        text: "A prova prevê texto de 20 a 30 linhas. Treine distribuindo o espaço para introdução, argumentos e conclusão, sem deixar toda a explicação para o fim. O modelo de quatro parágrafos pode ajudar, mas ajuste o tamanho de cada parte ao que precisa explicar. A contagem digitada na plataforma é apenas uma referência: a folha oficial é manuscrita."
      },
      {
        heading: "Checklist de revisão final",
        text: "Confira: respondi a todos os aspectos da proposta? Minha tese está clara? Cada parágrafo desenvolve uma ideia? Os exemplos são pertinentes e verdadeiros? A conclusão fecha o raciocínio? Há frases incompletas, repetições, problemas de pontuação ou erros de concordância? O texto respeita o limite de linhas?"
      }
    ],
    example: {
      title: "Fechamento que retoma o raciocínio",
      weak: "Portanto, esse assunto é muito importante e todos devem fazer a sua parte.",
      strong: "Portanto, serviços digitais podem tornar o atendimento mais ágil, mas seus resultados dependem de sistemas seguros e de alternativas acessíveis à população.",
      notes: [
        "A versão fraca não recupera os argumentos nem informa o que foi demonstrado.",
        "A versão forte sintetiza a tese e os dois eixos desenvolvidos no texto."
      ]
    },
    exercise: {
      prompt: "O que uma boa conclusão deve fazer?",
      options: [
        "Apresentar uma tese totalmente diferente para ampliar o tema.",
        "Retomar a ideia central e fechar o raciocínio construído nos parágrafos anteriores.",
        "Repetir exatamente a introdução para preencher as últimas linhas."
      ],
      correctIndex: 1,
      explanation: "A conclusão retoma e sintetiza o raciocínio. Ela não deve abrir uma discussão nova nem repetir mecanicamente a introdução."
    }
  }
];

export const ESSAY_MODEL_TEXT = {
  title: "O uso responsável da tecnologia na melhoria dos serviços públicos",
  notice: "Texto didático autoral, criado para estudo. Não é uma redação oficial nem um modelo de resposta da banca.",
  paragraphs: [
    {
      part: "Introdução",
      text: "A digitalização tem alterado a forma como a população acessa serviços e informações. No setor público, esse processo pode simplificar procedimentos e aproximar o cidadão das instituições. Entretanto, para produzir benefícios amplos, a modernização precisa combinar eficiência, proteção de dados e inclusão digital.",
      analysis: "Apresenta o contexto, delimita o assunto e deixa explícita a tese: a modernização deve equilibrar três dimensões."
    },
    {
      part: "Desenvolvimento 1",
      text: "Em primeiro lugar, ferramentas digitais podem reduzir etapas burocráticas. Quando uma pessoa consegue preencher um formulário, enviar documentos e acompanhar uma solicitação em um único canal, diminui a necessidade de deslocamentos e consultas presenciais apenas para obter informações. Isso pode tornar o atendimento mais organizado e liberar recursos para demandas que exigem contato direto.",
      analysis: "Desenvolve o argumento da eficiência. Explica o mecanismo, apresenta uma situação concreta e mostra a consequência."
    },
    {
      part: "Desenvolvimento 2",
      text: "Além da agilidade, a confiança no serviço depende da segurança e da acessibilidade. Sistemas que não protegem informações pessoais podem gerar prejuízos e reduzir a credibilidade institucional. Da mesma forma, pessoas com conexão limitada ou pouca familiaridade com ferramentas digitais não podem ficar sem atendimento. Por isso, canais alternativos e orientação ao usuário precisam acompanhar a implantação da tecnologia.",
      analysis: "Acrescenta um segundo eixo, diferente do primeiro: segurança e inclusão. Usa conectivos para marcar adição e consequência."
    },
    {
      part: "Conclusão",
      text: "Portanto, a tecnologia pode contribuir para serviços públicos mais eficientes quando é planejada para atender às necessidades reais da população. A combinação entre processos simples, proteção das informações e opções acessíveis permite que a inovação melhore o atendimento sem excluir quem mais precisa dele.",
      analysis: "Retoma a tese com outras palavras e sintetiza os dois argumentos, encerrando o texto sem introduzir um novo tema."
    }
  ]
};

export const ESSAY_RUBRIC = [
  {
    title: "Adequação ao tema e à proposta",
    weight: "até 25 pontos",
    description: "Verifica se o texto responde ao tema, respeita o comando e utiliza o gênero dissertativo-argumentativo."
  },
  {
    title: "Conteúdo",
    weight: "até 25 pontos",
    description: "Observa o desenvolvimento, a consistência dos argumentos e a pertinência das informações e exemplos."
  },
  {
    title: "Coerência",
    weight: "até 25 pontos",
    description: "Avalia a organização das ideias, a progressão do raciocínio e a articulação entre introdução, desenvolvimento e conclusão."
  },
  {
    title: "Linguagem",
    weight: "até 25 pontos",
    description: "Considera a escrita formal, a coesão, a clareza, o vocabulário, a concordância, a regência, a pontuação e a ortografia."
  }
];
