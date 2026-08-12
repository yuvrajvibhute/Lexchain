@echo off
echo ============================================================
echo  LexChain — Push to GitHub (yuvrajvibhute/Lexchain)
echo ============================================================
echo.
echo This will push all Level 4 changes to GitHub.
echo Make sure you are logged in as: yuvrajvibhute
echo.

cd /d "%~dp0"

set /p TOKEN="Enter your GitHub Personal Access Token: "

git remote set-url origin https://yuvrajvibhute:%TOKEN%@github.com/yuvrajvibhute/Lexchain.git

echo.
echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! All Level 4 commits pushed to GitHub!
    echo.
    echo Repository: https://github.com/yuvrajvibhute/Lexchain
    echo.
) else (
    echo.
    echo ❌ Push failed. Check your token and try again.
)

git remote set-url origin https://github.com/yuvrajvibhute/Lexchain.git

echo.
pause
