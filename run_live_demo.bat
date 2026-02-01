@echo off
REM ========================================
REM Live e-SIC Demo - Batch Script
REM ========================================

echo.
echo ========================================
echo   LIVE e-SIC DATA SIMULATION
echo ========================================
echo.
echo Este teste ira:
echo   1. Ler dados reais do arquivo AMOSTRA_e-SIC.xlsx
echo   2. Simular 20 submissoes ao vivo
echo   3. Gerar arquivo CSV dinamicamente
echo   4. Mostrar o dashboard atualizado
echo.
echo Pressione qualquer tecla para iniciar...
pause > nul

echo.
echo [*] Iniciando simulacao ao vivo...
echo.

node node_modules\playwright\cli.js test tests/test_live_esic_demo.spec.js --headed --workers=1

echo.
echo ========================================
echo   SIMULACAO CONCLUIDA
echo ========================================
echo.
echo Arquivos gerados:
echo   - CSV: data\classifications.csv
echo   - Screenshots: test-results\live-demo\
echo.
echo Pressione qualquer tecla para sair...
pause > nul
