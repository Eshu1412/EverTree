"""
EverTree Solutions Database Module
Supports:
1. Turso Cloud Database (libsql / HTTP Pipeline with connection pooling & batching)
2. Local SQLite3 (fallback)
"""

import os
from pathlib import Path
import sqlite3
import httpx
import json
from datetime import datetime

# Automatically load environment variables from .env file
try:
    from dotenv import load_dotenv
    _backend_env_file = Path(__file__).resolve().parent / ".env"
    _project_env_file = Path(__file__).resolve().parents[1] / ".env"
    try:
        load_dotenv(dotenv_path=_project_env_file)
    except UnicodeDecodeError:
        # Support the supplied UTF-16 project .env without exposing or
        # rewriting its secrets. A UTF-8 backend/.env can override locally.
        load_dotenv(dotenv_path=_project_env_file, encoding="utf-16")
    if _backend_env_file.exists():
        load_dotenv(dotenv_path=_backend_env_file, override=True)
except ImportError:
    pass

# ── Turso Configuration ────────────────────────────────
TURSO_DB_URL = os.getenv("TURSO_DATABASE_URL") or os.getenv("TURSO_DB_URL", "")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN") or os.getenv("TURSO_DB_KEY", "")
DEFAULT_ADMIN_USERNAME = os.getenv("ADMIN_USERNAME") or "admin"
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
DATABASE_MODE = os.getenv("DATABASE_MODE", "turso").lower()
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"

# Normalize Turso URL for HTTP Pipeline API
if TURSO_DB_URL.startswith("libsql://"):
    TURSO_HTTP_URL = TURSO_DB_URL.replace("libsql://", "https://") + "/v2/pipeline"
elif TURSO_DB_URL.startswith("https://") and not TURSO_DB_URL.endswith("/v2/pipeline"):
    TURSO_HTTP_URL = TURSO_DB_URL + "/v2/pipeline"
else:
    TURSO_HTTP_URL = TURSO_DB_URL

LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "evertree.db")
USE_TURSO = DATABASE_MODE != "local" and bool(
    TURSO_AUTH_TOKEN and ("turso.io" in TURSO_HTTP_URL or "libsql" in TURSO_DB_URL)
)

# Persistent HTTP connection pool for fast queries
_turso_client = httpx.Client(timeout=10.0)


def _format_args(params: list):
    args = []
    for p in params:
        if isinstance(p, int):
            args.append({"type": "integer", "value": str(p)})
        elif isinstance(p, float):
            args.append({"type": "float", "value": p})
        elif p is None:
            args.append({"type": "null"})
        else:
            args.append({"type": "text", "value": str(p)})
    return args


def query_turso(sql: str, params: list = None):
    """Execute SQL against Turso HTTP Pipeline and return rows as dicts."""
    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    stmt = {"sql": sql}
    if params:
        stmt["args"] = _format_args(params)

    payload = {
        "requests": [
            {"type": "execute", "stmt": stmt},
            {"type": "close"}
        ]
    }

    resp = _turso_client.post(TURSO_HTTP_URL, headers=headers, json=payload)
    resp.raise_for_status()
    data = resp.json()
    
    result_wrapper = data["results"][0]
    if result_wrapper.get("type") == "error":
        raise Exception(result_wrapper.get("error", "Turso query error"))
    
    result = result_wrapper["response"]["result"]
    cols = [c["name"] for c in result["cols"]]
    rows = []
    for r in result["rows"]:
        row_dict = {}
        for idx, val in enumerate(r):
            col_name = cols[idx]
            v = val.get("value")
            if col_name in ("id", "consent", "trusted_form_retained", "count"):
                try:
                    v = int(v) if v is not None else 0
                except (ValueError, TypeError):
                    pass
            row_dict[col_name] = v
        rows.append(row_dict)
        
    affected = result.get("affected_row_count", 0)
    last_id = result.get("last_insert_rowid")
    return rows, affected, int(last_id) if last_id is not None else None


def batch_query_turso(statements: list):
    """Execute multiple SQL statements in a single roundtrip via Turso HTTP pipeline."""
    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    requests = []
    for item in statements:
        sql = item["sql"] if isinstance(item, dict) else item
        params = item.get("params") if isinstance(item, dict) else None
        stmt = {"sql": sql}
        if params:
            stmt["args"] = _format_args(params)
        requests.append({"type": "execute", "stmt": stmt})
    
    requests.append({"type": "close"})

    resp = _turso_client.post(TURSO_HTTP_URL, headers=headers, json={"requests": requests})
    resp.raise_for_status()
    data = resp.json()

    all_results = []
    for res_wrapper in data["results"][:-1]: # exclude close response
        if res_wrapper.get("type") == "error":
            all_results.append([])
            continue
        result = res_wrapper["response"]["result"]
        cols = [c["name"] for c in result["cols"]]
        rows = []
        for r in result["rows"]:
            row_dict = {}
            for idx, val in enumerate(r):
                col_name = cols[idx]
                v = val.get("value")
                if col_name in ("id", "consent", "trusted_form_retained", "count"):
                    try:
                        v = int(v) if v is not None else 0
                    except (ValueError, TypeError):
                        pass
                row_dict[col_name] = v
            rows.append(row_dict)
        all_results.append(rows)

    return all_results


