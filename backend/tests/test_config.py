from app.config import Settings


def test_render_style_urls_are_normalised():
    s = Settings(database_url="postgresql://u:p@host:5432/db", executor_url="codegolf-executor:10000")
    assert s.database_url == "postgresql+asyncpg://u:p@host:5432/db"
    assert s.executor_url == "http://codegolf-executor:10000"
    assert Settings(database_url="postgres://u:p@h/db").database_url.startswith("postgresql+asyncpg://")


def test_cors_origins_accept_csv_or_json():
    assert Settings(cors_origins="https://a.app, https://b.app/").cors_origin_list == ["https://a.app", "https://b.app"]
    assert Settings(cors_origins='["https://a.app"]').cors_origin_list == ["https://a.app"]
