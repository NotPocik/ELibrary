from fastapi import APIRouter, Depends, HTTPException, status, Request, File, UploadFile, Form, Body
from fastapi.responses import HTMLResponse
from dependencies import get_current_admin, templates, UPLOAD_DIR, DELETED_BOOKS_DIR
from db import database
from typing import List, Optional, Dict
from pydantic import BaseModel
import json
from datetime import datetime, date
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.exc import IntegrityError
import os
import shutil

#import sklearn
#import joblib

#from predictor import predict_genres 


'''
model = None
vectorizer = None
mlb = None

def load_model():
    global model, vectorizer, mlb
    if model is None or vectorizer is None or mlb is None:
        model = joblib.load("genre_predictor_50.pkl")
        vectorizer = joblib.load(r"D:\\Projects\\Python\\ELibraryTest\\tfidf_vectorizer_50.pkl")
        mlb = joblib.load(r"D:\\Projects\\Python\\ELibraryTest\\mlb_50.pkl")


'''


router = APIRouter(prefix="/admin", tags=["Admin"])



class Book_add(BaseModel):
    name: str
    isbn: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    publication_year: Optional[int] = None
    publisher_name: Optional[str] = None
    series_name: Optional[str] = None
    authors: Optional[List[Dict[str, str]]] = None
    genres: Optional[List[Dict[str, str]]] = None

class Author_get(BaseModel):
    authorid: int
    firstname: str
    lastname: str
    birthdate: Optional[date] = None
    
    




@router.get("/", response_class=HTMLResponse)
async def admin_panel(request: Request):
    #load_model()
    return templates.TemplateResponse("admin.html", {"request": request})