def get_local_db():
    """Fallback local SQLite3 connection."""
    conn = sqlite3.connect(LOCAL_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist and seed the default admin."""
    create_users_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """
    create_leads_sql = """
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            zip_code TEXT NOT NULL,
            date_of_birth TEXT,
            service_type TEXT NOT NULL,
            current_provider TEXT,
            household_size TEXT,
            annual_income_range TEXT,
            consent INTEGER NOT NULL DEFAULT 0,
            trusted_form_cert_url TEXT,
            trusted_form_retained INTEGER NOT NULL DEFAULT 0,
            trusted_form_cert_id TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'closed')),
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """
    create_flight_bookings_sql = """
        CREATE TABLE IF NOT EXISTS flight_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            trip_type TEXT NOT NULL,
            departure TEXT DEFAULT '',
            destination TEXT DEFAULT '',
            departure_city TEXT DEFAULT '',
            destination_city TEXT DEFAULT '',
            address TEXT DEFAULT '',
            state TEXT DEFAULT '',
            zip_code TEXT DEFAULT '',
            trusted_form_cert_url TEXT DEFAULT '',
            trusted_form_retained INTEGER NOT NULL DEFAULT 0,
            trusted_form_cert_id TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'booked', 'cancelled')),
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """
    create_settings_sql = """
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """
    create_buyers_sql = """
        CREATE TABLE IF NOT EXISTS buyers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            company TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            vertical TEXT NOT NULL,
            message TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'active', 'suspended', 'rejected')),
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """
    create_publishers_sql = """
        CREATE TABLE IF NOT EXISTS publishers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            company TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            vertical TEXT NOT NULL,
            message TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'active', 'suspended', 'rejected')),
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """

    if USE_TURSO:
        try:
            batch_query_turso([create_users_sql, create_leads_sql, create_flight_bookings_sql, create_settings_sql, create_buyers_sql, create_publishers_sql])
            print(f"[DB] Turso Database connected & initialized: {TURSO_DB_URL}")
            
            # Ensure columns exist on Turso if table already existed
            for col in ["departure", "destination", "address", "state", "zip_code", "trusted_form_cert_url", "trusted_form_retained", "trusted_form_cert_id"]:
                try:
                    col_type = "INTEGER DEFAULT 0" if col == "trusted_form_retained" else "TEXT DEFAULT ''"
                    query_turso(f"ALTER TABLE flight_bookings ADD COLUMN {col} {col_type}")
                except Exception:
                    pass

            # Create the administrator only when it does not exist.
            from .auth import hash_password
            for uname in [DEFAULT_ADMIN_USERNAME]:
                try:
                    u_rows, _, _ = query_turso("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [uname])
                    if not u_rows:
                        admin_pw = os.getenv("ADMIN_PASSWORD") or "EverTreeAdmin!2026"
                        admin_pw_hash = hash_password(admin_pw)
                        query_turso(
                            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                            [uname, admin_pw_hash, "admin"]
                        )
                        print(f"[DB] Admin user '{uname}' created on Turso")
                    elif os.getenv("ADMIN_PASSWORD"):
                        admin_pw_hash = hash_password(os.getenv("ADMIN_PASSWORD"))
                        query_turso(
                            "UPDATE users SET password_hash = ? WHERE LOWER(username) = LOWER(?)",
                            [admin_pw_hash, uname]
                        )
                except Exception as ex:
                    print(f"[DB] Turso admin user '{uname}' check warning: {ex}")

            # Demo data is opt-in and is never added to a populated database.
            l_rows, _, _ = query_turso("SELECT COUNT(*) as count FROM leads")
            if SEED_DEMO_DATA and (not l_rows or l_rows[0].get("count", 0) == 0):
                seed_initial_leads()
            return
        except Exception as e:
            print(f"[DB] Warning: Turso connection failed ({e}). Falling back to local SQLite.")

    # Fallback to local SQLite
    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(create_users_sql)
    cursor.execute(create_leads_sql)
    cursor.execute(create_flight_bookings_sql)
    cursor.execute(create_settings_sql)
    cursor.execute(create_buyers_sql)
    cursor.execute(create_publishers_sql)
    # Ensure columns exist on local SQLite if table was created previously
    for col in ["departure", "destination", "address", "state", "zip_code", "trusted_form_cert_url", "trusted_form_retained", "trusted_form_cert_id"]:
        try:
            col_type = "INTEGER DEFAULT 0" if col == "trusted_form_retained" else "TEXT DEFAULT ''"
            cursor.execute(f"ALTER TABLE flight_bookings ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    from .auth import hash_password
    for uname in [DEFAULT_ADMIN_USERNAME]:
        cursor.execute("SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?)", (uname,))
        if cursor.fetchone()[0] == 0:
            admin_pw = os.getenv("ADMIN_PASSWORD") or "EverTreeAdmin!2026"
            admin_pw_hash = hash_password(admin_pw)
            cursor.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                (uname, admin_pw_hash, "admin"),
            )
            print(f"[DB] Admin user '{uname}' created locally")
        elif os.getenv("ADMIN_PASSWORD"):
            admin_pw_hash = hash_password(os.getenv("ADMIN_PASSWORD"))
            cursor.execute(
                "UPDATE users SET password_hash = ? WHERE LOWER(username) = LOWER(?)",
                (admin_pw_hash, uname),
            )
    conn.commit()
    conn.close()
    if SEED_DEMO_DATA:
        conn = get_local_db()
        local_lead_count = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        conn.close()
        if local_lead_count == 0:
            seed_initial_leads()
    print(f"[DB] Local SQLite database initialized at {LOCAL_DB_PATH}")


def seed_initial_leads():
    """Seed initial sample leads for demo and analytics."""
    sample_leads = [
        {'first_name': 'Eleanor', 'last_name': 'Vance', 'email': 'eleanor.vance@example.com', 'phone': '(555) 234-5678', 'zip_code': '78701', 'date_of_birth': '1988-04-12', 'service_type': 'Health Insurance', 'current_provider': 'BlueCross', 'household_size': '3', 'annual_income_range': '$60k-$90k', 'consent': True, 'trusted_form_cert_url': 'https://cert.trustedform.com/samplecert1', 'trusted_form_retained': True, 'trusted_form_cert_id': 'tf_9081237a', 'status': 'new', 'notes': 'Looking for family PPO coverage in Austin area.'},
        {'first_name': 'Marcus', 'last_name': 'Sterling', 'email': 'marcus.s@example.com', 'phone': '(555) 876-5432', 'zip_code': '30301', 'date_of_birth': '1975-11-20', 'service_type': 'Home Improvement', 'current_provider': 'N/A', 'household_size': '4', 'annual_income_range': '$100k+', 'consent': True, 'trusted_form_cert_url': 'https://cert.trustedform.com/samplecert2', 'trusted_form_retained': True, 'trusted_form_cert_id': 'tf_887162bc', 'status': 'contacted', 'notes': 'Contacted via phone, kitchen renovation estimate requested.'},
        {'first_name': 'Sophia', 'last_name': 'Chen', 'email': 'sophia.chen@example.com', 'phone': '(555) 345-6789', 'zip_code': '94102', 'date_of_birth': '1992-08-05', 'service_type': 'Auto & Home Insurance', 'current_provider': 'State Farm', 'household_size': '2', 'annual_income_range': '$90k-$120k', 'consent': True, 'trusted_form_cert_url': 'https://cert.trustedform.com/samplecert3', 'trusted_form_retained': True, 'trusted_form_cert_id': 'tf_771829cd', 'status': 'qualified', 'notes': 'Bundling 2 vehicles and SF condominium.'},
        {'first_name': 'David', 'last_name': 'Miller', 'email': 'david.m@example.com', 'phone': '(555) 901-2345', 'zip_code': '60601', 'date_of_birth': '1980-01-15', 'service_type': 'Debt Relief', 'current_provider': 'N/A', 'household_size': '1', 'annual_income_range': '$40k-$60k', 'consent': True, 'trusted_form_cert_url': '', 'trusted_form_retained': False, 'trusted_form_cert_id': '', 'status': 'closed', 'notes': 'Consolidation plan active and confirmed.'},
        {'first_name': 'Rachel', 'last_name': 'Green', 'email': 'rachel.green@example.com', 'phone': '(555) 654-3210', 'zip_code': '10001', 'date_of_birth': '1985-06-30', 'service_type': 'Medicare', 'current_provider': 'Humana', 'household_size': '2', 'annual_income_range': '$30k-$50k', 'consent': True, 'trusted_form_cert_url': 'https://cert.trustedform.com/samplecert5', 'trusted_form_retained': True, 'trusted_form_cert_id': 'tf_661902ef', 'status': 'new', 'notes': 'Comparing Medicare Advantage Part C options.'},
        {'first_name': 'Arthur', 'last_name': 'Pendelton', 'email': 'arthur.p@example.com', 'phone': '(555) 789-0123', 'zip_code': '02108', 'date_of_birth': '1959-03-22', 'service_type': 'Legal Help', 'current_provider': 'N/A', 'household_size': '2', 'annual_income_range': '$80k-$110k', 'consent': True, 'trusted_form_cert_url': 'https://cert.trustedform.com/samplecert6', 'trusted_form_retained': True, 'trusted_form_cert_id': 'tf_551093gh', 'status': 'contacted', 'notes': 'Estate planning consultation scheduled.'},
        {'first_name': 'Jessica', 'last_name': 'Alba', 'email': 'jessica.a@example.com', 'phone': '(555) 432-1098', 'zip_code': '90210', 'date_of_birth': '1990-12-14', 'service_type': 'Health Insurance', 'current_provider': 'Kaiser', 'household_size': '3', 'annual_income_range': '$120k+', 'consent': True, 'trusted_form_cert_url': 'https://cert.trustedform.com/samplecert7', 'trusted_form_retained': True, 'trusted_form_cert_id': 'tf_440982ij', 'status': 'qualified', 'notes': 'Individual deductible review completed.'}
    ]
    for lead in sample_leads:
        create_lead(lead)
    print("[DB] Initial demo leads seeded.")


# ── Lead CRUD ────────────────────────────────────────

def create_lead(data: dict) -> int:
    sql = """
        INSERT INTO leads (
            first_name, last_name, email, phone, zip_code, date_of_birth,
            service_type, current_provider, household_size, annual_income_range,
            consent, trusted_form_cert_url, trusted_form_retained, trusted_form_cert_id,
            status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = [
        data["first_name"], data["last_name"], data["email"], data["phone"],
        data["zip_code"], data.get("date_of_birth", ""),
        data["service_type"], data.get("current_provider", ""),
        data.get("household_size", ""), data.get("annual_income_range", ""),
        1 if data.get("consent") else 0,
        data.get("trusted_form_cert_url", ""),
        1 if data.get("trusted_form_retained") else 0,
        data.get("trusted_form_cert_id", ""),
        data.get("status", "new"),
        data.get("notes", "")
    ]

    if USE_TURSO:
        try:
            _, _, last_id = query_turso(sql, params)
            return last_id or 1
        except Exception as e:
            print(f"[DB] Turso create_lead fallback to SQLite ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    lead_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return lead_id


def get_leads(
    search: str = "", 
    status: str = "", 
    service_type: str = "", 
    page: int = 1, 
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    conditions = []
    params = []

    if search:
        conditions.append(
            "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR zip_code LIKE ?)"
        )
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    if status and status != "all":
        conditions.append("status = ?")
        params.append(status)

    if service_type and service_type != "all":
        conditions.append("service_type = ?")
        params.append(service_type)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    valid_sort_cols = {
        "created_at": "created_at",
        "first_name": "first_name",
        "last_name": "last_name",
        "service_type": "service_type",
        "status": "status",
        "email": "email"
    }
    order_col = valid_sort_cols.get(sort_by, "created_at")
    order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"
    is_unlimited = (per_page is None or per_page <= 0 or per_page >= 50000)

    if USE_TURSO:
        try:
            if is_unlimited:
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM leads {where}", "params": params},
                    {"sql": f"SELECT * FROM leads {where} ORDER BY {order_col} {order_dir}", "params": params}
                ])
            else:
                offset = (page - 1) * per_page
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM leads {where}", "params": params},
                    {"sql": f"SELECT * FROM leads {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?", "params": params + [per_page, offset]}
                ])
            count_rows = results[0]
            rows = results[1]
            total = count_rows[0].get("count", 0) if count_rows else 0
            
            return {
                "leads": rows,
                "total": total,
                "page": 1 if is_unlimited else page,
                "per_page": total if is_unlimited else per_page,
                "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
            }
        except Exception as e:
            print(f"[DB] Turso get_leads fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM leads {where}", params)
    total = cursor.fetchone()[0]

    if is_unlimited:
        cursor.execute(
            f"SELECT * FROM leads {where} ORDER BY {order_col} {order_dir}",
            params,
        )
    else:
        offset = (page - 1) * per_page
        cursor.execute(
            f"SELECT * FROM leads {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?",
            params + [per_page, offset],
        )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "leads": rows,
        "total": total,
        "page": 1 if is_unlimited else page,
        "per_page": total if is_unlimited else per_page,
        "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
    }


def get_dashboard_stats():
    if USE_TURSO:
        try:
            # Single batch roundtrip for all statistics
            results = batch_query_turso([
                {"sql": "SELECT COUNT(*) as count FROM leads"},
                {"sql": "SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')"},
                {"sql": "SELECT COUNT(*) as count FROM leads WHERE created_at >= date('now', '-7 days')"},
                {"sql": "SELECT status, COUNT(*) as count FROM leads GROUP BY status"},
                {"sql": "SELECT service_type, COUNT(*) as count FROM leads GROUP BY service_type ORDER BY COUNT(*) DESC"},
                {"sql": "SELECT COUNT(*) as count FROM leads WHERE trusted_form_retained = 1"},
                {"sql": "SELECT COUNT(*) as count FROM leads WHERE trusted_form_cert_url != ''"},
                {"sql": "SELECT date(created_at) as day, COUNT(*) as count FROM leads WHERE created_at >= date('now', '-6 days') GROUP BY date(created_at) ORDER BY day ASC"},
                {"sql": "SELECT * FROM leads ORDER BY created_at DESC LIMIT 5"},
                {"sql": "SELECT COUNT(*) as count FROM buyers"},
                {"sql": "SELECT COUNT(*) as count FROM publishers"}
            ])

            total_leads = results[0][0].get("count", 0) if results[0] else 0
            new_today = results[1][0].get("count", 0) if results[1] else 0
            new_this_week = results[2][0].get("count", 0) if results[2] else 0

            status_counts = {"new": 0, "contacted": 0, "qualified": 0, "closed": 0}
            for r in results[3]:
                status_counts[r["status"]] = r.get("count", 0)

            service_counts = {r["service_type"]: r.get("count", 0) for r in results[4]}

            tf_retained = results[5][0].get("count", 0) if results[5] else 0
            tf_total = results[6][0].get("count", 0) if results[6] else 0
            tf_percentage = round((tf_retained / tf_total * 100), 1) if tf_total > 0 else 0

            daily_trends = [{"day": r["day"], "count": r.get("count", 0)} for r in results[7]]
            recent_leads = results[8]

            total_buyers = results[9][0].get("count", 0) if len(results) > 9 and results[9] else 0
            total_publishers = results[10][0].get("count", 0) if len(results) > 10 and results[10] else 0

            return {
                "total_leads": total_leads,
                "new_today": new_today,
                "new_this_week": new_this_week,
                "total_buyers": total_buyers,
                "total_publishers": total_publishers,
                "status_counts": status_counts,
                "service_counts": service_counts,
                "daily_trends": daily_trends,
                "trusted_form": {
                    "retained": tf_retained,
                    "total_with_cert": tf_total,
                    "percentage": tf_percentage
                },
                "recent_leads": recent_leads
            }
        except Exception as e:
            print(f"[DB] Turso get_dashboard_stats fallback ({e})")

    # Local fallback
    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM leads")
    total_leads = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM leads WHERE date(created_at) = date('now')")
    new_today = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM leads WHERE created_at >= date('now', '-7 days')")
    new_this_week = cursor.fetchone()[0]

    cursor.execute("SELECT status, COUNT(*) FROM leads GROUP BY status")
    status_rows = cursor.fetchall()
    status_counts = {"new": 0, "contacted": 0, "qualified": 0, "closed": 0}
    for row in status_rows:
        status_counts[row[0]] = row[1]

    cursor.execute("SELECT service_type, COUNT(*) FROM leads GROUP BY service_type ORDER BY COUNT(*) DESC")
    service_rows = cursor.fetchall()
    service_counts = {row[0]: row[1] for row in service_rows}

    cursor.execute("SELECT COUNT(*) FROM leads WHERE trusted_form_retained = 1")
    tf_retained = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM leads WHERE trusted_form_cert_url != ''")
    tf_total = cursor.fetchone()[0]
    tf_percentage = round((tf_retained / tf_total * 100), 1) if tf_total > 0 else 0

    cursor.execute("""
        SELECT date(created_at) as day, COUNT(*) as count 
        FROM leads 
        WHERE created_at >= date('now', '-6 days')
        GROUP BY date(created_at)
        ORDER BY day ASC
    """)
    trend_rows = cursor.fetchall()
    daily_trends = [{"day": r["day"], "count": r["count"]} for r in trend_rows]

    cursor.execute("SELECT * FROM leads ORDER BY created_at DESC LIMIT 5")
    recent_leads = [dict(r) for r in cursor.fetchall()]

    try:
        cursor.execute("SELECT COUNT(*) FROM buyers")
        total_buyers = cursor.fetchone()[0]
    except Exception:
        total_buyers = 0

    try:
        cursor.execute("SELECT COUNT(*) FROM publishers")
        total_publishers = cursor.fetchone()[0]
    except Exception:
        total_publishers = 0

    conn.close()

    return {
        "total_leads": total_leads,
        "new_today": new_today,
        "new_this_week": new_this_week,
        "total_buyers": total_buyers,
        "total_publishers": total_publishers,
        "status_counts": status_counts,
        "service_counts": service_counts,
        "daily_trends": daily_trends,
        "trusted_form": {
            "retained": tf_retained,
            "total_with_cert": tf_total,
            "percentage": tf_percentage
        },
        "recent_leads": recent_leads
    }


def get_lead_by_id(lead_id: int):
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT * FROM leads WHERE id = ?", [lead_id])
            return rows[0] if rows else None
        except Exception as e:
            print(f"[DB] Turso get_lead_by_id fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_lead(lead_id: int, data: dict):
    fields = []
    params = []
    for key in ["status", "notes", "first_name", "last_name", "email", "phone",
                 "zip_code", "service_type", "annual_income_range", "current_provider", "date_of_birth"]:
        if key in data:
            fields.append(f"{key} = ?")
            params.append(data[key])

    if not fields:
        return False

    params.append(lead_id)
    sql = f"UPDATE leads SET {', '.join(fields)} WHERE id = ?"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso update_lead fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated


def bulk_update_lead_status(lead_ids: list, status: str):
    if not lead_ids or not status:
        return 0
    placeholders = ",".join("?" for _ in lead_ids)
    sql = f"UPDATE leads SET status = ? WHERE id IN ({placeholders})"
    params = [status] + lead_ids

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected
        except Exception as e:
            print(f"[DB] Turso bulk_update fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


def bulk_delete_leads(lead_ids: list):
    if not lead_ids:
        return 0
    placeholders = ",".join("?" for _ in lead_ids)
    sql = f"DELETE FROM leads WHERE id IN ({placeholders})"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, lead_ids)
            return affected
        except Exception as e:
            print(f"[DB] Turso bulk_delete fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, lead_ids)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


def delete_lead(lead_id: int):
    if USE_TURSO:
        try:
            _, affected, _ = query_turso("DELETE FROM leads WHERE id = ?", [lead_id])
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso delete_lead fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


# ── Flight Booking CRUD ──────────────────────────────

def create_flight_booking(data: dict) -> int:
    departure = data.get("departure") or data.get("departure_city", "")
    destination = data.get("destination") or data.get("destination_city", "")
    sql = """
        INSERT INTO flight_bookings (
            full_name, email, phone, trip_type,
            departure, destination, departure_city, destination_city,
            address, state, zip_code,
            trusted_form_cert_url, trusted_form_retained, trusted_form_cert_id,
            status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = [
        data["full_name"],
        data["email"],
        data["phone"],
        data.get("trip_type", "Round Trip"),
        departure,
        destination,
        departure,
        destination,
        data.get("address", ""),
        data.get("state", ""),
        data.get("zip_code", ""),
        data.get("trusted_form_cert_url", ""),
        1 if data.get("trusted_form_retained") else 0,
        data.get("trusted_form_cert_id", ""),
        data.get("status", "new"),
        data.get("notes", "")
    ]

    if USE_TURSO:
        try:
            _, _, last_id = query_turso(sql, params)
            return last_id or 1
        except Exception as e:
            print(f"[DB] Turso create_flight_booking fallback to SQLite ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return booking_id


def get_flight_bookings(
    search: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    conditions = []
    params = []

    if search:
        conditions.append(
            "(full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR departure LIKE ? OR destination LIKE ? OR address LIKE ?)"
        )
        s = f"%{search}%"
        params.extend([s, s, s, s, s, s])

    if status and status != "all":
        conditions.append("status = ?")
        params.append(status)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    valid_sort_cols = {
        "created_at": "created_at",
        "full_name": "full_name",
        "departure_city": "departure_city",
        "destination_city": "destination_city",
        "status": "status",
        "email": "email"
    }
    order_col = valid_sort_cols.get(sort_by, "created_at")
    order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"
    is_unlimited = (per_page is None or per_page <= 0 or per_page >= 50000)

    if USE_TURSO:
        try:
            if is_unlimited:
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM flight_bookings {where}", "params": params},
                    {"sql": f"SELECT * FROM flight_bookings {where} ORDER BY {order_col} {order_dir}", "params": params}
                ])
            else:
                offset = (page - 1) * per_page
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM flight_bookings {where}", "params": params},
                    {"sql": f"SELECT * FROM flight_bookings {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?", "params": params + [per_page, offset]}
                ])
            count_rows = results[0]
            rows = results[1]
            total = count_rows[0].get("count", 0) if count_rows else 0
            return {
                "bookings": rows,
                "total": total,
                "page": 1 if is_unlimited else page,
                "per_page": total if is_unlimited else per_page,
                "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
            }
        except Exception as e:
            print(f"[DB] Turso get_flight_bookings fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM flight_bookings {where}", params)
    total = cursor.fetchone()[0]

    if is_unlimited:
        cursor.execute(
            f"SELECT * FROM flight_bookings {where} ORDER BY {order_col} {order_dir}",
            params,
        )
    else:
        offset = (page - 1) * per_page
        cursor.execute(
            f"SELECT * FROM flight_bookings {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?",
            params + [per_page, offset],
        )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "bookings": rows,
        "total": total,
        "page": 1 if is_unlimited else page,
        "per_page": total if is_unlimited else per_page,
        "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
    }


