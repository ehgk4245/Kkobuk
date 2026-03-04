-- ============================================================
-- Database 생성 및 권한 부여
-- ============================================================
CREATE DATABASE IF NOT EXISTS kkobuk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS kkobuk_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON kkobuk.* TO 'kkobuk'@'%';
GRANT ALL PRIVILEGES ON kkobuk_ai.* TO 'kkobuk'@'%';
FLUSH PRIVILEGES;

-- ============================================================
-- kkobuk (Spring Boot REST API)
-- ============================================================
USE kkobuk;

CREATE TABLE IF NOT EXISTS members (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(100) UNIQUE,
    nickname   VARCHAR(50)  NOT NULL,
    role       VARCHAR(20)  NOT NULL,
    created_at DATETIME     NOT NULL,
    updated_at DATETIME     NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS social_accounts (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    member_id   BIGINT      NOT NULL,
    provider    VARCHAR(20) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    created_at  DATETIME    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_provider_provider_id (provider, provider_id),
    CONSTRAINT fk_social_accounts_member FOREIGN KEY (member_id) REFERENCES members (id)
);

CREATE TABLE IF NOT EXISTS posture_sessions (
    id                 BIGINT  NOT NULL AUTO_INCREMENT,
    member_id          BIGINT  NOT NULL,
    session_date       DATE    NOT NULL,
    total_duration_sec INT     NOT NULL,
    good_posture_sec   INT     NOT NULL,
    bad_posture_sec    INT     NOT NULL,
    created_at         DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_posture_sessions_member FOREIGN KEY (member_id) REFERENCES members (id)
);

-- ============================================================
-- kkobuk_ai (FastAPI AI 서버)
-- ============================================================
USE kkobuk_ai;

CREATE TABLE IF NOT EXISTS training_data_metadata (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    member_id  BIGINT       NOT NULL,
    s3_url     VARCHAR(512) NOT NULL,
    created_at DATETIME     NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS trained_model_metadata (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    member_id   BIGINT       NOT NULL,
    s3_url      VARCHAR(512) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'INACTIVE',
    description TEXT,
    created_at  DATETIME     NOT NULL,
    PRIMARY KEY (id)
);
