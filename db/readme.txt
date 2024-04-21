CREATE TABLE beers (
	ID INT PRIMARY KEY AUTO_INCREMENT,
	beer VARCHAR(100) NOT NULL, 
	alcohol_per_cent FLOAT, 
	brewery VARCHAR(100) NOT NULL, 
	place_origin VARCHAR(100), 
	type VARCHAR(100) NOT NULL, 
	description TEXT, 
	glass VARCHAR(20), 
	rating VARCHAR(20)
);

import using:
- CSV using LOAD data
- skip first row
- manually specify the column names (of the `beers` table)
- check "use LOCAL keyword"