def get_flight_booking_by_id(booking_id: int):
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT * FROM flight_bookings WHERE id = ?", [booking_id])
            return rows[0] if rows else None
        except Exception as e:
            print(f"[DB] Turso get_flight_booking_by_id fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM flight_bookings WHERE id = ?", (booking_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_flight_booking(booking_id: int, data: dict):
    fields = []
    params = []
    allowed = ["status", "notes", "departure_city", "destination_city", "trip_type"]
    for key in allowed:
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            params.append(data[key])

    if not fields:
        return False

    params.append(booking_id)
    sql = f"UPDATE flight_bookings SET {', '.join(fields)} WHERE id = ?"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso update_flight_booking fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated


def delete_flight_booking(booking_id: int):
    if USE_TURSO:
        try:
            _, affected, _ = query_turso("DELETE FROM flight_bookings WHERE id = ?", [booking_id])
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso delete_flight_booking fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM flight_bookings WHERE id = ?", (booking_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


# ── Buyer CRUD ─────────────────────────────────────────

def create_buyer(data: dict) -> int:
    sql = """
        INSERT INTO buyers (
            full_name, company, email, phone, vertical, message, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = [
        data["full_name"].strip(),
        data.get("company", "").strip(),
        data["email"].strip(),
        data["phone"].strip(),
        data.get("vertical", "Other").strip(),
        data.get("message", "").strip(),
        data.get("status", "pending"),
        data.get("notes", "")
    ]

    if USE_TURSO:
        try:
            _, _, last_id = query_turso(sql, params)
            return last_id or 1
        except Exception as e:
            print(f"[DB] Turso create_buyer fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    buyer_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return buyer_id


def get_buyers(
    search: str = "",
    status: str = "",
    vertical: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    conditions = []
    params = []

    if search:
        conditions.append(
            "(full_name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)"
        )
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    if status and status != "all":
        conditions.append("status = ?")
        params.append(status)

    if vertical and vertical != "all":
        conditions.append("vertical = ?")
        params.append(vertical)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    valid_sort_cols = {
        "created_at": "created_at",
        "full_name": "full_name",
        "company": "company",
        "vertical": "vertical",
        "status": "status",
        "email": "email"
    }
    order_col = valid_sort_cols.get(sort_by, "created_at")
    order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"
    is_unlimited = (per_page is None or per_page <= 0 or per_page >= 50000)

    if USE_TURSO:
        try:
            if is_unlimited:
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM buyers {where}", "params": params},
                    {"sql": f"SELECT * FROM buyers {where} ORDER BY {order_col} {order_dir}", "params": params}
                ])
            else:
                offset = (page - 1) * per_page
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM buyers {where}", "params": params},
                    {"sql": f"SELECT * FROM buyers {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?", "params": params + [per_page, offset]}
                ])
            count_rows = results[0]
            rows = results[1]
            total = count_rows[0].get("count", 0) if count_rows else 0
            return {
                "buyers": rows,
                "total": total,
                "page": 1 if is_unlimited else page,
                "per_page": total if is_unlimited else per_page,
                "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
            }
        except Exception as e:
            print(f"[DB] Turso get_buyers fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM buyers {where}", params)
    total = cursor.fetchone()[0]

    if is_unlimited:
        cursor.execute(f"SELECT * FROM buyers {where} ORDER BY {order_col} {order_dir}", params)
    else:
        offset = (page - 1) * per_page
        cursor.execute(
            f"SELECT * FROM buyers {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?",
            params + [per_page, offset],
        )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "buyers": rows,
        "total": total,
        "page": 1 if is_unlimited else page,
        "per_page": total if is_unlimited else per_page,
        "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
    }


def get_buyer_by_id(buyer_id: int):
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT * FROM buyers WHERE id = ?", [buyer_id])
            return rows[0] if rows else None
        except Exception as e:
            print(f"[DB] Turso get_buyer_by_id fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM buyers WHERE id = ?", (buyer_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_buyer(buyer_id: int, data: dict):
    fields = []
    params = []
    allowed = ["full_name", "company", "email", "phone", "vertical", "message", "status", "notes"]
    for key in allowed:
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            params.append(data[key])

    if not fields:
        return False

    params.append(buyer_id)
    sql = f"UPDATE buyers SET {', '.join(fields)} WHERE id = ?"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso update_buyer fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated


def delete_buyer(buyer_id: int):
    if USE_TURSO:
        try:
            _, affected, _ = query_turso("DELETE FROM buyers WHERE id = ?", [buyer_id])
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso delete_buyer fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM buyers WHERE id = ?", (buyer_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def bulk_update_buyer_status(buyer_ids: list, status: str):
    if not buyer_ids or not status:
        return 0
    placeholders = ",".join("?" for _ in buyer_ids)
    sql = f"UPDATE buyers SET status = ? WHERE id IN ({placeholders})"
    params = [status] + buyer_ids

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected
        except Exception as e:
            print(f"[DB] Turso bulk_update_buyer_status fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


def bulk_delete_buyers(buyer_ids: list):
    if not buyer_ids:
        return 0
    placeholders = ",".join("?" for _ in buyer_ids)
    sql = f"DELETE FROM buyers WHERE id IN ({placeholders})"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, buyer_ids)
            return affected
        except Exception as e:
            print(f"[DB] Turso bulk_delete_buyers fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, buyer_ids)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


# ── Publisher CRUD ─────────────────────────────────────

def create_publisher(data: dict) -> int:
    sql = """
        INSERT INTO publishers (
            full_name, company, email, phone, vertical, message, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = [
        data["full_name"].strip(),
        data.get("company", "").strip(),
        data["email"].strip(),
        data["phone"].strip(),
        data.get("vertical", "Other").strip(),
        data.get("message", "").strip(),
        data.get("status", "pending"),
        data.get("notes", "")
    ]

    if USE_TURSO:
        try:
            _, _, last_id = query_turso(sql, params)
            return last_id or 1
        except Exception as e:
            print(f"[DB] Turso create_publisher fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    pub_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pub_id


def get_publishers(
    search: str = "",
    status: str = "",
    vertical: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    conditions = []
    params = []

    if search:
        conditions.append(
            "(full_name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)"
        )
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    if status and status != "all":
        conditions.append("status = ?")
        params.append(status)

    if vertical and vertical != "all":
        conditions.append("vertical = ?")
        params.append(vertical)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    valid_sort_cols = {
        "created_at": "created_at",
        "full_name": "full_name",
        "company": "company",
        "vertical": "vertical",
        "status": "status",
        "email": "email"
    }
    order_col = valid_sort_cols.get(sort_by, "created_at")
    order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"
    is_unlimited = (per_page is None or per_page <= 0 or per_page >= 50000)

    if USE_TURSO:
        try:
            if is_unlimited:
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM publishers {where}", "params": params},
                    {"sql": f"SELECT * FROM publishers {where} ORDER BY {order_col} {order_dir}", "params": params}
                ])
            else:
                offset = (page - 1) * per_page
                results = batch_query_turso([
                    {"sql": f"SELECT COUNT(*) as count FROM publishers {where}", "params": params},
                    {"sql": f"SELECT * FROM publishers {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?", "params": params + [per_page, offset]}
                ])
            count_rows = results[0]
            rows = results[1]
            total = count_rows[0].get("count", 0) if count_rows else 0
            return {
                "publishers": rows,
                "total": total,
                "page": 1 if is_unlimited else page,
                "per_page": total if is_unlimited else per_page,
                "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
            }
        except Exception as e:
            print(f"[DB] Turso get_publishers fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM publishers {where}", params)
    total = cursor.fetchone()[0]

    if is_unlimited:
        cursor.execute(f"SELECT * FROM publishers {where} ORDER BY {order_col} {order_dir}", params)
    else:
        offset = (page - 1) * per_page
        cursor.execute(
            f"SELECT * FROM publishers {where} ORDER BY {order_col} {order_dir} LIMIT ? OFFSET ?",
            params + [per_page, offset],
        )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "publishers": rows,
        "total": total,
        "page": 1 if is_unlimited else page,
        "per_page": total if is_unlimited else per_page,
        "total_pages": 1 if is_unlimited or total == 0 else max(1, (total + per_page - 1) // per_page),
    }


def get_publisher_by_id(pub_id: int):
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT * FROM publishers WHERE id = ?", [pub_id])
            return rows[0] if rows else None
        except Exception as e:
            print(f"[DB] Turso get_publisher_by_id fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM publishers WHERE id = ?", (pub_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_publisher(pub_id: int, data: dict):
    fields = []
    params = []
    allowed = ["full_name", "company", "email", "phone", "vertical", "message", "status", "notes"]
    for key in allowed:
        if key in data and data[key] is not None:
            fields.append(f"{key} = ?")
            params.append(data[key])

    if not fields:
        return False

    params.append(pub_id)
    sql = f"UPDATE publishers SET {', '.join(fields)} WHERE id = ?"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso update_publisher fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated


def delete_publisher(pub_id: int):
    if USE_TURSO:
        try:
            _, affected, _ = query_turso("DELETE FROM publishers WHERE id = ?", [pub_id])
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso delete_publisher fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM publishers WHERE id = ?", (pub_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def bulk_update_publisher_status(pub_ids: list, status: str):
    if not pub_ids or not status:
        return 0
    placeholders = ",".join("?" for _ in pub_ids)
    sql = f"UPDATE publishers SET status = ? WHERE id IN ({placeholders})"
    params = [status] + pub_ids

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, params)
            return affected
        except Exception as e:
            print(f"[DB] Turso bulk_update_publisher_status fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


def bulk_delete_publishers(pub_ids: list):
    if not pub_ids:
        return 0
    placeholders = ",".join("?" for _ in pub_ids)
    sql = f"DELETE FROM publishers WHERE id IN ({placeholders})"

    if USE_TURSO:
        try:
            _, affected, _ = query_turso(sql, pub_ids)
            return affected
        except Exception as e:
            print(f"[DB] Turso bulk_delete_publishers fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql, pub_ids)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


# ── User Management ───────────────────────────────────

def get_user_by_username(username: str):
    clean_username = (username or "").strip()
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [clean_username])
            return rows[0] if rows else None
        except Exception as e:
            print(f"[DB] Turso get_user_by_username fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", (clean_username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_staff():
    sql = "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    if USE_TURSO:
        try:
            rows, _, _ = query_turso(sql)
            return rows
        except Exception as e:
            print(f"[DB] Turso get_all_staff fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute(sql)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def create_user(username: str, password_hash: str, role: str = "staff") -> int:
    sql = "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
    params = [username, password_hash, role]

    if USE_TURSO:
        try:
            _, _, last_id = query_turso(sql, params)
            return last_id or 1
        except Exception as e:
            if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
                return -1
            print(f"[DB] Turso create_user fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    try:
        cursor.execute(sql, params)
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return -1


def delete_user(user_id: int):
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT role FROM users WHERE id = ?", [user_id])
            if rows and rows[0].get("role") == "admin":
                adm_rows, _, _ = query_turso("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
                if adm_rows and adm_rows[0].get("count", 0) <= 1:
                    return False
            _, affected, _ = query_turso("DELETE FROM users WHERE id = ?", [user_id])
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso delete_user fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if row and row["role"] == "admin":
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        if cursor.fetchone()[0] <= 1:
            conn.close()
            return False
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def update_user(user_id: int, data: dict):
    """Update a user's username, password_hash, and/or role."""
    fields = []
    params = []
    for key in ["username", "password_hash", "role"]:
        if key in data:
            fields.append(f"{key} = ?")
            params.append(data[key])

    if not fields:
        return False

    params.append(user_id)
    sql = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"

    if USE_TURSO:
        try:
            # Safety: prevent demoting the last admin
            if "role" in data and data["role"] != "admin":
                rows, _, _ = query_turso("SELECT role FROM users WHERE id = ?", [user_id])
                if rows and rows[0].get("role") == "admin":
                    adm_rows, _, _ = query_turso("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
                    if adm_rows and adm_rows[0].get("count", 0) <= 1:
                        return "last_admin"

            # Check for duplicate username
            if "username" in data:
                dup_rows, _, _ = query_turso(
                    "SELECT id FROM users WHERE username = ? AND id != ?",
                    [data["username"], user_id]
                )
                if dup_rows:
                    return "duplicate"

            _, affected, _ = query_turso(sql, params)
            return affected > 0
        except Exception as e:
            print(f"[DB] Turso update_user fallback ({e})")

    conn = get_local_db()
    cursor = conn.cursor()

    # Safety: prevent demoting the last admin
    if "role" in data and data["role"] != "admin":
        cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if row and row["role"] == "admin":
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            if cursor.fetchone()[0] <= 1:
                conn.close()
                return "last_admin"

    # Check for duplicate username
    if "username" in data:
        cursor.execute("SELECT id FROM users WHERE username = ? AND id != ?", (data["username"], user_id))
        if cursor.fetchone():
            conn.close()
            return "duplicate"

    cursor.execute(sql, params)
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated


# ── System Backup & Restore ──────────────────────────

def get_system_backup() -> dict:
    """Generate a comprehensive JSON backup of all users, leads, flights, and platform configuration."""
    users_sql = "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
    leads_sql = "SELECT * FROM leads ORDER BY id ASC"
    flights_sql = "SELECT * FROM flight_bookings ORDER BY id ASC"
    
    if USE_TURSO:
        try:
            results = batch_query_turso([users_sql, leads_sql, flights_sql])
            users = results[0]
            leads = results[1]
            flights = results[2]
        except Exception as e:
            print(f"[DB] Turso backup fallback ({e})")
            users = []
            leads = []
            flights = []
    else:
        conn = get_local_db()
        cursor = conn.cursor()
        cursor.execute(users_sql)
        users = [dict(r) for r in cursor.fetchall()]
        cursor.execute(leads_sql)
        leads = [dict(r) for r in cursor.fetchall()]
        cursor.execute(flights_sql)
        flights = [dict(r) for r in cursor.fetchall()]
        conn.close()

    return {
        "version": "1.0.0",
        "export_date": datetime.utcnow().isoformat() + "Z",
        "platform": "EverTree Solutions",
        "database_backend": "Turso Cloud (AWS Mumbai)" if USE_TURSO else "SQLite3 Local",
        "stats": {
            "total_users": len(users),
            "total_leads": len(leads),
            "total_flights": len(flights)
        },
        "users": users,
        "leads": leads,
        "flight_bookings": flights
    }


def restore_system_backup(backup: dict) -> dict:
    """Restore leads, flight bookings, and data from a JSON backup file."""
    leads_restored = 0
    leads = backup.get("leads", [])
    
    for lead in leads:
        lead_data = {
            "first_name": lead.get("first_name", ""),
            "last_name": lead.get("last_name", ""),
            "email": lead.get("email", ""),
            "phone": lead.get("phone", ""),
            "zip_code": lead.get("zip_code", ""),
            "date_of_birth": lead.get("date_of_birth", ""),
            "service_type": lead.get("service_type", "Health Insurance"),
            "current_provider": lead.get("current_provider", ""),
            "household_size": lead.get("household_size", "1"),
            "annual_income_range": lead.get("annual_income_range", ""),
            "consent": bool(lead.get("consent", 1)),
            "trusted_form_cert_url": lead.get("trusted_form_cert_url", ""),
            "trusted_form_retained": bool(lead.get("trusted_form_retained", 0)),
            "trusted_form_cert_id": lead.get("trusted_form_cert_id", ""),
            "status": lead.get("status", "new"),
            "notes": lead.get("notes", "")
        }
        create_lead(lead_data)
        leads_restored += 1

    flights_restored = 0
    flight_bookings = backup.get("flight_bookings", [])
    for fb in flight_bookings:
        fb_data = {
            "full_name": fb.get("full_name", ""),
            "email": fb.get("email", ""),
            "phone": fb.get("phone", ""),
            "trip_type": fb.get("trip_type", "Round Trip"),
            "departure": fb.get("departure") or fb.get("departure_city", ""),
            "destination": fb.get("destination") or fb.get("destination_city", ""),
            "address": fb.get("address", ""),
            "state": fb.get("state", ""),
            "zip_code": fb.get("zip_code", ""),
            "trusted_form_cert_url": fb.get("trusted_form_cert_url", ""),
            "trusted_form_retained": bool(fb.get("trusted_form_retained", 0)),
            "trusted_form_cert_id": fb.get("trusted_form_cert_id", ""),
            "status": fb.get("status", "new"),
            "notes": fb.get("notes", "")
        }
        create_flight_booking(fb_data)
        flights_restored += 1
        
    return {
        "success": True,
        "leads_restored": leads_restored,
        "flights_restored": flights_restored,
        "message": f"Successfully restored {leads_restored} lead records and {flights_restored} flight bookings to {('Turso Cloud' if USE_TURSO else 'Local Database')}"
    }


# ── App Settings & Contact Configuration ─────────────────

DEFAULT_CONTACT_CONFIG = {
    "enabled": True,
    "phone_number": "+18558312264",
    "modal_title": "Speak With an Advisor Right Now",
    "modal_message": "Your request has been received! Our support specialists are available immediately to provide personal assistance and lowest quote rates.",
    "auto_redirect": True,
    "auto_redirect_seconds": 5,
    "services": {
        "Health Insurance": "+18558312264",
        "Home Improvement": "+18558312264",
        "Auto & Home Insurance": "+18558312264",
        "Debt Relief": "+18558312264",
        "Legal Help": "+18558312264",
        "Medicare": "+18558312264",
        "Flight Booking": "+18558312264"
    }
}

_settings_table_ensured = False

def _ensure_settings_table():
    global _settings_table_ensured
    if _settings_table_ensured:
        return
    create_sql = "CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))"
    if USE_TURSO:
        try:
            query_turso(create_sql)
        except Exception as e:
            print(f"[DB] Turso ensure app_settings error ({e})")
    try:
        conn = get_local_db()
        c = conn.cursor()
        c.execute(create_sql)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB] Local SQLite ensure app_settings error ({e})")
    _settings_table_ensured = True


def get_app_setting(key: str, default=None):
    """Retrieve an application setting by key from Turso or local SQLite."""
    _ensure_settings_table()
    if USE_TURSO:
        try:
            rows, _, _ = query_turso("SELECT value FROM app_settings WHERE key = ?", [key])
            if rows and len(rows) > 0:
                return rows[0].get("value", default)
            return default
        except Exception as e:
            print(f"[DB] Turso get_app_setting fallback ({e})")
    
    try:
        conn = get_local_db()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM app_settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0]
    except Exception as e:
        print(f"[DB] Local get_app_setting error ({e})")
    return default

def set_app_setting(key: str, value: str):
    """Persist an application setting key-value pair."""
    _ensure_settings_table()
    now_iso = datetime.utcnow().isoformat()
    if USE_TURSO:
        try:
            query_turso(
                "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                [key, value, now_iso]
            )
            return True
        except Exception as e:
            print(f"[DB] Turso set_app_setting fallback ({e})")

    try:
        conn = get_local_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
            (key, value, now_iso)
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[DB] Local set_app_setting error ({e})")
        return False

def get_contact_config() -> dict:
    raw = get_app_setting("contact_config", None)
    if not raw:
        return json.loads(json.dumps(DEFAULT_CONTACT_CONFIG))
    try:
        data = json.loads(raw)
        merged = json.loads(json.dumps(DEFAULT_CONTACT_CONFIG))
        if "services" in data and isinstance(data["services"], dict):
            merged["services"].update(data["services"])
        for k, v in data.items():
            if k != "services":
                merged[k] = v
        return merged
    except Exception:
        return json.loads(json.dumps(DEFAULT_CONTACT_CONFIG))

def update_contact_config(new_config: dict) -> dict:
    current = get_contact_config()
    if "services" in new_config and isinstance(new_config["services"], dict):
        current["services"].update(new_config["services"])
    for k, v in new_config.items():
        if k != "services":
            current[k] = v
    set_app_setting("contact_config", json.dumps(current))
    return current


