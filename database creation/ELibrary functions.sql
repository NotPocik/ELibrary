CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE OR REPLACE FUNCTION register_user(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
	p_usertype VARCHAR DEFAULT 'User'
) RETURNS BOOLEAN AS $$
DECLARE
    v_hashed_password VARCHAR;
BEGIN
    -- Проверка уникальности email
    IF EXISTS (SELECT 1 FROM AppUser WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email already registered';
    END IF;

    -- Проверка уникальности username
    IF EXISTS (SELECT 1 FROM AppUser WHERE username = p_username) THEN
        RAISE EXCEPTION 'Username already taken';
    END IF;

    -- Хеширование пароля
    v_hashed_password := crypt(p_password, gen_salt('bf'));

    -- Вставка нового пользователя
    INSERT INTO AppUser (username, email, hashed_password, usertype)
    VALUES (p_username, p_email, v_hashed_password, p_usertype);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

select register_user('adm1', 'admin1@gmail.com', 'adm', 'Admin');
select register_user('olen', 'olen@gmail.com', 'lol');

SELECT * FROM AppUser;




CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Поиск пользователя по username
    SELECT * INTO v_user FROM AppUser WHERE username = p_username;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Проверка пароля
    IF NOT (v_user.hashed_password = crypt(p_password, v_user.hashed_password)) THEN
        RAISE EXCEPTION 'Incorrect password';
    END IF;

    RETURN v_user.usertype;
END;
$$ LANGUAGE plpgsql;


-- SQL функция для изменения пароля пользователя
CREATE OR REPLACE FUNCTION change_user_password(
    p_userid INTEGER,
    p_old_password VARCHAR,
    p_new_password VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_hashed_password VARCHAR;
    v_user_record RECORD;
BEGIN
    -- Проверяем, существует ли пользователь и совпадает ли старый пароль
    SELECT * INTO v_user_record
    FROM AppUser
    WHERE userid = p_userid AND hashed_password = crypt(p_old_password, hashed_password);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Старый пароль введен неверно';
    END IF;

    -- Хешируем новый пароль
    v_hashed_password := crypt(p_new_password, gen_salt('bf'));

    -- Обновляем пароль пользователя
    UPDATE AppUser
    SET hashed_password = v_hashed_password
    WHERE userid= p_userid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;





CREATE OR REPLACE FUNCTION add_author(
    p_first_name VARCHAR(50),
    p_last_name VARCHAR(50),
    p_birth_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_author_id INTEGER;
BEGIN
    -- Проверка на существование автора
    SELECT AuthorID INTO v_author_id
    FROM Author
    WHERE FirstName = p_first_name AND LastName = p_last_name;

    -- Если автор уже существует, выбрасываем исключение
    IF v_author_id IS NOT NULL THEN
        RAISE EXCEPTION 'Автор с именем "%" и фамилией "%" уже существует', p_first_name, p_last_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Добавление нового автора, если не найден
    INSERT INTO Author (FirstName, LastName, BirthDate)
    VALUES (p_first_name, p_last_name, p_birth_date)
    RETURNING AuthorID INTO v_author_id;

    RETURN v_author_id;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION add_genre(
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_genre_id INTEGER;
BEGIN
    -- Проверка на существование жанра
    SELECT GenreID INTO v_genre_id
    FROM Genre
    WHERE Name = p_name;

    -- Если жанр уже существует, выбрасываем исключение
    IF v_genre_id IS NOT NULL THEN
        RAISE EXCEPTION 'Жанр "%" уже существует', p_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Добавление нового жанра, если не найден
    INSERT INTO Genre (Name, Description)
    VALUES (p_name, p_description)
    RETURNING GenreID INTO v_genre_id;

    RETURN v_genre_id;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION add_bookseries(
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$

DECLARE
    v_bookseries_id INTEGER;
BEGIN
    -- Проверка на существование серии
    SELECT SeriesID INTO v_bookseries_id
    FROM BookSeries
    WHERE Name = p_name;

    -- Если серия уже существует, выбрасываем исключение
    IF v_bookseries_id IS NOT NULL THEN
        RAISE EXCEPTION 'Серия книг "%" уже существует', p_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Добавление новой серии, если не найдена
    INSERT INTO BookSeries (Name, Description)
    VALUES (p_name, p_description)
    RETURNING SeriesID INTO v_bookseries_id;

    RETURN v_bookseries_id;
END;

$$ LANGUAGE plpgsql;



select add_bookseries();

select * from bookseries;




CREATE OR REPLACE FUNCTION add_publisher(
    p_name VARCHAR(100),
    p_foundation_year INTEGER DEFAULT NULL,
    p_country VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_publisher_id INTEGER;
BEGIN
    -- Проверка на существование издательства
    SELECT PublisherID INTO v_publisher_id
    FROM Publisher
    WHERE Name = p_name;

    -- Если издательство уже существует, выбрасываем исключение
    IF v_publisher_id IS NOT NULL THEN
        RAISE EXCEPTION 'Издательство "%" уже существует', p_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Добавление нового издательства, если не найдено
    INSERT INTO Publisher (Name, FoundationYear, Country)
    VALUES (p_name, p_foundation_year, p_country)
    RETURNING PublisherID INTO v_publisher_id;

    RETURN v_publisher_id;
END;
$$ LANGUAGE plpgsql;


select add_publisher();
select * from publisher;



CREATE OR REPLACE FUNCTION add_book(
	p_name VARCHAR(100),
    p_isbn VARCHAR(20) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_language VARCHAR(50) DEFAULT NULL,
    p_publication_year INTEGER DEFAULT NULL,
    p_publisher_name VARCHAR(100) DEFAULT NULL,
    p_publisher_foundation_year INTEGER DEFAULT NULL,
    p_publisher_country VARCHAR(50) DEFAULT NULL,
    p_series_name VARCHAR(100) DEFAULT NULL,
    p_series_description TEXT DEFAULT NULL,
    p_genres JSONB DEFAULT '[]'::JSONB, -- Жанры в формате JSON
    p_authors JSONB DEFAULT '[]'::JSONB -- Авторы в формате JSON
)
RETURNS INTEGER AS $$
DECLARE
    v_publisher_id INTEGER;
    v_series_id INTEGER;
    v_book_id INTEGER;
    v_author_id INTEGER;
    v_genre_id INTEGER;
    v_genre_name VARCHAR(100);
	v_author JSONB;
BEGIN
    -- Проверка названия
    IF EXISTS (SELECT 1 FROM Book WHERE name = p_name) THEN
        RAISE EXCEPTION 'Книга с названием "%" уже существует', p_name;
    END IF;
	
	-- Проверка ISBN
	IF (p_isbn IS NOT NULL) AND (EXISTS (SELECT 1 FROM Book WHERE ISBN = p_isbn)) THEN
        RAISE EXCEPTION 'Книга с ISBN "%" уже существует', p_isbn;
    END IF;

    -- Добавление издательства
    BEGIN
        IF p_publisher_name IS NOT NULL THEN
            v_publisher_id := add_publisher(p_publisher_name, p_publisher_foundation_year, p_publisher_country);
        END IF;
    EXCEPTION WHEN unique_violation THEN
        SELECT PublisherID INTO v_publisher_id
        FROM Publisher
        WHERE Name = p_publisher_name;
    END;

    -- Добавление серии книг
    BEGIN
        IF p_series_name IS NOT NULL THEN
            v_series_id := add_bookseries(p_series_name, p_series_description);
        END IF;
    EXCEPTION WHEN unique_violation THEN
        SELECT SeriesID INTO v_series_id
        FROM BookSeries
        WHERE Name = p_series_name;
    END;

    -- Добавление книги
    INSERT INTO Book (Name, ISBN, Description, Language, PublicationYear, PublisherID, SeriesID)
    VALUES (p_name, p_isbn, p_description, p_language, p_publication_year, v_publisher_id, v_series_id)
    RETURNING BookID INTO v_book_id;

    -- Обработка авторов
    FOR v_author IN SELECT * FROM jsonb_array_elements(p_authors) AS author LOOP
        BEGIN
            v_author_id := add_author(
                v_author->>'first_name',
                v_author->>'last_name',
                TO_DATE(v_author->>'birth_date', 'YYYY-MM-DD')
            );
        EXCEPTION WHEN unique_violation THEN
            SELECT AuthorID INTO v_author_id
            FROM Author
            WHERE FirstName = v_author->>'first_name' AND LastName = v_author->>'last_name';
        END;

        INSERT INTO Author_Book (AuthorID, BookID)
        VALUES (v_author_id, v_book_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Обработка жанров
    FOR v_genre_name IN SELECT value->>'name' FROM jsonb_array_elements(p_genres) AS value LOOP
        BEGIN
            v_genre_id := add_genre(v_genre_name);
        EXCEPTION WHEN unique_violation THEN
            SELECT GenreID INTO v_genre_id
            FROM Genre
            WHERE Name = v_genre_name;
        END;

        INSERT INTO Book_Genre (BookID, GenreID)
        VALUES (v_book_id, v_genre_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN v_book_id;
END;
$$ LANGUAGE plpgsql;


SELECT add_book(
	p_name := 'лолкек',
    p_isbn := '12347478782',
    p_description := 'Двойной лол кек',
    p_publication_year := 2020,
    p_publisher_country := 'USA',
    p_series_name := 'Database Series',
    p_series_description := 'A series on database systems.',
    p_genres := '[{"name": "Technology"}, {"name": "Databases"}, {"name": "Роман"}]'::jsonb,
    p_authors := '[{"first_name": "John", "last_name": "Doe"}, {"first_name": "lolek", "last_name": "olenevski"}]'::jsonb
);

select * from AppUser;
select * from author;
select * from genre;
select * from publisher;
select * from book;
select * from bookseries;
select * from bookdetails;
select * from BookFile;

select * from bookDetails;

SELECT AuthorID, FirstName, LastName, birthdate
        FROM Author
        ORDER BY ModifiedDateTime DESC
        LIMIT 20;


select book.Name as Name, genre.name as genre from
book inner join book_genre on book.bookid = book_genre.bookid
inner join genre on book_genre.genre	id = genre.genreid;





CREATE OR REPLACE FUNCTION add_book_file(
    p_book_id INTEGER,
    p_format VARCHAR(10),
    p_file_path VARCHAR(255)
)
RETURNS VOID AS $$
DECLARE
    v_existing_file INTEGER;
BEGIN
    -- Проверка на существование файла с таким форматом для данной книги
    SELECT 1 INTO v_existing_file
    FROM BookFile
    WHERE BookID = p_book_id AND Format = p_format;

    -- Если файл с таким форматом уже существует для этой книги, выбрасываем исключение
    IF v_existing_file IS NOT NULL THEN
        RAISE EXCEPTION 'Файл с форматом "%" для книги с ID % уже существует', p_format, p_book_id
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Добавление пути к файлу
    INSERT INTO BookFile (BookID, Format, FilePath)
    VALUES (p_book_id, p_format, p_file_path);

    RAISE NOTICE 'Файл для книги с ID % успешно добавлен: формат "%", путь "%"', p_book_id, p_format, p_file_path;
END;
$$ LANGUAGE plpgsql;

select add_book_file(5, 'pdf', 'Математика');


select add_or_update_rating(p_user_id:= 3, p_book_id:= 4, p_score:=6);
select * from Rating;

CREATE OR REPLACE FUNCTION add_or_update_rating(
    p_user_id INTEGER,
    p_book_id INTEGER,
    p_score INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Проверяем, что оценка в допустимом диапазоне
    IF p_score < 1 OR p_score > 10 THEN
        RAISE EXCEPTION 'Оценка должна быть в диапазоне от 1 до 10. Получено: %', p_score;
    END IF;

    -- Обновляем оценку, если она существует
    UPDATE Rating
    SET Score = p_score
    WHERE UserID = p_user_id AND BookID = p_book_id;

    -- Если строка не обновилась, вставляем новую запись
    IF NOT FOUND THEN
        INSERT INTO Rating (Score, UserID, BookID)
        VALUES (p_score, p_user_id, p_book_id)
        ON CONFLICT DO NOTHING; -- Обработка возможных конфликтов
    END IF;

EXCEPTION
    WHEN FOREIGN_KEY_VIOLATION THEN
        RAISE EXCEPTION 'Пользователь или книга с указанным ID не существует (UserID: %, BookID: %).', p_user_id, p_book_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$ LANGUAGE plpgsql;



select add_review(5, 7, 'This book is so bad!!!');
select * from Review;

CREATE OR REPLACE FUNCTION add_review(
    p_user_id INTEGER,
    p_book_id INTEGER,
    p_comment TEXT
) RETURNS VOID AS $$
BEGIN
    -- Проверяем, что комментарий не пустой
    IF TRIM(p_comment) = '' THEN
        RAISE EXCEPTION 'Комментарий не может быть пустым';
    END IF;

    -- Добавляем отзыв
    INSERT INTO Review (Comment, UserID, BookID)
    VALUES (p_comment, p_user_id, p_book_id);

EXCEPTION
    WHEN FOREIGN_KEY_VIOLATION THEN
        RAISE EXCEPTION 'Пользователь или книга с указанным ID не существует (UserID: %, BookID: %)', p_user_id, p_book_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION update_author(
    p_author_id INTEGER,
    p_first_name VARCHAR(50),
    p_last_name VARCHAR(50),
    p_birth_date DATE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Проверка, не существует ли другого автора с такими же именем и фамилией
    IF EXISTS (
        SELECT 1
        FROM Author
        WHERE FirstName = COALESCE(p_first_name, FirstName)
          AND LastName = COALESCE(p_last_name, LastName)
          AND AuthorID != p_author_id
    ) THEN
        RAISE EXCEPTION 'Автор с именем "%" и фамилией "%" уже существует', p_first_name, p_last_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Обновление данных автора
    UPDATE Author
    SET
        FirstName = COALESCE(p_first_name, FirstName),
        LastName = COALESCE(p_last_name, LastName),
        BirthDate = COALESCE(p_birth_date, BirthDate)
    WHERE AuthorID = p_author_id;

    -- Проверка, была ли запись обновлена
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Автор с ID % не найден', p_author_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION update_genre(
	p_genre_id INTEGER,
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Проверка, не существует ли другого жанра с такими же именем
    IF EXISTS (
        SELECT 1
        FROM Genre
        WHERE Name = p_name
          AND GenreID != p_genre_id
    ) THEN
        RAISE EXCEPTION 'Жанр с названием "%" уже существует', p_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Обновление данных жанра
    UPDATE Genre
    SET
        Name = COALESCE(p_name, Name),
        description = p_description
    WHERE GenreID = p_genre_id;

    -- Проверка, была ли запись обновлена
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Жанр с ID % не найден', p_genre_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;




-- Функция обновления издателя
CREATE OR REPLACE FUNCTION update_publisher(
    p_publisher_id INTEGER,
    p_name VARCHAR(100),
    p_foundation_year INTEGER DEFAULT NULL,
    p_country VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Проверка, не существует ли другого издательства с таким же именем
    IF EXISTS (
        SELECT 1
        FROM Publisher
        WHERE Name = p_name
          AND PublisherID != p_publisher_id
    ) THEN
        RAISE EXCEPTION 'Издательство с названием "%" уже существует', p_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Обновление данных издательства
    UPDATE Publisher
    SET
        Name = COALESCE(p_name, Name),
        FoundationYear = p_foundation_year,
        Country = p_country
    WHERE PublisherID = p_publisher_id;

    -- Проверка, была ли запись обновлена
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Издательство с ID % не найдено', p_publisher_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION delete_publisher(
    p_publisher_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Устанавливаем NULL для PublisherID в связанных книгах
    UPDATE Book
    SET PublisherID = NULL
    WHERE PublisherID = p_publisher_id;

    -- Удаляем издательство
    DELETE FROM Publisher
    WHERE PublisherID = p_publisher_id;

    -- Проверка, было ли удалено издательство
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Издательство с ID % не найдено', p_publisher_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


-- SQL-функция для обновления серии книг
CREATE OR REPLACE FUNCTION update_bookseries(
    p_series_id INTEGER,
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Проверка, не существует ли другой серии с таким же именем
    IF EXISTS (
        SELECT 1
        FROM BookSeries
        WHERE Name = p_name
          AND SeriesID != p_series_id
    ) THEN
        RAISE EXCEPTION 'Серия книг с названием "%" уже существует', p_name
            USING ERRCODE = 'unique_violation';
    END IF;

    -- Обновление данных серии
    UPDATE BookSeries
    SET
        Name = COALESCE(p_name, Name),
        Description = p_description
    WHERE SeriesID = p_series_id;

    -- Проверка, была ли запись обновлена
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Серия книг с ID % не найдена', p_series_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



-- SQL-функция для удаления серии книг
CREATE OR REPLACE FUNCTION delete_bookseries(
    p_series_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Устанавливаем NULL для SeriesID в связанных книгах
    UPDATE Book
    SET SeriesID = NULL
    WHERE SeriesID = p_series_id;

    -- Удаляем серию
    DELETE FROM BookSeries
    WHERE SeriesID = p_series_id;

    -- Проверка, была ли удалена серия
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Серия книг с ID % не найдена', p_series_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;




SELECT * FROM delete_book_files(
    p_book_id := 31,
    p_files_to_delete := '["docx", "txt"]'::jsonb
);


CREATE OR REPLACE FUNCTION delete_book_files(
    p_book_id INTEGER,
    p_files_to_delete JSONB -- Список форматов для удаления
)
RETURNS TABLE(file_path VARCHAR(255), file_format VARCHAR(10)) AS $$
BEGIN

    -- Удаление указанных форматов и возврат удалённых файлов
    RETURN QUERY
    DELETE FROM BookFile
    WHERE BookID = p_book_id
      AND Format IN (
          SELECT value::VARCHAR
          FROM jsonb_array_elements_text(p_files_to_delete)
      )
    RETURNING FilePath AS file_path, Format AS file_format;

END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION update_book(
    p_book_id INTEGER,
    p_name VARCHAR(100),
    p_isbn VARCHAR(20) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_language VARCHAR(50) DEFAULT NULL,
    p_publication_year INTEGER DEFAULT NULL,
    p_publisher_name VARCHAR(100) DEFAULT NULL,
    p_series_name VARCHAR(100) DEFAULT NULL,
    p_genres JSONB DEFAULT '[]'::JSONB, -- Жанры в формате JSON
    p_authors JSONB DEFAULT '[]'::JSONB -- Авторы в формате JSON
)
RETURNS VOID AS $$
DECLARE
    v_publisher_id INTEGER;
    v_series_id INTEGER;
    v_author_id INTEGER;
    v_genre_id INTEGER;
    v_genre_name VARCHAR(100);
    v_author JSONB;
BEGIN
    -- Проверка существования книги
    IF NOT EXISTS (SELECT 1 FROM Book WHERE BookID = p_book_id) THEN
        RAISE EXCEPTION 'Книга с ID "%" не найдена', p_book_id;
    END IF;

    -- Проверка ISBN на уникальность
    IF (p_isbn IS NOT NULL) AND (EXISTS (SELECT 1 FROM Book WHERE ISBN = p_isbn AND BookID != p_book_id)) THEN
        RAISE EXCEPTION 'Книга с ISBN "%" уже существует', p_isbn;
    END IF;

    -- Добавление/поиск издательства
    IF p_publisher_name IS NOT NULL THEN
        BEGIN
            v_publisher_id := add_publisher(p_publisher_name, NULL, NULL);
        EXCEPTION WHEN unique_violation THEN
            SELECT PublisherID INTO v_publisher_id
            FROM Publisher
            WHERE Name = p_publisher_name;
        END;
    ELSE
        v_publisher_id := NULL;
    END IF;

    -- Добавление/поиск серии книг
    IF p_series_name IS NOT NULL THEN
        BEGIN
            v_series_id := add_bookseries(p_series_name, NULL);
        EXCEPTION WHEN unique_violation THEN
            SELECT SeriesID INTO v_series_id
            FROM BookSeries
            WHERE Name = p_series_name;
        END;
    ELSE
        v_series_id := NULL;
    END IF;

    -- Обновление основной информации о книге
    UPDATE Book
    SET
        Name = p_name,
        ISBN = p_isbn,
        Description = p_description,
        Language = p_language,
        PublicationYear = p_publication_year,
        PublisherID = v_publisher_id,
        SeriesID = v_series_id
    WHERE BookID = p_book_id;

    -- Удаление и обновление авторов
	DELETE FROM Author_Book WHERE BookID = p_book_id;

	FOR v_author IN SELECT * FROM jsonb_array_elements(p_authors) LOOP
		BEGIN
			v_author_id := add_author(
				v_author->>'first_name',
				v_author->>'last_name',
				TO_DATE(v_author->>'birth_date', 'YYYY-MM-DD')
			);
		EXCEPTION WHEN unique_violation THEN
			SELECT AuthorID INTO v_author_id
			FROM Author
			WHERE FirstName = v_author->>'first_name' AND LastName = v_author->>'last_name';
		END;

		INSERT INTO Author_Book (AuthorID, BookID)
		VALUES (v_author_id, p_book_id)
		ON CONFLICT DO NOTHING;
	END LOOP;

    -- Удаление и обновление жанров
	DELETE FROM Book_Genre WHERE BookID = p_book_id;

	FOR v_genre_name IN SELECT value->>'name' FROM jsonb_array_elements(p_genres) LOOP
		BEGIN
			v_genre_id := add_genre(v_genre_name);
		EXCEPTION WHEN unique_violation THEN
			SELECT GenreID INTO v_genre_id
			FROM Genre
			WHERE Name = v_genre_name;
		END;

		INSERT INTO Book_Genre (BookID, GenreID)
		VALUES (p_book_id, v_genre_id)
		ON CONFLICT DO NOTHING;
	END LOOP;

END;
$$ LANGUAGE plpgsql;






insert into genre (name, description)
values
('Роман', 'Роман – это увлекательное путешествие по внутреннему миру героев и развернутым сюжетам. Здесь раскрываются многослойные истории любви, предательства, страсти и поисков себя. Роман позволяет не просто наблюдать за персонажами, но и переживать вместе с ними каждую победу и поражение, погружаясь в бескрайние горизонты повествования.'),
('Рассказ', 'Короткая форма литературы, где каждая строчка имеет значение, а каждая деталь работает на эффектную развязку. Рассказ часто ставит острые вопросы, раскрывает одну тему или переживание и заставляет задуматься над концовкой, давая читателю возможность додумать судьбу героев самостоятельно.'),
('Эссе', 'Эссе – это жанр размышлений, позволяющий прикоснуться к мыслям автора, его философии и взгляду на мир. Оно может быть личным, душевным, глубоким и часто предлагает нестандартный взгляд на повседневные вопросы. В эссе мы видим размышления, которые балансируют между логикой и интуицией.'),
('Пьеса', 'Пьеса приглашает нас за кулисы театра, где жизнь оживает на сцене. Каждый диалог и каждая реплика в пьесе несет смысл, который раскрывается в игре актеров. Трагедии, комедии и драмы позволяют зрителю прожить вместе с героями самые сильные эмоции, заставляют смеяться и плакать.'),
('Поэма', 'Поэма – это симфония слов, которая переносит нас в мир высоких чувств и больших событий. Поэтическая форма поэм позволяет проживать историю в каждом ритме, каждом звуке и паузе. Она может быть эпической – о битвах и героях, или лирической – о переживаниях души.'),
('Трагедия', 'Трагедия раскрывает глубину человеческих эмоций, где каждый поступок может привести к фатальным последствиям. В центре трагедии – борьба с неотвратимой судьбой, страдания героя и поиск смысла среди боли. Этот жанр заставляет задуматься о хрупкости жизни и нашей ответственности за свои действия.'),
('Комедия', 'Комедия – жанр, где юмор и ирония разоблачают недостатки и слабости общества и человека. Она часто высмеивает человеческие привычки, выставляя их в смешном свете. Комедии поднимают настроение и напоминают нам, что жизнь – не только драма, но и источник радости и смеха.'),
('Фантастика', 'Фантастика открывает двери в неизведанные миры, позволяет вообразить технологии будущего и жизнь за пределами реальности. Этот жанр уносит нас на планеты, которых нет на карте, среди существ, придуманных воображением, и в будущее, полное загадок и открытий.'),
('Детектив', 'Детектив – это жанр логики и интриги, где каждое событие, каждый поступок имеет значение. Вместе с детективом-героем читатель отправляется по следу преступника, разгадывая головоломки и распутывая сети улик. Здесь царит напряжение, тайна и острота умственного поиска.'),
('Приключения', 'Приключенческий жанр дарит дух свободы и рискованных поступков. Здесь герои отправляются в далекие страны и совершают смелые поступки, попадают в опасные ситуации и становятся сильнее с каждой страницей. Это истории о победах, дружбе и испытаниях, о преодолении трудностей и жажде открытий.'),
('Исторический роман', 'Исторический роман переносит нас в ушедшие эпохи, когда в мире правили короли и велись войны за корону. В этих книгах оживает прошлое, раскрываются традиции, наряды и характеры людей былых времен. Исторический роман учит нас ценить наследие и понимать, как прошлое формирует настоящее.'),
('Биография и автобиография', 'Биографии и автобиографии открывают нам личности великих людей, их жизненные истории и путь к успеху. Они рассказывают о трудностях, мечтах и стремлениях, с которыми сталкивались реальные люди. Этот жанр вдохновляет, дает надежду и позволяет увидеть историю глазами тех, кто её творил.'),
('Мемуары', 'Мемуары – это воспоминания автора, записанные для того, чтобы сохранить важные моменты своей жизни. Это жанр личных историй и наблюдений, пропитанных эмоциями и опытом. Мемуары позволяют увидеть мир глазами другого человека и понять, как его события перекликаются с нашими.'),
('Фэнтези', 'Фэнтези – это жанр волшебства, где царит магия и живут драконы. Миры фэнтези населены необычными существами, а главные герои обладают магическими способностями или проходят трудный путь, чтобы спасти мир. Этот жанр дарит веру в чудеса и напоминает, что иногда мечты становятся реальностью.'),
('Научная литература', 'Научная литература раскрывает сложные темы и объясняет законы природы и общества. Эти книги охватывают широкий спектр знаний, от астрономии до биологии, и помогают лучше понимать мир вокруг нас. Научная литература учит критически мыслить и расширяет наш кругозор.'),
('Философская литература', 'Философские книги предлагают взглянуть на мир глазами мыслителей и погрузиться в вопросы бытия, морали и смысла жизни. Этот жанр заставляет читателя задавать вопросы, которые касаются всех, и находить личные ответы на вечные загадки.'),
('Психологический триллер', 'Психологический триллер исследует тёмные стороны человеческой психики, ловко манипулируя напряжением и эмоциями. Здесь всё не так просто, как кажется, и каждый персонаж скрывает тайны. Эти книги часто ведут читателя по лабиринту ума, оставляя его наедине со страхом и загадками.'),
('Научно-популярная литература', 'Научно-популярные книги раскрывают научные темы доступным и увлекательным языком. Это истории о достижениях человечества, открытиях и гипотезах. Этот жанр делает сложные концепции простыми и вдохновляет на новые знания и исследования.'),
('Романтика', 'Романтические книги наполняют сердце теплом и рассказывают о магии любви, которая преодолевает все преграды. Здесь герои проходят через испытания ради своей любви, раскрывая светлые и темные стороны отношений. Эти истории оставляют ощущение, что любовь – это сила, которая может изменить всё.');




