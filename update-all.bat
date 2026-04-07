@echo off
echo ==========================================
echo   FULL EPG UPDATE PIPELINE (5 PROVIDERS)
echo ==========================================
echo.

echo [1/4] Generating Channel Lists...
call npm run jiotv:generate
call npm run tataplay:generate
call npm run airtel:generate
call npm run dishtv:generate
call npm run epgshare01:generate
echo.

echo [2/4] Grabbing EPG Data (this will take a while)...
echo -- JioTV...
call npm run grab -- --channels=india.channels.xml --output=india.xml --days=2
echo -- Tata Play...
call npm run grab -- --channels=tataplay.channels.xml --output=tataplay.xml --days=2
echo -- Airtel...
call npm run grab -- --channels=india-airtel.channels.xml --output=india-airtel.xml --days=2
echo -- DishTV...
call npm run grab -- --channels=dishtv.channels.xml --output=dishtv.xml --days=2
echo -- EPGShare01...
call npm run grab -- --channels=epgshare01.channels.xml --output=epgshare01.xml --days=2
echo.

echo [3/4] Extracting EPG for App...
call npm run epg:extract -- -i india.xml tataplay.xml india-airtel.xml dishtv.xml epgshare01.xml -o src/epg-data
echo.

echo [4/4] Done! EPG data is ready in src/epg-data
echo ==========================================
pause
