from fastapi import FastAPI, Depends, HTTPException, status, Request, Form, Query, Cookie
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from databases import Database
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import json
import os
from admin_routes import router as admin_router
from db import database
from dependencies import get_current_user, SECRET_KEY, ALGORITHM, templates, UPLOAD_DIR
from datetime import date, datetime

#DATABASE_URL = "postgresql://postgres:root@localhost/ELibraryDB"

ACCESS_TOKEN_EXPIRE_MINUTES = 30

#database = Database(DATABASE_URL)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Или укажите конкретные разрешённые домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  # Разрешаем доступ к этому заголовку
)

@app.middleware("http")
async def add_expose_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(admin_router)



@app.on_event("startup")
async def startup():
    
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    # Модель для книги
class Book(BaseModel):
    bookid: int
    name: str
    genres: Optional[List[str]] = []
    authors: Optional[str] = None
    description: Optional[str] = None
    rating: float
    downloadcount: int

class BookAuthor(BaseModel):
    firstname: str
    lastname: str

class BookDetails(BaseModel):
    bookid: int
    name: str
    isbn: Optional[str] = None
    authors: Optional[List[BookAuthor]] = []
    genres: Optional[List[str]] = []
    series: Optional[str] = None
    language: Optional[str] = None
    publisher: Optional[str] = None
    publicationyear: Optional[int] = None
    rating: Optional[float] = None
    downloadcount: Optional[int] = None
    description: Optional[str] = None
    formats: Optional[list[str]] = []

class AuthorDetails(BaseModel):
    authorid: int
    firstname: str
    lastname: str
    birthdate: Optional[date] = None,

class Author_get(BaseModel):
    authorid: int
    firstname: str
    lastname: str
    birthdate: Optional[date] = None

class Genre(BaseModel):
    genreid: int
    name: str
    description: Optional[str] = None

class BookSeries(BaseModel):
    seriesid: int
    name: str
    description: Optional[str] = None

class Publisher(BaseModel):
    publisherid: int
    name: str
    foundationyear: Optional[int] = None
    country: Optional[str] = None

class RatingRequest(BaseModel):
    book_id: int
    score: int

class ReviewRequest(BaseModel):
    book_id: int
    comment: str

class BookReview(BaseModel):
    username: str
    comment: str
    reviewdatetime: datetime


