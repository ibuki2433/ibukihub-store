@echo off
cd /d "%~dp0"
echo ===============================================
echo Current folder: %cd%
echo Pushing code to GitHub...
echo ===============================================
git push -u origin main
echo ===============================================
pause
