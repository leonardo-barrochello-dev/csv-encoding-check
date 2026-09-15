from flask import Flask, render_template, request, jsonify
import csv
import io
import unicodedata
import chardet

app = Flask(__name__)

ENCODINGS = {
    'ascii': 'ASCII',
    'utf-8': 'UTF-8',
    'latin-1': 'Latin-1 (ISO-8859-1)',
    'cp1252': 'Windows-1252',
    'utf-16': 'UTF-16'
}

def detect_encoding(file_content):
    result = chardet.detect(file_content)
    return result['encoding'] or 'utf-8'

def detect_separator(sample_text):
    try:
        dialect = csv.Sniffer().sniff(sample_text, delimiters=',;\t|')
        return dialect.delimiter
    except csv.Error:
        first_line = sample_text.split('\n')[0]
        for delim in [',', ';', '\t', '|']:
            if delim in first_line:
                return delim
        return ','

def check_encoding_violations(csv_content, target_encoding):
    violations = []
    
    detected = chardet.detect(csv_content)
    source_encoding = detected['encoding'] or 'utf-8'
    
    try:
        decoded = csv_content.decode(source_encoding)
    except (UnicodeDecodeError, LookupError):
        try:
            decoded = csv_content.decode('utf-8')
        except UnicodeDecodeError:
            decoded = csv_content.decode('latin-1')
    
    separator = detect_separator(decoded)
    
    separator_display = {
        ',': 'Vírgula (,)',
        ';': 'Ponto e vírgula (;)',
        '\t': 'Tab',
        '|': 'Pipe (|)'
    }.get(separator, repr(separator))
    
    reader = csv.reader(io.StringIO(decoded), delimiter=separator)
    
    for line_num, row in enumerate(reader, 1):
        if line_num == 1:
            headers = row
            continue
        
        for col_idx, cell in enumerate(row):
            if col_idx >= len(headers):
                continue
            
            field_name = headers[col_idx]
            
            for char_pos, char in enumerate(cell):
                try:
                    char.encode(target_encoding)
                except UnicodeEncodeError:
                    violations.append({
                        'line': line_num,
                        'field': field_name,
                        'column': col_idx + 1,
                        'character': char,
                        'unicode_code': f'U+{ord(char):04X}',
                        'unicode_name': unicodedata.name(char, 'UNKNOWN'),
                        'position_in_cell': char_pos + 1,
                        'cell_value': cell
                    })
    
    return violations, source_encoding, separator_display

@app.route('/')
def index():
    return render_template('index.html', encodings=ENCODINGS)

@app.route('/check', methods=['POST'])
def check():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    target_encoding = request.form.get('encoding', 'ascii')
    
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Arquivo deve ser CSV'}), 400
    
    file_content = file.read()
    
    violations, source_encoding, separator_display = check_encoding_violations(file_content, target_encoding)
    
    return jsonify({
        'filename': file.filename,
        'target_encoding': ENCODINGS.get(target_encoding, target_encoding),
        'source_encoding': source_encoding.upper(),
        'separator': separator_display,
        'total_violations': len(violations),
        'violations': violations
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
