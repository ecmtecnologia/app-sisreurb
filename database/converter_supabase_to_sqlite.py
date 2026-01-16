import re

def converter_supabase_para_sqlite():
    with open('reurb_properties_rows.sql', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Saneamento de Dados para SQLite
    content = content.replace('"public".', '')
    content = content.replace("INSERT INTO", "INSERT OR REPLACE INTO")
    
    # Converte ARRAY["url"] para '["url"]' (string JSON para SQLite)
    content = re.sub(r'ARRAY\[(.*?)\]', r" '[\1]' ", content)
    
    # Converte booleanos
    content = content.replace("'false'", "0").replace("'true'", "1")

    # 2. Extração dos valores (tudo o que está entre VALUES e ;)
    values_match = re.search(r'VALUES\s*(.*);', content, re.DOTALL)
    if not values_match:
        print("Erro: Não foi possível encontrar o bloco de valores.")
        return
    
    all_values = values_match.group(1).split('), (')
    
    # Limpeza das pontas dos registos
    all_values = [v.strip().lstrip('(').rstrip(')') for v in all_values]
    
    # 3. Divisão em blocos de 100
    headers = 'INSERT OR REPLACE INTO reurb_properties (id, quadra_id, name, area, description, latitude, longitude, status, images, created_at, updated_at, address, tipo_posse, situacao_fundiaria, documentos_comprobatorios, historico_ocupacao, restricoes_ambientais, situacao_cadastral, area_terreno, area_construida, matricula_imovel, data_ocupacao, possui_conflito, descricao_conflito) VALUES \n'
    
    batch_size = 100
    for i in range(0, len(all_values), batch_size):
        batch = all_values[i:i + batch_size]
        filename = f'lotes_parte_{i//batch_size + 1}.sql'
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(headers)
            f.write('(' + '),\n('.join(batch) + ');')
        
        print(f"Arquivo gerado: {filename} ({len(batch)} registros)")

if __name__ == "__main__":
    converter_supabase_para_sqlite()
