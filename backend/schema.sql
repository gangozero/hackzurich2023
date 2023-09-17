-- clean up
DROP TABLE factories; 
DROP TABLE outbound;
DROP TABLE inbound;

-- create structure
CREATE TABLE factories (
    id TEXT PRIMARY KEY, -- factory code
    name TEXT NOT NULL, -- factory name
    lat FLOAT, -- factory lat
    lon FLOAT -- factory lon
);

CREATE TABLE outbound (
    id TEXT PRIMARY KEY, -- destination (customer) code
    lat FLOAT, -- destination (customer) lat
    lon FLOAT, -- destination (customer) lon
    distance FLOAT, -- trip distance
    factory_id TEXT -- source (factory) code
);

CREATE TABLE inbound (
    id TEXT PRIMARY KEY, -- supplier code
    name TEXT NOT NULL, -- supplier name    
    lat FLOAT, -- supplier lat 
    lon FLOAT, -- supplier lon
    distance FLOAT, -- trip distance
    factory_id TEXT -- destination (factory) code
);

-- load data
\copy factories from './factories.csv' with csv
\copy outbound from './outbound.csv' with csv
\copy inbound from './inbound.csv' with csv

-- create geometry and indexes
CREATE EXTENSION postgis;

SELECT AddGeometryColumn('factories', 'coord', 4326, 'POINT', 2); 
UPDATE factories SET coord = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE INDEX idx_factories_locations ON factories USING gist(coord);  

SELECT AddGeometryColumn('outbound', 'coord', 4326, 'POINT', 2); 
UPDATE outbound SET coord = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE INDEX idx_out_locations ON outbound USING gist(coord);  

SELECT AddGeometryColumn('inbound', 'coord', 4326, 'POINT', 2); 
UPDATE inbound SET coord = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE INDEX idx_inb_locations ON inbound USING gist(coord);  


-- create views
CREATE MATERIALIZED VIEW inbound_view
AS
    SELECT 
        inbound.id AS c_id,
        (SELECT round(ST_Distance(inbound.coord, factories.coord, false)::numeric/1000,1) AS ac_distance), 
        factories.id as a_id,
        inbound.coord 
    FROM inbound INNER JOIN factories 
        ON true
WITH DATA;

CREATE MATERIALIZED VIEW inbound_view_2
AS
    SELECT 
        inbound.id AS c_id,
        (SELECT round(ST_Distance(inbound.coord, factories.coord, false)::numeric/1000,1) AS ac_distance), 
        factories.id as a_id,
        inbound.coord 
    FROM inbound INNER JOIN factories 
        ON inbound.factory_id = factories.id
WITH DATA;

CREATE MATERIALIZED VIEW outbound_view
AS
    SELECT 
        outbound.id AS b_id,
        (SELECT round(ST_Distance(outbound.coord, factories.coord, false)::numeric/1000,1) AS ab_distance), 
        outbound.factory_id as a_id,
        outbound.coord 
    FROM outbound INNER JOIN factories 
        ON outbound.factory_id = factories.id
WITH DATA;

CREATE MATERIALIZED VIEW distance_raw_view
AS
    SELECT 
        outbound_view.a_id AS a_id, 
        outbound_view.b_id AS b_id, 
        inbound_view.c_id AS c_id,
        inbound_view.ac_distance AS ac_distance,
        outbound_view.ab_distance AS ab_distance,         
        (SELECT round(ST_Distance(inbound_view.coord, outbound_view.coord, false)::numeric/1000,1) AS bc_distance) 
    FROM inbound_view INNER JOIN outbound_view 
        ON outbound_view.a_id = inbound_view.a_id
WITH DATA;

CREATE MATERIALIZED VIEW distance_raw_view_2
AS
    SELECT 
        outbound_view.a_id AS a_id, 
        outbound_view.b_id AS b_id, 
        inbound_view_2.c_id AS c_id,
        inbound_view_2.ac_distance AS ac_distance,
        outbound_view.ab_distance AS ab_distance,         
        (SELECT round(ST_Distance(inbound_view_2.coord, outbound_view.coord, false)::numeric/1000,1) AS bc_distance) 
    FROM inbound_view_2 INNER JOIN outbound_view 
        ON outbound_view.a_id = inbound_view_2.a_id
WITH DATA;

CREATE MATERIALIZED VIEW distance_view
AS
    SELECT * FROM distance_raw_view
    WHERE bc_distance > 0.5 AND bc_distance < 1000
WITH DATA;


CREATE MATERIALIZED VIEW distance_close_view
AS
    SELECT * FROM distance_view
    WHERE bc_distance < ab_distance/4
WITH DATA;

CREATE MATERIALIZED VIEW distance_view_2
AS
    SELECT * FROM distance_raw_view_2
    WHERE bc_distance > 0.5 AND bc_distance < 1000
WITH DATA;


CREATE MATERIALIZED VIEW distance_close_view_2
AS
    SELECT * FROM distance_view_2
    WHERE bc_distance < ab_distance/4
WITH DATA;
