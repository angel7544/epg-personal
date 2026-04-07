@echo off
echo ==========================================
echo   Airtel Xstream EPG Update Workflow
echo ==========================================

echo Step 1: Generating Channel Lists...
call npm run airtel:generate

if %errorlevel% neq 0 (
    echo Error during channel generation.
    exit /b %errorlevel%
)

echo Step 2: Fetching EPG Data (XML)...
call npm run grab -- --channels=india-airtel.channels.xml --output=india-airtel.xml

if %errorlevel% neq 0 (
    echo Error during EPG grabbing.
    exit /b %errorlevel%
)

echo Step 3: Extracting JSON for App...
call npm run epg:extract -- --input india-airtel.xml --output ../vega-app/src/epg-data

if %errorlevel% neq 0 (
    echo Error during JSON extraction.
    exit /b %errorlevel%
)

echo ==========================================
echo   Update Complete!
echo ==========================================
pause
