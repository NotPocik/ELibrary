CREATE OR REPLACE FUNCTION update_average_rating(p_book_id INTEGER) RETURNS VOID AS $$
BEGIN
    -- Вычисляем средний рейтинг книги
    UPDATE Book
    SET Rating = COALESCE((
        SELECT AVG(Score)::NUMERIC(3, 2)
        FROM Rating
        WHERE BookID = p_book_id
    ), 0) -- Если оценок нет, устанавливаем рейтинг в 0
    WHERE BookID = p_book_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trigger_update_book_rating() RETURNS TRIGGER AS $$
BEGIN
    -- Пересчитываем средний рейтинг для книги
    PERFORM update_average_rating(NEW.BookID);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_book_rating
AFTER INSERT OR UPDATE ON Rating
FOR EACH ROW
EXECUTE FUNCTION trigger_update_book_rating();






CREATE OR REPLACE FUNCTION update_modified_datetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ModifiedDateTime = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION update_book_modified_datetime()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.Rating IS DISTINCT FROM OLD.Rating) 
      THEN
	  	RETURN NEW;
    END IF;
	
	NEW.ModifiedDateTime = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER trigger_update_modified_datetime_book
BEFORE UPDATE ON Book
FOR EACH ROW
EXECUTE FUNCTION update_book_modified_datetime();


CREATE TRIGGER trigger_update_modified_datetime_author
BEFORE UPDATE ON Author
FOR EACH ROW
EXECUTE FUNCTION update_modified_datetime();

CREATE TRIGGER trigger_update_modified_datetime_genre
BEFORE UPDATE ON Genre
FOR EACH ROW
EXECUTE FUNCTION update_modified_datetime();

CREATE TRIGGER trigger_update_modified_datetime_publisher
BEFORE UPDATE ON Publisher
FOR EACH ROW
EXECUTE FUNCTION update_modified_datetime();

CREATE TRIGGER trigger_update_modified_datetime_bookseries
BEFORE UPDATE ON BookSeries
FOR EACH ROW
EXECUTE FUNCTION update_modified_datetime();
