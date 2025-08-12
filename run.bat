@echo off
:loop
node .
if %errorlevel% neq 0 (
    echo The app crashed. Restarting...
    timeout /t 2
)
goto loop
