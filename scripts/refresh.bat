@echo off
setlocal

rem Regenerates data\tracker.json from the xlsx workbook and pushes it if it changed.
rem Designed to be run unattended (e.g. from Windows Task Scheduler).

cd /d "%~dp0.."
set LOGFILE=%~dp0refresh.log

echo ==== %date% %time% ==== >> "%LOGFILE%"

python scripts\export_tracker.py >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo Export step failed, aborting. >> "%LOGFILE%"
    endlocal
    exit /b 1
)

git add data\tracker.json >> "%LOGFILE%" 2>&1

git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes to commit. >> "%LOGFILE%"
    endlocal
    exit /b 0
)

git commit -m "Automated tracker refresh %date% %time%" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo Commit failed. >> "%LOGFILE%"
    endlocal
    exit /b 1
)

git push >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo Push failed. >> "%LOGFILE%"
    endlocal
    exit /b 1
)

echo Refresh complete and pushed. >> "%LOGFILE%"
endlocal
exit /b 0
