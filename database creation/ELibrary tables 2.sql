-- Table AppUser
CREATE TABLE AppUser (
    UserID SERIAL PRIMARY KEY,
    UserType VARCHAR(50),
    Username VARCHAR(50) UNIQUE NOT NULL,
    RegistrationDate DATE NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL
);

-- Table Author
CREATE TABLE Author (
    AuthorID SERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    BirthDate DATE
);

ALTER TABLE Author
ADD COLUMN ModifiedDateTime TIMESTAMP DEFAULT NOW();

-- Table Publisher
CREATE TABLE Publisher (
    PublisherID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    FoundationYear INTEGER,
    Country VARCHAR(50)
);

ALTER TABLE Publisher
ADD COLUMN ModifiedDateTime TIMESTAMP DEFAULT NOW();

-- Table Genre
CREATE TABLE Genre (
    GenreID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT
);

ALTER TABLE Genre
ADD COLUMN ModifiedDateTime TIMESTAMP DEFAULT NOW();

-- Table BookSeries
CREATE TABLE BookSeries (
    SeriesID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT
);

ALTER TABLE BookSeries
ADD COLUMN ModifiedDateTime TIMESTAMP DEFAULT NOW();

-- Table Book
CREATE TABLE Book (
    BookID SERIAL PRIMARY KEY,
	Name VARCHAR(100),
    ISBN VARCHAR(20) UNIQUE,
    Description TEXT,
    DownloadCount INTEGER DEFAULT 0,
    Language VARCHAR(50),
    PublicationYear INTEGER,
    PublisherID INTEGER REFERENCES Publisher(PublisherID),
    SeriesID INTEGER REFERENCES BookSeries(SeriesID),
    Rating DECIMAL(3, 2) DEFAULT 0 -- Average rating from 1 to 10
);


ALTER TABLE Book
ADD COLUMN ModifiedDateTime TIMESTAMP DEFAULT NOW();


-- Table BookFile (for storing files in different formats)
CREATE TABLE BookFile (
    FileID SERIAL PRIMARY KEY,
    BookID INTEGER REFERENCES Book(BookID) ON DELETE CASCADE,
    Format VARCHAR(10) NOT NULL, -- For example, 'epub', 'pdf', 'fb2'
    FilePath VARCHAR(255) NOT NULL -- Path to the file on the server or URL
);

-- Unique index to prevent duplicate formats for the same book
CREATE UNIQUE INDEX unique_format_for_book
ON BookFile (BookID, Format);

-- Many-to-many relationship between Book and Genre ("Has")
CREATE TABLE Book_Genre (
    BookID INTEGER REFERENCES Book(BookID) ON DELETE CASCADE,
    GenreID INTEGER REFERENCES Genre(GenreID) ON DELETE CASCADE,
    PRIMARY KEY (BookID, GenreID)
);

-- Many-to-many relationship between Author and Book (an author can write many books, and a book can have multiple authors)
CREATE TABLE Author_Book (
    AuthorID INTEGER REFERENCES Author(AuthorID) ON DELETE CASCADE,
    BookID INTEGER REFERENCES Book(BookID) ON DELETE CASCADE,
    PRIMARY KEY (AuthorID, BookID)
);

-- Many-to-many relationship between Author and BookSeries (if the author works on a book series)
/*
CREATE TABLE Author_Series (
    AuthorID INTEGER REFERENCES Author(AuthorID) ON DELETE CASCADE,
    SeriesID INTEGER REFERENCES BookSeries(SeriesID) ON DELETE CASCADE,
    PRIMARY KEY (AuthorID, SeriesID)
);
*/
-- Table Review
CREATE TABLE Review (
    ReviewID SERIAL PRIMARY KEY,
    Comment TEXT,
    ReviewDateTime TIMESTAMP NOT NULL DEFAULT NOW(),
    UserID INTEGER REFERENCES AppUser(UserID) ON DELETE CASCADE,
    BookID INTEGER REFERENCES Book(BookID) ON DELETE CASCADE
);

CREATE TABLE Rating (
	Score INTEGER CHECK (Score BETWEEN 1 AND 10),
	UserID INTEGER REFERENCES AppUser(UserID) ON DELETE CASCADE,
    BookID INTEGER REFERENCES Book(BookID) ON DELETE CASCADE,
	PRIMARY KEY (UserID, BookID)
);


-- Many-to-many relationship between AppUser and Book (Downloads)
CREATE TABLE Book_Downloads (
    UserID INTEGER REFERENCES AppUser(UserID) ON DELETE CASCADE,
    BookID INTEGER REFERENCES Book(BookID) ON DELETE CASCADE,
    PRIMARY KEY (UserID, BookID)
);
