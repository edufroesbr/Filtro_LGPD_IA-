@echo off
REM Script Windows Batch para executar demonstrações Playwright
REM Uso: run_demo.bat [opcao]

echo.
echo ========================================
echo   PLAYWRIGHT DEMO - Participa DF
echo ========================================
echo.

if "%1"=="" goto menu
if "%1"=="demo" goto demo
if "%1"=="simulate" goto simulate
if "%1"=="all" goto all
goto invalid

:menu
echo Escolha uma opcao:
echo.
echo   1. Demonstracao Completa (com interface)
echo   2. Simulacao 30 Requisicoes (com interface)
echo   3. Todos os Testes
echo   4. Ver Relatorio
echo.
set /p choice="Digite o numero: "

if "%choice%"=="1" goto demo
if "%choice%"=="2" goto simulate
if "%choice%"=="3" goto all
if "%choice%"=="4" goto report
goto invalid

:demo
echo.
echo Executando demonstracao completa...
call npm run demo
goto end

:simulate
echo.
echo Executando simulacao de 30 requisicoes...
call npm run simulate
goto end

:all
echo.
echo Executando todos os testes...
call npm run test:all
goto end

:report
echo.
echo Abrindo relatorio de testes...
call npm run show:report
goto end

:invalid
echo.
echo Opcao invalida!
echo Uso: run_demo.bat [demo^|simulate^|all]
goto end

:end
echo.
echo Concluido!
pause
