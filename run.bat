@set NODE_PATH=C:\nodejs\demo\npm 
@echo %PATH% | find "Node.js" 
@if %errorlevel% == 1 set PATH=%PATH%;%NODE_PATH% 
@rem @echo %cd% 
@ts-node index.ts
pause