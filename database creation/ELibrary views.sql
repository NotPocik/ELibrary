CREATE VIEW bookDetails AS
SELECT
    b.bookid,
    b.name,
    b.isbn,
    COALESCE(array_to_string(array_agg(DISTINCT CONCAT(a.firstname, ' ', a.lastname)), ', '), '') AS author,
    COALESCE(array_to_string(array_agg(DISTINCT g.name), ', '), '') AS genres,
    s.name AS series,
    b.language,
    p.name AS publisher,
    b.publicationyear,
    b.rating,
    b.downloadcount,
    b.description,
    COALESCE(
        json_agg(DISTINCT bf.format) FILTER (WHERE bf.format IS NOT NULL),
        '[]'::json
    ) AS formats
FROM
    Book b
LEFT JOIN author_book ba ON b.bookid = ba.bookid
LEFT JOIN Author a ON ba.authorid = a.authorid
LEFT JOIN book_genre bg ON b.bookid = bg.bookid
LEFT JOIN Genre g ON bg.genreid = g.genreid
LEFT JOIN BookSeries s ON b.seriesid = s.seriesid
LEFT JOIN Publisher p ON b.publisherid = p.publisherid
LEFT JOIN BookFile bf ON b.bookid = bf.bookid
GROUP BY
    b.bookid, b.name, b.isbn, s.name, b.language, p.name,
    b.publicationyear, b.rating, b.downloadcount, b.description;


select * from bookDetails;



CREATE VIEW bookDetails AS
SELECT
    b.bookid,
    b.name,
    b.isbn,
    COALESCE(array_to_string(array_agg(DISTINCT CONCAT(a.firstname, ' ', a.lastname)), ', '), '') AS author,
    COALESCE(array_agg(DISTINCT g.name), ARRAY[]::TEXT[]) AS genres,
    s.name AS series,
    b.language,
    p.name AS publisher,
    b.publicationyear,
    b.rating,
    b.downloadcount,
    b.description,
    COALESCE(
        json_agg(DISTINCT bf.format) FILTER (WHERE bf.format IS NOT NULL),
        '[]'::json
    ) AS formats
FROM
    Book b
LEFT JOIN author_book ba ON b.bookid = ba.bookid
LEFT JOIN Author a ON ba.authorid = a.authorid
LEFT JOIN book_genre bg ON b.bookid = bg.bookid
LEFT JOIN Genre g ON bg.genreid = g.genreid
LEFT JOIN BookSeries s ON b.seriesid = s.seriesid
LEFT JOIN Publisher p ON b.publisherid = p.publisherid
LEFT JOIN BookFile bf ON b.bookid = bf.bookid
GROUP BY
    b.bookid, b.name, b.isbn, s.name, b.language, p.name,
    b.publicationyear, b.rating, b.downloadcount, b.description;
	
	
	
CREATE VIEW bookReviews AS
SELECT
    u.username,
    r.bookid,
    r.comment,
	r.reviewdatetime
FROM
    Review r
JOIN AppUser u ON r.userid = u.userid;

select * from bookReviews;
	
SELECT username, comment, reviewdatetime
        FROM bookReviews
        WHERE bookid = 31
        ORDER BY reviewdatetime DESC;
	
	
	
CREATE OR REPLACE VIEW bookDetails AS
SELECT
    b.bookid,
    b.name,
    b.isbn,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object('firstname', a.firstname, 'lastname', a.lastname)
        ) FILTER (WHERE a.authorid IS NOT NULL),
        '[]'::json
    ) AS authors,
    COALESCE(array_agg(DISTINCT g.name), ARRAY[]::TEXT[]) AS genres,
    s.name AS series,
    b.language,
    p.name AS publisher,
    b.publicationyear,
    b.rating,
    b.downloadcount,
    b.description,
    COALESCE(
        json_agg(DISTINCT bf.format) FILTER (WHERE bf.format IS NOT NULL),
        '[]'::json
    ) AS formats
FROM
    Book b
LEFT JOIN author_book ba ON b.bookid = ba.bookid
LEFT JOIN Author a ON ba.authorid = a.authorid
LEFT JOIN book_genre bg ON b.bookid = bg.bookid
LEFT JOIN Genre g ON bg.genreid = g.genreid
LEFT JOIN BookSeries s ON b.seriesid = s.seriesid
LEFT JOIN Publisher p ON b.publisherid = p.publisherid
LEFT JOIN BookFile bf ON b.bookid = bf.bookid
GROUP BY
    b.bookid, b.name, b.isbn, s.name, b.language, p.name,
    b.publicationyear, b.rating, b.downloadcount, b.description;

	


