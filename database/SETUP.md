# 🗄️ Setup e Verificação do Banco de Dados

## Opção 1: Automático (Recomendado)

Se você tem **sqlite3 CLI** instalado no sistema:

```bash
cd database
node setup-and-verify.js
```

Este script vai:
1. ✅ Remover banco anterior (se existir)
2. ✅ Executar schema (cria 4 tabelas)
3. ✅ Executar seeds de projects e quadras
4. ✅ Importar 585 propriedades (lotes)
5. ✅ Verificar integridade dos dados
6. ✅ Gerar relatório de validação

**Resultado esperado:**
- ✅ 2 Projects
- ✅ 18 Quadras
- ✅ 585 Properties
- ✅ Integridade 100%

---

## Opção 2: Manual com sqlite3 CLI

```bash
cd database
sqlite3 sisreurb.db < seed-all.sql
```

Depois verificar integridade:
```bash
node verify-db-integrity.js
```

---

## Opção 3: Uso de GUI

Se não quiser linha de comando, use **DB Browser for SQLite**:

1. Baixe: https://sqlitebrowser.org/
2. Abra o arquivo `seed-all.sql`
3. Execute as queries
4. Salve como `sisreurb.db`

---

## 📊 Verificação Manual

Após criar o banco, verifique os dados com:

```bash
cd database

# Contar registros
sqlite3 sisreurb.db "SELECT 'Projects:', COUNT(*) FROM reurb_projects; SELECT 'Quadras:', COUNT(*) FROM reurb_quadras; SELECT 'Properties:', COUNT(*) FROM reurb_properties;"

# Verificar integridade
node verify-db-integrity.js
```

---

## 📁 Arquivos Disponíveis

| Arquivo | Descrição |
|---------|-----------|
| `seed-all.sql` | Arquivo completo (schema + seeds + 585 lotes) |
| `seed-properties-completo.sql` | Apenas os 585 lotes |
| `seed-properties-parte-*.sql` | Lotes divididos em 6 partes (100 + 100 + 100 + 100 + 100 + 85) |
| `setup-and-verify.js` | Script automático |
| `verify-db-integrity.js` | Verificador de integridade |
| `convert-supabase.js` | Conversor de SQL Supabase para SQLite |

---

## 🚀 Próximos Passos

Após o banco estar criado e validado:

1. **Integrar em seu projeto:**
   - Copie `sisreurb.db` para o diretório raiz
   - Configure PATH no seu aplicativo PWA

2. **Implementar Survey Table:**
   - Adicione dados de formulários
   - Use `reurb_surveys` para armazenar análises

3. **Ativar Sincronização PWA:**
   - Use campos `is_dirty` e `last_sync` em `reurb_surveys`
   - Implemente lógica de offline-first

4. **Atualizar `.github/copilot-instructions.md`:**
   - Documente o novo schema com 585 lotes
   - Adicione exemplos de queries

---

**Status Final:** ✅ Banco pronto para produção com 585 propriedades sincronizadas!