@router.post("/add_book")
async def add_book(
    name: str = Form(...),
    description: str = Form(...),
    isbn: str = Form(...),
    language: str = Form(...),
    publication_year: Optional[int] = Form(None),
    publisher_name: str = Form(...),
    series_name: str = Form(...),
    authors: str = Form(...),  # JSON-строка с авторами
    genres: str = Form(...),   # JSON-строка с жанрами
    files: list[UploadFile] = File(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    # Преобразуем входные параметры
    name = empty_to_none(name)
    description = empty_to_none(description)
    isbn = empty_to_none(isbn)
    language = empty_to_none(language)
    publisher_name = empty_to_none(publisher_name)
    series_name = empty_to_none(series_name)
    authors_data = json.loads(authors) if authors.strip() else None
    genres_data = json.loads(genres) if genres.strip() else None

    print(publication_year)
    try:
        # Преобразование authors и genres в JSON для передачи в SQL
        authors_json = json.dumps(authors_data) if authors_data else None
        genres_json = json.dumps(genres_data) if genres_data else None

        # SQL-запрос для добавления книги
        query = """
            SELECT add_book(
                p_name := :name, p_isbn := :isbn, p_description := :description, p_language := :language, 
                p_publication_year := :publication_year, p_publisher_name := :publisher_name, 
                p_series_name := :series_name, p_authors := :authors, p_genres := :genres
            ) AS book_id
        """
        # Выполнение запроса
        result = await database.fetch_one(query, values={
            "name": name,
            "isbn": isbn,
            "description": description,
            "language": language,
            "publication_year": publication_year,
            "publisher_name": publisher_name,
            "series_name": series_name,
            "authors": authors_json,
            "genres": genres_json
        })

        if not result:
            raise HTTPException(status_code=500, detail="Не удалось добавить книгу")

        book_id = result["book_id"]

        # Обработка файлов
        if files:
            for file in files:
                file_ext = file.filename.split(".")[-1]
                file_ext = file_ext.lower()
                new_filename = f"{name}_{file_ext}".replace(" ", "_")  # Убираем пробелы
                file_path = os.path.join(UPLOAD_DIR, f"{new_filename}.{file_ext}")

                # Сохраняем файл
                with open(file_path, "wb") as f:
                    f.write(await file.read())

                # Сохраняем файл в базу данных
                add_file_query = """
                    SELECT add_book_file(
                        p_book_id := :book_id,
                        p_format := :file_format,
                        p_file_path := :file_path
                    )
                """
                try:
                    await database.execute(add_file_query, values={
                        "book_id": book_id,
                        "file_format": file_ext,
                        "file_path": new_filename
                    })
                except IntegrityError:
                    os.remove(file_path)  # Удаляем файл, если возникла ошибка
                    raise HTTPException(status_code=400, detail=f"Файл с форматом '{file_ext}' уже существует.")

        return {"message": "Книга успешно добавлена", "book_id": book_id}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/add_publisher")
async def add_publisher(
    name: str = Form(...),
    foundation_year: Optional[int] = Form(None),
    country: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    name = empty_to_none(name)
    country = empty_to_none(country)

    try:
        query = """
            SELECT add_publisher(
                p_name := :name,
                p_foundation_year := :foundation_year,
                p_country := :country
            )
        """
        await database.execute(query, values={
            "name": name,
            "foundation_year": foundation_year,
            "country": country
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"{str(e)}")

    return {"message": "Издательство успешно добавлено"}



@router.put("/update_publisher")
async def update_publisher(
    publisher_id: int = Form(...),
    name: str = Form(...),
    foundation_year: Optional[int] = Form(None),
    country: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    name = empty_to_none(name)
    country = empty_to_none(country)

    try:
        query = """
            SELECT update_publisher(
                p_publisher_id := :publisher_id,
                p_name := :name,
                p_foundation_year := :foundation_year,
                p_country := :country
            )
        """
        await database.execute(query, values={
            "publisher_id": publisher_id,
            "name": name,
            "foundation_year": foundation_year,
            "country": country
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Издательство успешно обновлено"}



@router.post("/add_author")
async def add_author(
    first_name: str = Form(...),
    last_name: str = Form(...),
    birth_date: Optional[date] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    try:
        query = """
            SELECT add_author(
                p_first_name := :first_name, p_last_name := :last_name, p_birth_date := :birth_date
            )
        """
        await database.execute(query, values={
            "first_name": first_name,
            "last_name": last_name,
            "birth_date": birth_date
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"{str(e)}")

    return {"message": "Автор успешно добавлен"}



@router.put("/update_author")
async def update_author(
    author_id: int = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    birth_date: Optional[date] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):

    try:
        first_name = empty_to_none(first_name)
        last_name = empty_to_none(last_name)

        query = """
            SELECT update_author(
                p_author_id := :author_id,
                p_first_name := :first_name,
                p_last_name := :last_name,
                p_birth_date := :birth_date
            )
        """
        await database.execute(query, values={
            "author_id": author_id,
            "first_name": first_name,
            "last_name": last_name,
            "birth_date": birth_date
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Автор успешно обновлен"}


@router.post("/add_bookseries")
async def add_bookseries(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    name = empty_to_none(name)
    description = empty_to_none(description)

    try:
        query = """
            SELECT add_bookseries(
                p_name := :name,
                p_description := :description
            )
        """
        await database.execute(query, values={
            "name": name,
            "description": description
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"{str(e)}")

    return {"message": "Серия книг успешно добавлена"}


@router.put("/update_bookseries")
async def update_bookseries(
    series_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    name = empty_to_none(name)
    description = empty_to_none(description)

    try:
        query = """
            SELECT update_bookseries(
                p_series_id := :series_id,
                p_name := :name,
                p_description := :description
            )
        """
        await database.execute(query, values={
            "series_id": series_id,
            "name": name,
            "description": description
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Серия книг успешно обновлена"}


def empty_to_none(value: str):
    return value if value != "" else None






@router.get("/get_last_authors", response_model=List[Author_get])
async def get_last_authors():
    query = """
        SELECT AuthorID, FirstName, LastName, birthdate
        FROM Author
        ORDER BY ModifiedDateTime DESC
        LIMIT 20;
    """
    authors = await database.fetch_all(query)
    return authors


@router.post("/add_genre")
async def add_genre(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    description = empty_to_none(description)
    try:
        query = """
            SELECT add_genre(
                p_name := :name, p_description := :description
            )
        """
        await database.execute(query, values={
            "name": name,
            "description": description
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"{str(e)}")

    return {"message": "Жанр успешно добавлен"}


@router.put("/update_genre")
async def update_genre(
    genre_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):

    try:
        name = empty_to_none(name)
        description = empty_to_none(description)

        query = """
            SELECT update_genre(
                p_genre_id := :genre_id,
                p_name := :name,
                p_description := :description
            )
        """
        await database.execute(query, values={
            "genre_id": genre_id,
            "name": name,
            "description": description
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Жанр успешно обновлен"}






@router.delete("/delete_book/{book_id}")
async def delete_book(book_id: int, current_admin: dict = Depends(get_current_admin)):
   
    try:
        query = """
            SELECT filepath, format
            FROM bookfile
            WHERE bookid = :book_id;
        """

        book_files = await database.fetch_all(query, values={"book_id": book_id})

        # Перемещаем файлы в папку `deleted_book_files`
        for file in book_files:
            source = f"{UPLOAD_DIR}{file["filepath"]}.{file["format"]}"
            target = f"{DELETED_BOOKS_DIR}{file["filepath"]}.{file["format"]}"
            shutil.move(source, target)

        # Удаляем книгу
        result = await database.fetch_one("DELETE FROM book WHERE bookid = :book_id RETURNING bookid;", values={"book_id": book_id})
        if not result:
            raise HTTPException(status_code=404, detail="Книга не найдена")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Книга успешно удалена"}



@router.delete("/delete_author/{author_id}")
async def delete_author(author_id: int, current_admin: dict = Depends(get_current_admin)):
   
    try:
        result = await database.fetch_one("DELETE FROM author WHERE authorid = :author_id RETURNING authorid;", values={"author_id": author_id})
        if not result:
            raise HTTPException(status_code=404, detail="Автор не найден")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Автор успешно удален"}


@router.delete("/delete_genre/{genre_id}")
async def delete_genre(genre_id: int, current_admin: dict = Depends(get_current_admin)):
   
    try:
        result = await database.fetch_one("DELETE FROM genre WHERE genreid = :genre_id RETURNING genreid;", values={"genre_id": genre_id})
        if not result:
            raise HTTPException(status_code=404, detail="Жанр не найден")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Жанр успешно удален"}



@router.delete("/delete_publisher/{publisher_id}")
async def delete_publisher(publisher_id: int, current_admin: dict = Depends(get_current_admin)):
    try:
        query = """
            SELECT delete_publisher(
                p_publisher_id := :publisher_id
            )
        """
        result = await database.execute(query, values={"publisher_id": publisher_id})

        if not result:
            raise HTTPException(status_code=404, detail="Издательство не найдено")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Издательство успешно удалено"}



@router.delete("/delete_bookseries/{series_id}")
async def delete_bookseries(series_id: int, current_admin: dict = Depends(get_current_admin)):
    try:
        query = """
            SELECT delete_bookseries(
                p_series_id := :series_id
            )
        """
        result = await database.execute(query, values={"series_id": series_id})

        if not result:
            raise HTTPException(status_code=404, detail="Серия книг не найдена")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Серия книг успешно удалена"}



@router.put("/update_book_files")
async def update_book_files(
    book_id: int,
    files_to_delete: Optional[str] = Form(None),  # Список форматов для удаления
    files_to_add: Optional[list[UploadFile]] = File(None),  # Список файлов для добавления
    current_admin: dict = Depends(get_current_admin)   # Проверка на админа
):
    try:
        print(files_to_delete)
        # Преобразование данных для удаления
        # Получение имени книги из БД
        book_name_result = await database.fetch_one(
            "SELECT name FROM Book WHERE bookid = :book_id",
            values={"book_id": book_id}
        )
        if not book_name_result:
            raise HTTPException(status_code=404, detail="Книга не найдена")
        book_name = book_name_result["name"]

        print(files_to_delete)

        deleted_files = []
        # Удаление файлов в БД
        if files_to_delete:
            query = """
                SELECT file_path, file_format 
                FROM delete_book_files(
                    p_book_id := :book_id,
                    p_files_to_delete := :files_to_delete
                )
            """

            deleted_files = await database.fetch_all(query, values={
                "book_id": book_id,
                "files_to_delete": files_to_delete
            })
            print(deleted_files)
            # Перемещение файлов в DELETED_BOOKS_DIR
            for file in deleted_files:
                old_file_path = os.path.join(UPLOAD_DIR, f"{file['file_path']}.{file['file_format']}")
                deleted_file_path = os.path.join(DELETED_BOOKS_DIR, f"{file['file_path']}.{file['file_format']}")
                if os.path.exists(old_file_path):
                    shutil.move(old_file_path, deleted_file_path)

        # Добавление новых файлов
        if files_to_add:
            for file in files_to_add:
                # Генерация имени и формата файла
                file_ext = file.filename.split(".")[-1].lower()
                new_filename = f"{book_name}_{file_ext}".replace(" ", "_")  # Убираем пробелы
                file_path = os.path.join(UPLOAD_DIR, f"{new_filename}.{file_ext}")

                # Сохранение файла на диск
                with open(file_path, "wb") as f:
                    f.write(await file.read())

                # Добавление записи в БД через SQL-функцию add_book_file
                add_file_query = """
                    SELECT add_book_file(
                        p_book_id := :book_id,
                        p_format := :file_format,
                        p_file_path := :file_path
                    )
                """
                await database.execute(add_file_query, values={
                    "book_id": book_id,
                    "file_format": file_ext,
                    "file_path": new_filename
                })

        return {"message": "Файлы книги успешно обновлены", "deleted_files": deleted_files}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.put("/update_book")
async def   update_book(
    book_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    publication_year: Optional[int] = Form(None),
    publisher_name: Optional[str] = Form(None),
    series_name: Optional[str] = Form(None),
    authors: Optional[str] = Form(None),  # JSON-строка с авторами
    genres: Optional[str] = Form(None),   # JSON-строка с жанрами
    current_admin: dict = Depends(get_current_admin)  # Проверка на админа
):
    # Преобразуем входные параметры
    name = empty_to_none(name)
    description = empty_to_none(description)
    isbn = empty_to_none(isbn)
    language = empty_to_none(language)
    publisher_name = empty_to_none(publisher_name)
    series_name = empty_to_none(series_name)

    # Обрабатываем authors и genres
    authors_data = json.loads(authors) if authors else []
    genres_data = json.loads(genres) if genres else []
    authors_json = json.dumps(authors_data)
    genres_json = json.dumps(genres_data)

    try:
        # SQL-запрос для обновления книги
        query = """
            SELECT update_book(
                p_book_id := :book_id,
                p_name := :name,
                p_isbn := :isbn,
                p_description := :description,
                p_language := :language,
                p_publication_year := :publication_year,
                p_publisher_name := :publisher_name,
                p_series_name := :series_name,
                p_authors := :authors,
                p_genres := :genres
            );
        """
        # Выполнение запроса
        await database.execute(query, values={
            "book_id": book_id,
            "name": name,
            "isbn": isbn,
            "description": description,
            "language": language,
            "publication_year": publication_year,
            "publisher_name": publisher_name,
            "series_name": series_name,
            "authors": authors_json,
            "genres": genres_json,
        })

        return {"message": "Книга успешно обновлена."}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

'''
# Функция для предобработки текста
def preprocess_text(text):
    # Удаляем пунктуацию и приводим к нижнему регистру
    text = text.translate(str.maketrans('', '', string.punctuation)).lower()
    # Токенизация
    tokens = word_tokenize(text)
    # Удаление стоп-слов и лемматизация
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return ' '.join(tokens)

def predict_genres(description):
    # Предобработка текста
    processed_text = preprocess_text(description)

    # Преобразование текста и предсказание
    text_tfidf = vectorizer.transform([processed_text])
    return mlb.inverse_transform(model.predict(text_tfidf))


'''