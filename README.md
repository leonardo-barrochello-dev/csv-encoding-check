# CSV Encoding Checker

Ferramenta web para verificar caracteres incompatíveis em arquivos CSV com diferentes encodings.

## Funcionalidades

- **Upload de CSV** - Faça upload de arquivos CSV para análise
- **Detecção automática de encoding** - Identifica o encoding do arquivo original (UTF-8, Latin-1, etc.)
- **Detecção automática de separador** - Reconhece automaticamente separadores como vírgula (`,`), ponto e vírgula (`;`), tab ou pipe
- **Verificação de encoding alvo** - Selecione o encoding de destino (ASCII, UTF-8, Latin-1, Windows-1252, UTF-16)
- **Relatório detalhado** - Mostra linha, campo, caractere inválido, código Unicode, nome Unicode e posição
- **Paginação** - Navegue facilmente por arquivos com muitas violações
- **Exportação CSV** - Exporte o relatório de violações para arquivo CSV

## Requisitos

- Python 3.8+
- pip

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/leonardo-barrochello-dev/csv-encoding-check.git
cd csv-encoding-check
```

2. Crie e ative o ambiente virtual:

**Windows:**
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Uso

1. Inicie o servidor:
```bash
python app.py
```

2. Acesse no navegador:
```
http://127.0.0.1:5000
```

3. Faça upload de um arquivo CSV
4. Selecione o encoding de destino
5. Clique em "Verificar Encoding"
6. Visualize o relatório com as violações encontradas
7. Exporte o relatório se necessário

## Estrutura do Projeto

```
csv-encoding-check/
├── app.py                  # Servidor Flask
├── requirements.txt        # Dependências Python
├── templates/
│   └── index.html         # Template HTML
├── static/
│   ├── style.css          # Estilos CSS
│   └── script.js          # Lógica JavaScript
├── exemplo.csv            # Exemplo com vírgula
├── exemplo_pontovirgula.csv  # Exemplo com ponto e vírgula
└── venv/                  # Ambiente virtual (não versionado)
```

## Tecnologias

- **Backend:** Flask (Python)
- **Frontend:** HTML5, CSS3, JavaScript puro
- **Bibliotecas:** chardet (detecção de encoding)

## Exemplos de Uso

### Verificar compatibilidade com ASCII
Útil para sistemas legados que só aceitam caracteres ASCII.

### Verificar compatibilidade com Latin-1
Para integração com sistemas que usam ISO-8859-1.

### Verificar compatibilidade com Windows-1252
Para sistemas Windows antigos.

## Licença

MIT License
