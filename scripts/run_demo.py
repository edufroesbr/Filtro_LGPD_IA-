#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para executar demonstrações Playwright do sistema Participa DF
"""

import subprocess
import sys
import os
from pathlib import Path

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def print_header(text):
    """Imprime cabeçalho formatado"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def print_info(text):
    """Imprime informação"""
    print(f"[INFO] {text}")

def print_success(text):
    """Imprime sucesso"""
    print(f"[OK] {text}")

def print_error(text):
    """Imprime erro"""
    print(f"[ERRO] {text}")

def check_node_installed():
    """Verifica se Node.js está instalado"""
    try:
        result = subprocess.run(["node", "--version"], 
                               capture_output=True, 
                               text=True,
                               timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            print_success(f"Node.js encontrado: {version}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    print_error("Node.js NÃO encontrado!")
    print("\n" + "=" * 70)
    print("  ⚠️  ATENÇÃO: Node.js NÃO INSTALADO")
    print("=" * 70)
    print("\nO Node.js é necessário para executar os testes Playwright.")
    print("\n📥 Para instalar o Node.js:")
    print("   1. Acesse: https://nodejs.org/")
    print("   2. Baixe a versão LTS (recomendada)")
    print("   3. Execute o instalador")
    print("   4. Reinicie o terminal após a instalação")
    print("\n💡 Alternativa: Use o backend Python já instalado:")
    print("   python backend/main.py")
    print("\n" + "=" * 70 + "\n")
    return False

def get_npm_cmd():
    """Retorna o comando npm correto para o sistema operacional"""
    if sys.platform == 'win32':
        return "npm.cmd"
    return "npm"

def get_npx_cmd():
    """Retorna o comando npx correto para o sistema operacional"""
    if sys.platform == 'win32':
        return "npx.cmd"
    return "npx"

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    print_info("Verificando dependências...")
    
    # Primeiro, verificar se Node.js está instalado
    if not check_node_installed():
        return False
    
    # Verificar se npm está disponível
    npm_cmd = get_npm_cmd()
    try:
        result = subprocess.run([npm_cmd, "--version"], 
                               capture_output=True, 
                               text=True,
                               timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            print_success(f"npm encontrado: {version}")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print_error("npm não encontrado!")
        print_error("No Windows, tente usar CMD ao invés de PowerShell")
        print_info("Veja FIX_NPM_POWERSHELL.md para mais informações")
        return False
    
    # Verificar se node_modules existe
    if not os.path.exists("node_modules"):
        print_error("node_modules não encontrado. Instalando dependências...")
        try:
            subprocess.run([npm_cmd, "install"], check=True, timeout=300)
            print_success("Dependências instaladas com sucesso!")
        except subprocess.CalledProcessError:
            print_error("Falha ao instalar dependências")
            return False
        except subprocess.TimeoutExpired:
            print_error("Timeout ao instalar dependências")
            return False
    else:
        print_success("node_modules encontrado!")
    
    # Verificar se playwright está instalado
    npx_cmd = get_npx_cmd()
    try:
        result = subprocess.run([npx_cmd, "playwright", "--version"], 
                               capture_output=True, 
                               check=True,
                               timeout=10)
        print_success("Playwright encontrado!")
    except subprocess.CalledProcessError:
        print_error("Playwright não encontrado. Instalando browsers...")
        try:
            subprocess.run([npx_cmd, "playwright", "install"], check=True, timeout=300)
            print_success("Browsers instalados com sucesso!")
        except subprocess.CalledProcessError:
            print_error("Falha ao instalar browsers")
            return False
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print_error("Não foi possível verificar o Playwright")
        return False
    
    return True

def run_command(cmd, description):
    """Executa um comando e retorna o resultado"""
    print_info(f"Executando: {description}")
    print(f"Comando: {' '.join(cmd)}\n")
    
    try:
        result = subprocess.run(cmd, check=False)
        if result.returncode == 0:
            print_success(f"{description} concluído!")
            return True
        else:
            print_error(f"{description} falhou com código {result.returncode}")
            return False
    except Exception as e:
        print_error(f"Erro ao executar {description}: {str(e)}")
        return False

def main():
    """Função principal"""
    print_header("PLAYWRIGHT DEMO RUNNER - Participa DF")
    
    # Mudar para o diretório raiz do projeto
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    print_info(f"Diretorio do projeto: {project_root}")
    
    # Menu de opções
    print("\nEscolha uma opcao:")
    print("  1. Demonstracao Completa (com interface visual)")
    print("  2. Demonstracao Headless (sem interface)")
    print("  3. Simulacao 30 Requisicoes (com interface)")
    print("  4. Simulacao Headless")
    print("  5. Todos os Testes (com interface)")
    print("  6. Todos os Testes (headless)")
    print("  7. Ver Relatorio de Testes Anteriores")
    print("  8. Interface UI Interativa")
    print("  9. Verificar e Instalar Dependencias")
    print("  0. Sair")
    
    choice = input("\nDigite o número da opção: ").strip()
    
    npm_cmd = get_npm_cmd()
    commands = {
        "1": ([npm_cmd, "run", "demo"], "Demonstração Completa"),
        "2": ([npm_cmd, "run", "demo:headless"], "Demonstração Headless"),
        "3": ([npm_cmd, "run", "simulate"], "Simulação 30 Requisições"),
        "4": ([npm_cmd, "run", "simulate:headless"], "Simulação Headless"),
        "5": ([npm_cmd, "run", "test:all"], "Todos os Testes (com interface)"),
        "6": ([npm_cmd, "test"], "Todos os Testes (headless)"),
        "7": ([npm_cmd, "run", "show:report"], "Relatório de Testes"),
        "8": ([npm_cmd, "run", "test:ui"], "Interface UI Interativa"),
        "9": (None, "Verificar Dependências"),
        "0": (None, "Sair"),
    }
    
    if choice not in commands:
        print_error("Opção inválida!")
        return 1
    
    cmd, description = commands[choice]
    
    if choice == "0":
        print_info("Saindo...")
        return 0
    
    if choice == "9":
        # Verificar dependências
        if check_dependencies():
            print_success("Todas as dependências estão instaladas!")
            return 0
        else:
            print_error("Algumas dependências faltam")
            return 1
    
    # Verificar dependências antes de executar
    print_header("Verificando Dependências")
    if not check_dependencies():
        print_error("Por favor, instale as dependências primeiro")
        return 1
    
    # Executar comando escolhido
    print_header(description)
    success = run_command(cmd, description)
    
    if success:
        print_header("✅ SUCESSO!")
        print_info("Screenshots e vídeos salvos em: test-results/")
        if choice in ["1", "2"]:
            print_info("Para ver o relatório HTML, execute: npm run show:report")
    else:
        print_header("❌ FALHA")
        print_info("Verifique os logs acima para mais detalhes")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
