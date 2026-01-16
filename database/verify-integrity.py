#!/usr/bin/env python3
"""
Verificador de integridade do banco de dados de app-sisreurb
Valida relacionamentos entre projetos, quadras e propriedades
"""

import re
import sys
from pathlib import Path

def extract_ids_from_sql(content, pattern):
    """Extrai UUIDs do padrão SQL fornecido"""
    matches = re.findall(pattern, content)
    return set(matches)

def extract_foreign_keys(content, pattern):
    """Extrai pares (id, fk) do SQL"""
    matches = re.findall(pattern, content)
    return matches

def main():
    db_dir = Path(__file__).parent
    
    print("=" * 70)
    print("🔍 VERIFICAÇÃO DE INTEGRIDADE - app-sisreurb")
    print("=" * 70)
    print()
    
    # Ler arquivos
    seed_file = db_dir / "seed.sql"
    prop_file = db_dir / "seed-properties.sql"
    
    with open(seed_file) as f:
        seed_content = f.read()
    with open(prop_file) as f:
        prop_content = f.read()
    
    # ========== PROJETOS ==========
    print("📋 TABELA: reurb_projects")
    print("-" * 70)
    project_ids = extract_ids_from_sql(
        seed_content,
        r"INSERT INTO reurb_projects.*?VALUES\s*\(\s*'([a-f0-9-]{36})'"
    )
    print(f"  Total: {len(project_ids)} projeto(s)")
    for pid in sorted(project_ids):
        if "52b2eaac" in pid:
            print(f"    ✓ {pid} = Marabaixo 1")
        elif "b9230dee" in pid:
            print(f"    ✓ {pid} = Oiapoque")
    print()
    
    # ========== QUADRAS ==========
    print("📋 TABELA: reurb_quadras")
    print("-" * 70)
    quadra_fks = extract_foreign_keys(
        seed_content,
        r"\('([a-f0-9-]{36})',\s*'([a-f0-9-]{36})',\s*'(\d+)'"
    )
    quadra_ids = set()
    quadra_to_project = {}
    
    for quadra_id, project_id, name in quadra_fks:
        quadra_ids.add(quadra_id)
        quadra_to_project[quadra_id] = project_id
    
    print(f"  Total: {len(quadra_ids)} quadra(s)")
    
    # Validar referências
    orphaned_quadras = []
    for qid, pid in quadra_to_project.items():
        if pid not in project_ids:
            orphaned_quadras.append((qid, pid))
    
    if orphaned_quadras:
        print(f"  ⚠️  QUADRAS ÓRFÃS: {len(orphaned_quadras)}")
        for qid, pid in orphaned_quadras:
            print(f"      - {qid} -> projeto inexistente {pid}")
    else:
        print(f"  ✓ Todas as quadras apontam para projetos válidos")
    
    # Contar por projeto
    marabaixo_quadras = sum(1 for pid in quadra_to_project.values() if pid == "52b2eaac-a079-4e3a-90c7-cc6be700d8d1")
    oiapoque_quadras = sum(1 for pid in quadra_to_project.values() if pid == "b9230dee-5a70-4710-a54b-0ac5154f554c")
    
    print(f"    - Marabaixo 1: {marabaixo_quadras} quadra(s)")
    print(f"    - Oiapoque: {oiapoque_quadras} quadra(s)")
    print()
    
    # ========== PROPRIEDADES ==========
    print("📋 TABELA: reurb_properties")
    print("-" * 70)
    prop_fks = extract_foreign_keys(
        prop_content,
        r"\('([a-f0-9-]{36})',\s*'([a-f0-9-]{36})',\s*'([^']+)'"
    )
    prop_ids = set()
    prop_to_quadra = {}
    
    for prop_id, quadra_id, name in prop_fks:
        prop_ids.add(prop_id)
        prop_to_quadra[prop_id] = quadra_id
    
    print(f"  Total: {len(prop_ids)} propriedade(s)")
    
    # Validar referências
    orphaned_props = []
    for pid, qid in prop_to_quadra.items():
        if qid not in quadra_ids:
            orphaned_props.append((pid, qid))
    
    if orphaned_props:
        print(f"  ⚠️  PROPRIEDADES ÓRFÃS: {len(orphaned_props)}")
        for pid, qid in orphaned_props:
            print(f"      - {pid} -> quadra inexistente {qid}")
    else:
        print(f"  ✓ Todas as propriedades apontam para quadras válidas")
    print()
    
    # ========== RESUMO FINAL ==========
    print("=" * 70)
    print("📊 RESUMO FINAL")
    print("=" * 70)
    
    total_issues = len(orphaned_quadras) + len(orphaned_props)
    
    if total_issues == 0:
        print("✅ INTEGRIDADE VALIDADA COM SUCESSO!")
        print()
        print(f"  Projetos:    {len(project_ids):3d}")
        print(f"  Quadras:     {len(quadra_ids):3d}")
        print(f"  Propriedades: {len(prop_ids):3d}")
        print()
        print("  Relacionamentos:")
        print(f"    - Projeto → Quadra: OK ({len(quadra_fks)} referencias)")
        print(f"    - Quadra → Propriedade: OK ({len(prop_fks)} referencias)")
        return 0
    else:
        print(f"❌ PROBLEMAS ENCONTRADOS: {total_issues}")
        print()
        print(f"  Quadras órfãs:     {len(orphaned_quadras)}")
        print(f"  Propriedades órfãs: {len(orphaned_props)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
