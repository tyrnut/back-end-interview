CREATE DATABASE report_meister_db ENCODING 'UTF-8';
\c report_meister_db
CREATE SCHEMA report_meister;

CREATE USER report_meister_user WITH PASSWORD 'secret';
ALTER ROLE report_meister_user SET search_path TO report_meister, public;
GRANT ALL PRIVILEGES ON SCHEMA report_meister TO report_meister_user;