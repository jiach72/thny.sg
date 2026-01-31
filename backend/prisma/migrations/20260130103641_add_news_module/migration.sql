-- CreateTable
CREATE TABLE "rss_feeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'zh',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fetch_interval" INTEGER NOT NULL DEFAULT 60,
    "last_fetch_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rss_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT,
    "content" TEXT NOT NULL,
    "content_en" TEXT,
    "summary" TEXT,
    "summary_en" TEXT,
    "cover_image" TEXT,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "source_id" TEXT,
    "author" TEXT,
    "type" TEXT NOT NULL DEFAULT 'COMPANY',
    "category" TEXT,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "is_top" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "rss_feed_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rss_feeds_url_key" ON "rss_feeds"("url");

-- CreateIndex
CREATE INDEX "rss_feeds_is_active_idx" ON "rss_feeds"("is_active");

-- CreateIndex
CREATE INDEX "news_articles_status_published_at_idx" ON "news_articles"("status", "published_at");

-- CreateIndex
CREATE INDEX "news_articles_type_status_idx" ON "news_articles"("type", "status");

-- CreateIndex
CREATE INDEX "news_articles_rss_feed_id_idx" ON "news_articles"("rss_feed_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_source_source_id_key" ON "news_articles"("source", "source_id");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_rss_feed_id_fkey" FOREIGN KEY ("rss_feed_id") REFERENCES "rss_feeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
