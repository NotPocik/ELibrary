from db import database
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
#from typing import List, Optional, Dict
#from main import SECRET_KEY, ALGORITHM  # Если нужно получить ключ и алгоритм из main.py

templates = Jinja2Templates(directory="templates")

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
UPLOAD_DIR = "D:\\Projects\\Python\\ELibraryTest\\book_files\\"
DELETED_BOOKS_DIR = "D:\\Projects\\Python\\ELibraryTest\\deleted_book_files\\"





async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    # Получаем токен из заголовка
    token = credentials.credentials if credentials else None

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing")

    try:
        # Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Вы не авторизованы")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Вы не авторизованы")

    # Проверяем пользователя в базе данных
    query = "SELECT * FROM AppUser WHERE username = :username"
    user = await database.fetch_one(query, values={"username": username})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    return user


'''
async def get_optional_user_dependency(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer()),
):
    return await get_current_user(request, credentials=credentials, optional=True)
'''





async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["usertype"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав для доступа")
    return current_user