@app.get("/auth", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

@app.get("/profile", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("main.html", {"request": request})

@app.get("/search_book", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("search_book.html", {"request": request})


@app.get("/book/{book_id}", response_class=HTMLResponse)
async def read_book(
    book_id: int,
    request: Request
):
    return templates.TemplateResponse(
        "book.html",
        {"request": request, "book_id": book_id}
    )


# Функция для создания JWT токена
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Регистрация пользователя 
@app.post("/register")
async def register_user(user: UserCreate):
    query = "SELECT register_user(:username, :email, :password)"
    try:
        result = await database.execute(query, values={
            "username": user.username,
            "email": user.email,
            "password": user.password
        })
        if not result:
            raise HTTPException(status_code=400, detail="Ошибка регистрации")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Ошибка регистрации: " + str(e))
    return {"message": "Успешная регистрация пользователя"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
bearer_scheme = HTTPBearer()

@app.post("/login")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    query = "SELECT authenticate_user(:username, :password)"
    try:    
        result = await database.fetch_one(query, values={
            "username": form_data.username,
            "password": form_data.password
        })
        if not result or not result[0]:  
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверное имя или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    access_token = create_access_token(data={"sub": form_data.username})

    return {"access_token": access_token, "token_type": "bearer", "usertype": result["authenticate_user"]}

# Изменение пароля пользователя
@app.post("/change_password")
async def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Новый пароль должен содержать не менее 8 символов")

    query = "SELECT change_user_password(:userid, :old_password, :new_password)"
    try:
        result = await database.execute(query, values={
            "userid": current_user["userid"],
            "old_password": old_password,
            "new_password": new_password
        })
        if not result:
            raise HTTPException(status_code=400, detail="Не удалось изменить пароль")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Пароль успешно изменен"}




@app.post("/logout")
async def logout():
    response = JSONResponse(content={"detail": "Logged out successfully"})
    # Удаляем куки с токеном
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="role")
    return response

'''
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    query = "SELECT * FROM AppUser WHERE username = :username"
    user = await database.fetch_one(query, values={"username": username})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
'''




# Маршрут для получения книг
@app.get("/popularbooks", response_model=List[Book])
async def get_books():
    query = """
        SELECT BookID, Name, description, rating, downloadcount
        FROM Book
        ORDER BY downloadcount DESC;
    """
    books = await database.fetch_all(query)
    return books



@app.get("/get_book_reviews", response_model=List[BookReview])
async def get_book_reviews(book_id: int = Query()):
    query = """
        SELECT username, comment, reviewdatetime
        FROM bookReviews
        WHERE bookid = :book_id
        ORDER BY reviewdatetime DESC;
    """
    reviews = await database.fetch_all(query, values={"book_id": book_id})
    return reviews






@app.get("/bookDetails", response_model=BookDetails)
async def get_book_details(book_id: int):
    query = """
        SELECT *
        FROM bookDetails
        WHERE bookid = :book_id;
    """
    book_details = await database.fetch_one(query, values={"book_id": book_id})

    if not book_details:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    # Преобразуем JSON-строки из SQL в Python-объекты
    book_details = dict(book_details)
    book_details["formats"] = json.loads(book_details["formats"])
    book_details["authors"] = json.loads(book_details["authors"])
    if book_details["genres"] == [None]:
        book_details["genres"] = []

    return book_details


@app.get("/authorDetails", response_model=AuthorDetails)
async def get_author_details(author_id: int):
    query = """
        SELECT authorid, firstname, lastname, birthdate
        FROM author
        WHERE authorid = :author_id;
    """
    author_details = await database.fetch_one(query, values={"author_id": author_id})

    if not author_details:
        raise HTTPException(status_code=404, detail="Автор не найден")

    # Преобразуем JSON-строки из SQL в Python-объекты
    author_details = dict(author_details)

    return author_details

@app.get("/genreDetails", response_model=Genre)
async def get_genre_details(genre_id: int):
    query = """
        SELECT genreid, name, description
        FROM genre
        WHERE genreid = :genre_id;
    """
    genre_details = await database.fetch_one(query, values={"genre_id": genre_id})

    if not genre_details:
        raise HTTPException(status_code=404, detail="Жанр не найден")

    # Преобразуем JSON-строки из SQL в Python-объекты
    genre_details = dict(genre_details)

    return genre_details


@app.get("/publisherDetails", response_model=Publisher)
async def get_publisher_details(publisher_id: int):
    query = """
        SELECT publisherid, name, foundationyear, country
        FROM publisher
        WHERE publisherid = :publisher_id;
    """
    publisher_details = await database.fetch_one(query, values={"publisher_id": publisher_id})

    if not publisher_details:
        raise HTTPException(status_code=404, detail="Издательство не найдено")

    # Преобразуем результат запроса в словарь для возврата
    publisher_details = dict(publisher_details)

    return publisher_details


@app.get("/bookseriesDetails", response_model=BookSeries)
async def get_bookseries_details(series_id: int):
    query = """
        SELECT SeriesID, Name, Description
        FROM BookSeries
        WHERE SeriesID = :series_id;
    """
    series_details = await database.fetch_one(query, values={"series_id": series_id})

    if not series_details:
        raise HTTPException(status_code=404, detail="Серия книг не найдена")

    return dict(series_details)


    

@app.get("/bookDownload")
async def download_file(book_id: int, format: str):
    query = """
        SELECT filepath
        FROM bookfile
        WHERE bookid = :book_id AND format = :format;
    """
    file_name = await database.fetch_one(query, values={"book_id": book_id, "format": format})
    file_name = file_name["filepath"]
    file_path = UPLOAD_DIR + str(file_name) + "." + format
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename= file_name + "." + format,  
            media_type="application/octet-stream"
        )
    return {"error": "Файл не найден"}

@app.post("/add_book_download")
async def add_book_download(book_id: int, current_user: dict = Depends(get_current_user)):
   
    query = """
    INSERT INTO book_downloads (userid, bookid) 
    VALUES
    (:user_id, :book_id)
    ON CONFLICT DO NOTHING;
    """
    await database.fetch_one(query, values={"user_id": current_user.userid, "book_id": book_id})
    return {"message": "Ok"}


@app.get("/books/search")
async def search_books(
    name: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    genres: Optional[List[str]] = Query(None),
    language: Optional[str] = Query(None),
    series: Optional[str] = Query(None),
):
    try:
        # Базовый SQL-запрос
        query = """
            SELECT bookid, name, authors, genres, downloadcount, rating
            FROM bookDetails
            WHERE 1=1
        """

        # Параметры для фильтрации
        params = {}

        # Добавляем фильтрацию по названию книги
        if name:
            query += " AND LOWER(name) LIKE LOWER(:name)"
            params["name"] = f"%{name}%"

        # Добавляем фильтрацию по автору
        if author:
            query += " AND LOWER(authors::TEXT) LIKE LOWER(:author)"
            params["author"] = f"%{author}%"

        # Добавляем фильтрацию по жанрам
        if genres:
            query += " AND genres && CAST(:genres AS VARCHAR[])"
            params["genres"] = genres

        # Добавляем фильтрацию по языку
        if language:
            query += " AND LOWER(language) = LOWER(:language)"
            params["language"] = language
            
        if series:
            query += " AND LOWER(series) LIKE LOWER(:series)"
            params["series"] = f"%{series}%"

        # Выполняем запрос
        result = await database.fetch_all(query, params)

        if not result:
            return {"message": "Книги по указанным параметрам не найдены"}
        
        '''
        for row in result:
            row_dict = dict(row)
            if row_dict["genres"] == [None]:
                row_dict["genres"] = []
        '''

        return [dict(row) for row in result]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/add_rating")
async def add_rating(
    rating: RatingRequest,
    current_user: dict = Depends(get_current_user) 
):
    try:
        query = """
            SELECT add_or_update_rating(
                p_user_id:= :userid, p_book_id:= :bookid, p_score:= :score
            )
        """
        await database.execute(query, values={
            "userid": current_user.userid,
            "bookid": rating.book_id,
            "score": rating.score
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Оценка успешно добавлена"}



@app.post("/add_review")
async def add_review(
    review: ReviewRequest,
    current_user: dict = Depends(get_current_user) 
):
    try:
        query = """
            SELECT add_review(
                p_user_id:= :user_id, p_book_id:= :bookid, p_comment:= :comment
            )
        """
        await database.execute(query, values={
            "user_id": current_user.userid,
            "bookid": review.book_id,
            "comment": review.comment
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Отзыв успешно добавлен"}


@app.get("/get_user_score")
async def get_user_score(current_user: dict = Depends(get_current_user), book_id: int = Query()):
    query = """
        SELECT score
        FROM Rating
        WHERE userid = :user_id AND bookid = :book_id;
    """
    score = await database.fetch_one(query, values={"user_id": current_user.userid, "book_id": book_id})
    if not score:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    return score


@app.get("/genres", response_model=List[Genre])
async def get_genres(name: Optional[str] = Query(None)):
    query = """
        SELECT genreid, name, description
        FROM genre
        WHERE 1=1
    """

    # Параметры для фильтрации
    params = {}

    # Добавляем фильтрацию по названию жанра
    if name:
        query += " AND LOWER(name) LIKE LOWER(:name)"
        params["name"] = f"%{name}%"

    query += " ORDER BY modifieddatetime DESC;"

    genres = await database.fetch_all(query, params)
    return genres


@app.get("/publishers", response_model=List[Publisher])
async def get_publishers(name: Optional[str] = Query(None)):
    query = """
        SELECT publisherid, name, foundationyear, country
        FROM Publisher
        WHERE 1=1
    """

    # Параметры для фильтрации
    params = {}

    # Добавляем фильтрацию по названию издательства
    if name:
        query += " AND LOWER(name) LIKE LOWER(:name)"
        params["name"] = f"%{name}%"

    query += " ORDER BY modifieddatetime DESC;"

    publishers = await database.fetch_all(query, params)
    return publishers


@app.get("/bookseries", response_model=List[BookSeries])
async def get_bookseries(name: Optional[str] = Query(None)):
    query = """
        SELECT SeriesID, Name, Description
        FROM BookSeries
        WHERE 1=1
    """

    # Параметры для фильтрации
    params = {}

    # Добавляем фильтрацию по названию серии книг
    if name:
        query += " AND LOWER(name) LIKE LOWER(:name)"
        params["name"] = f"%{name}%"

    query += " ORDER BY ModifiedDateTime DESC;"

    bookseries = await database.fetch_all(query, params)
    return bookseries



@app.get("/get_last_authors", response_model=List[Author_get])
async def get_last_authors(name: Optional[str] = Query(None),):
    query = """
        SELECT AuthorID, FirstName, LastName, birthdate
        FROM Author
        WHERE 1=1
    """

     # Параметры для фильтрации
    params = {}

    # Добавляем фильтрацию по названию книги
    if name:
        query += " AND LOWER(CONCAT(firstname, ' ', lastname)) LIKE LOWER(:name)"
        params["name"] = f"%{name}%"
    
    query += " ORDER BY ModifiedDateTime DESC;"

    authors = await database.fetch_all(query, params)
    
    return authors







@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "email": current_user["email"], "usertype": current_user["usertype"]}


    