import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
ZIP_REGEX = re.compile(r"^\d{5}(-\d{4})?$")

import os
from pathlib import Path
import httpx
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List, Union
import csv
import io
from datetime import datetime

# Automatically load environment variables from .env file
try:
    from dotenv import load_dotenv
    _backend_env_file = Path(__file__).resolve().parent / ".env"
    _project_env_file = Path(__file__).resolve().parents[1] / ".env"
    try:
        load_dotenv(dotenv_path=_project_env_file)
    except UnicodeDecodeError:
        # The supplied project file is UTF-16. Keep supporting it rather than
        # rewriting or exposing its secrets.
        load_dotenv(dotenv_path=_project_env_file, encoding="utf-16")
    if _backend_env_file.exists():
        load_dotenv(dotenv_path=_backend_env_file, override=True)
except ImportError:
    pass

from . import database, auth

TRUSTEDFORM_API_KEY = os.getenv("TRUSTEDFORM_API_KEY", "82ee82d4bb767148ccb8741c713b8998")

app = FastAPI(title="EverTree Solutions API", version="1.0.0")

@app.on_event("startup")
def startup_event():
    database.init_db()

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://evertreesolutions.com",
        "https://www.evertreesolutions.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def retain_trusted_form_cert(cert_url: str, email: str = "", phone: str = "") -> dict:
    """
    Retain / Claim an ActiveProspect TrustedForm certificate using the TrustedForm API Key.
    ActiveProspect TrustedForm Retain API (v4.0):
    POST to the certificate URL with Basic Auth: username='API', password=TRUSTEDFORM_API_KEY.
    Headers: Accept: application/json, Content-Type: application/json, api-version: 4.0
    Body: {"retain": {"reference": "EverTree Solutions"}, "match_lead": {"email": ..., "phone": ...}}
    """
    if not cert_url:
        return {"retained": False, "cert_id": "", "error": "No certificate URL provided"}

    api_key = (os.getenv("TRUSTEDFORM_API_KEY") or TRUSTEDFORM_API_KEY or "82ee82d4bb767148ccb8741c713b8998").strip()
    if not api_key:
        return {"retained": False, "cert_id": "", "error": "TRUSTEDFORM_API_KEY not configured"}

    clean_phone = "".join(filter(str.isdigit, phone)) if phone else ""
    match_lead = {}
    if email and email.strip():
        match_lead["email"] = email.strip()
    if clean_phone:
        match_lead["phone"] = clean_phone

    payload = {
        "retain": {"reference": "EverTree Solutions"}
    }
    if match_lead:
        payload["match_lead"] = match_lead

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-version": "4.0"
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            # Primary v4.0 ActiveProspect Retain API call
            response = await client.post(
                cert_url,
                auth=("API", api_key),
                headers=headers,
                json=payload
            )
            if response.status_code in (200, 201):
                data = response.json()
                cert_id = data.get("id") or data.get("cert_id") or ""
                print(f"[TrustedForm] Certificate retained successfully via v4.0: {cert_id}")
                return {"retained": True, "cert_id": cert_id, "data": data}

            # If client received explicit 4xx error (e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found),
            # return immediately without sequential delays
            if response.status_code in (400, 401, 403, 404):
                print(f"[TrustedForm] Retention returned terminal HTTP {response.status_code}: {response.text}")
                return {
                    "retained": False,
                    "cert_id": "",
                    "status_code": response.status_code,
                    "error": response.text
                }

            # Fallback 1: Retain without api-version header for legacy certificate endpoints
            alt_resp = await client.post(
                cert_url,
                auth=("API", api_key),
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                json={"vendor": "EverTree Solutions", "reference": "EverTree Solutions"}
            )
            if alt_resp.status_code in (200, 201):
                data = alt_resp.json()
                cert_id = data.get("id") or data.get("cert_id") or ""
                print(f"[TrustedForm] Certificate retained via legacy fallback: {cert_id}")
                return {"retained": True, "cert_id": cert_id, "data": data}

            # Fallback 2: Claims API endpoint
            alt_resp2 = await client.post(
                "https://api.trustedform.com/claims",
                auth=("API", api_key),
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                json={"match_lead_url": cert_url}
            )
            if alt_resp2.status_code in (200, 201):
                data = alt_resp2.json()
                cert_id = data.get("id") or ""
                print(f"[TrustedForm] Certificate claimed via Claims API: {cert_id}")
                return {"retained": True, "cert_id": cert_id, "data": data}

            print(f"[TrustedForm] Retention response status {response.status_code}: {response.text}")
            return {
                "retained": False,
                "cert_id": "",
                "status_code": response.status_code,
                "error": response.text
            }
    except Exception as e:
        print(f"[TrustedForm] Retention error: {e}")
        return {"retained": False, "cert_id": "", "error": str(e)}


class QuoteRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    service_type: str
    zip_code: str
    message: Optional[str] = None
    date_of_birth: Optional[str] = None
    current_provider: Optional[str] = None
    household_size: Optional[str] = None
    annual_income_range: Optional[str] = None
    trusted_form_cert_url: Optional[str] = None
    xxTrustedFormCertUrl: Optional[str] = None
    answers: Optional[dict] = None
    vertical_id: Optional[str] = None
    sub_id: Optional[str] = None
    notes: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class LeadUpdateRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    zip_code: Optional[str] = None
    service_type: Optional[str] = None
    annual_income_range: Optional[str] = None
    current_provider: Optional[str] = None

class BulkStatusRequest(BaseModel):
    lead_ids: list[int]
    status: str

class BulkDeleteRequest(BaseModel):
    lead_ids: list[int]

class ManualLeadCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    service_type: str
    zip_code: str
    status: Optional[str] = "new"
    notes: Optional[str] = ""
    current_provider: Optional[str] = ""
    annual_income_range: Optional[str] = ""
    date_of_birth: Optional[str] = ""

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "staff"


class FlightBookingRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = ""
    trip_type: Optional[str] = "Round Trip"  # 'One Way' or 'Round Trip'
    departure: Optional[str] = ""
    destination: Optional[str] = ""
    departure_city: Optional[str] = ""
    destination_city: Optional[str] = ""
    address: Optional[str] = ""
    state: Optional[str] = ""
    zip_code: Optional[str] = ""
    notes: Optional[str] = ""
    trusted_form_cert_url: Optional[str] = None
    xxTrustedFormCertUrl: Optional[str] = None


class ContactConfigRequest(BaseModel):
    enabled: Optional[bool] = True
    phone_number: Optional[str] = "+18558312264"
    modal_title: Optional[str] = "Speak With an Advisor Right Now"
    modal_message: Optional[str] = "Your request has been received! Our support specialists are available immediately to provide personal assistance and lowest quote rates."
    auto_redirect: Optional[bool] = True
    auto_redirect_seconds: Optional[int] = 5
    services: Optional[Dict[str, str]] = None



class FlightBookingUpdateRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    departure_city: Optional[str] = None
    destination_city: Optional[str] = None
    trip_type: Optional[str] = None


class BuyerCreateRequest(BaseModel):
    full_name: str
    company: str
    email: str
    phone: str
    vertical: str
    message: Optional[str] = ""
    notes: Optional[str] = ""


class BuyerUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    vertical: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PublisherCreateRequest(BaseModel):
    full_name: str
    company: str
    email: str
    phone: str
    vertical: str
    message: Optional[str] = ""
    notes: Optional[str] = ""


class PublisherUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    vertical: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AffiliateSignupRequest(BaseModel):
    referral_code: Optional[str] = ""
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = ""
    legal_entity_type: str
    company_name: str
    website_url: str
    address: str
    address2: Optional[str] = ""
    country: str
    city: str
    zip_code: str
    payment_method: str
    tax_id: Optional[str] = ""
    teams_user_id: str
    offer_types: Union[str, List[str]]
    traffic_source: str
    monthly_ad_budget: str
    other_networks: str
    monthly_volume_other_networks: str
    advertising_methods: Optional[str] = ""
    collects_trustedform_jornaya: str
    agreed_terms: bool


class AffiliateUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    legal_entity_type: Optional[str] = None
    website_url: Optional[str] = None
    address: Optional[str] = None
    address2: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    payment_method: Optional[str] = None
    tax_id: Optional[str] = None
    teams_user_id: Optional[str] = None
    offer_types: Optional[str] = None
    traffic_source: Optional[str] = None
    monthly_ad_budget: Optional[str] = None
    other_networks: Optional[str] = None
    monthly_volume_other_networks: Optional[str] = None
    advertising_methods: Optional[str] = None
    collects_trustedform_jornaya: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AffiliateFormToggleRequest(BaseModel):
    blocked: bool


# ── Data ────────────────────────────────────────────────
SERVICES = [
    {
        "id": 1,
        "title": "Health Insurance",
        "description": "Find affordable health coverage plans tailored to your needs and budget. Compare options from leading providers.",
        "icon": "health",
        "color": "#4ecdc4",
    },
    {
        "id": 2,
        "title": "Home Improvement",
        "description": "Connect with pre-screened, top-rated contractors in your area for renovations, repairs, and remodeling.",
        "icon": "home",
        "color": "#f0a500",
    },
    {
        "id": 3,
        "title": "Auto & Home Insurance",
        "description": "Bundle your auto and home policies to unlock significant savings with trusted insurance carriers.",
        "icon": "auto",
        "color": "#6c63ff",
    },
    {
        "id": 4,
        "title": "Debt Relief",
        "description": "Explore proven solutions to manage and reduce your debt. Get matched with certified financial advisors.",
        "icon": "debt",
        "color": "#ff6b6b",
    },
    {
        "id": 5,
        "title": "Legal Help",
        "description": "Connect with qualified, experienced local attorneys who specialize in your specific legal needs.",
        "icon": "legal",
        "color": "#a29bfe",
    },
    {
        "id": 6,
        "title": "Medicare",
        "description": "Navigate Medicare plans with confidence. Compare Medicare Advantage, Supplement, and Part D options.",
        "icon": "medicare",
        "color": "#00b894",
    },
    {
        "id": 7,
        "title": "Flight Booking",
        "description": "Compare discounted airfares, book domestic and international flights, and explore exclusive travel deals.",
        "icon": "travel",
        "color": "#2563eb",
    },
]

HOW_IT_WORKS = [
    {
        "step": 1,
        "title": "Tell Us What You Need",
        "description": "Answer a few quick questions about the service you're looking for. It takes less than 2 minutes.",
        "icon": "clipboard",
    },
    {
        "step": 2,
        "title": "Compare Top Quotes",
        "description": "We match you with pre-screened professionals and deliver competitive quotes directly to you.",
        "icon": "compare",
    },
    {
        "step": 3,
        "title": "Choose & Save",
        "description": "Review your options, pick the best fit, and start saving today. No obligations, no hidden fees.",
        "icon": "save",
    },
]

TESTIMONIALS = [
    {
        "id": 1,
        "name": "Sarah Mitchell",
        "role": "Homeowner, Austin TX",
        "quote": "EverTree Solutions saved me over $1,200 on my home insurance. The comparison process was incredibly easy and I had quotes within minutes.",
        "rating": 5,
        "avatar_initial": "S",
    },
    {
        "id": 2,
        "name": "James Rodriguez",
        "role": "Small Business Owner, Miami FL",
        "quote": "I was drowning in debt and didn't know where to turn. This platform connected me with an advisor who created a realistic payoff plan.",
        "rating": 5,
        "avatar_initial": "J",
    },
    {
        "id": 3,
        "name": "Linda Chen",
        "role": "Retiree, Portland OR",
        "quote": "Navigating Medicare was so confusing until I found EverTree Solutions. They made it simple to compare plans and find the right coverage.",
        "rating": 5,
        "avatar_initial": "L",
    },
    {
        "id": 4,
        "name": "Marcus Thompson",
        "role": "New Homeowner, Denver CO",
        "quote": "Found an amazing contractor for my kitchen renovation through this site. The whole process from quote to completion was seamless.",
        "rating": 4,
        "avatar_initial": "M",
    },
]

FAQS = [
    {
        "id": 1,
        "question": "Is EverTree Solutions really free to use?",
        "answer": "Yes, absolutely! Our comparison service is 100% free for consumers. We are compensated by our network of service providers, so you never pay a dime to use our platform.",
    },
    {
        "id": 2,
        "question": "How do you find and vet professionals?",
        "answer": "We partner with a nationwide network of licensed, insured, and pre-screened professionals. Every provider in our network undergoes a thorough background check and must meet our quality standards before they can offer quotes through our platform.",
    },
    {
        "id": 3,
        "question": "How quickly will I receive quotes?",
        "answer": "Most users receive their first quotes within minutes of submitting a request. Depending on the service type and your location, you may receive multiple quotes within the first hour.",
    },
    {
        "id": 4,
        "question": "Is my personal information secure?",
        "answer": "Absolutely. We use industry-standard 256-bit SSL encryption to protect your data. We never sell your personal information to third parties, and you can request deletion of your data at any time.",
    },
    {
        "id": 5,
        "question": "Can I compare quotes from multiple providers?",
        "answer": "Yes — that's our core feature! We present you with multiple competitive quotes side-by-side so you can easily compare pricing, coverage, and reviews to make the best decision.",
    },
    {
        "id": 6,
        "question": "What areas do you serve?",
        "answer": "We serve customers across all 50 US states. Our network includes thousands of professionals and providers nationwide, ensuring coverage no matter where you live.",
    },
]


# ── Endpoints ───────────────────────────────────────────
@app.get("/api/services")
async def get_services():
    return {"services": SERVICES}


@app.get("/api/how-it-works")
async def get_how_it_works():
    return {"steps": HOW_IT_WORKS}


@app.get("/api/testimonials")
async def get_testimonials():
    return {"testimonials": TESTIMONIALS}


@app.get("/api/faqs")
async def get_faqs():
    return {"faqs": FAQS}


@app.post("/api/quote-request")
async def submit_quote_request(request: QuoteRequest):
    # Strict input validation
    full_name = (request.full_name or "").strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name (at least 2 characters).")

    email = (request.email or "").strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    phone = (request.phone or "").strip()
    clean_digits = "".join(filter(str.isdigit, phone))
    if len(clean_digits) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit phone number.")

    zip_code = (request.zip_code or "").strip()
    if not ZIP_REGEX.match(zip_code):
        raise HTTPException(status_code=400, detail="Please enter a valid 5-digit US ZIP code.")

    service_type = (request.service_type or "").strip()
    if not service_type:
        raise HTTPException(status_code=400, detail="Please select a valid service.")

    # Split full name into first and last name for database storage
    name_parts = request.full_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # TrustedForm Certificate retention
    tf_cert_url = request.trusted_form_cert_url or request.xxTrustedFormCertUrl or ""
    tf_result = {"retained": False, "cert_id": ""}
    if tf_cert_url:
        tf_result = await retain_trusted_form_cert(tf_cert_url, email=request.email, phone=request.phone)

    # Extract answers from dynamic questionnaire
    answers = request.answers or {}
    household_size = request.household_size or answers.get("household_size") or ""
    annual_income = (
        request.annual_income_range 
        or answers.get("annual_income_range") 
        or answers.get("income_range") 
        or answers.get("debt_amount") 
        or answers.get("coverage_amount") 
        or ""
    )
    current_provider = (
        request.current_provider 
        or answers.get("current_provider") 
        or answers.get("current_carrier") 
        or answers.get("current_coverage") 
        or ""
    )
    dob = (
        request.date_of_birth 
        or answers.get("date_of_birth") 
        or answers.get("age_group") 
        or answers.get("age_range") 
        or ""
    )

    # Compile structured notes from questionnaire responses
    notes_parts = []
    formatted_answers = [f"{k.replace('_', ' ').title()}: {v}" for k, v in answers.items() if v]
    if formatted_answers:
        notes_parts.append(" | ".join(formatted_answers))
    if request.message:
        notes_parts.append(f"Message: {request.message}")
    if request.notes:
        notes_parts.append(request.notes)
    
    combined_notes = "\n".join(notes_parts)

    lead_id = database.create_lead({
        "first_name": first_name,
        "last_name": last_name,
        "email": request.email,
        "phone": request.phone,
        "zip_code": request.zip_code,
        "date_of_birth": dob,
        "service_type": request.service_type,
        "current_provider": current_provider,
        "household_size": str(household_size),
        "annual_income_range": str(annual_income),
        "consent": True,
        "trusted_form_cert_url": tf_cert_url,
        "trusted_form_retained": tf_result.get("retained", False),
        "trusted_form_cert_id": tf_result.get("cert_id", ""),
        "status": "new",
        "notes": combined_notes,
    })

    created_lead = database.get_lead_by_id(lead_id)

    return {
        "success": True,
        "lead_id": lead_id,
        "lead": created_lead,
        "trusted_form": tf_result,
        "message": f"Thank you, {request.full_name}! Your quote request for {request.service_type} has been received. We'll reach out shortly.",
    }


@app.post("/api/admin/login")
async def admin_login(req: LoginRequest):
    user = database.get_user_by_username(req.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "success": True,
        "token": f"session-{user['id']}-{user['username']}",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "created_at": user["created_at"]
        }
    }


@app.get("/api/admin/trustedform/status")
async def get_trustedform_status():
    """
    Check the active ActiveProspect TrustedForm API Key configuration and authentication status.
    """
    api_key = (os.getenv("TRUSTEDFORM_API_KEY") or TRUSTEDFORM_API_KEY or "82ee82d4bb767148ccb8741c713b8998").strip()
    masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) >= 10 else "***"

    auth_valid = False
    details = ""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://cert.trustedform.com/0000000000000000000000000000000000000000",
                auth=("API", api_key),
                headers={"Accept": "application/json", "Content-Type": "application/json", "api-version": "4.0"},
                json={"retain": {"reference": "EverTree Test"}, "match_lead": {"email": "test@example.com", "phone": "5555555555"}}
            )
            # ActiveProspect returns 401 when the API key is invalid.
            # HTTP 200, 400, or 403 confirms the API key is authenticated by ActiveProspect.
            if resp.status_code != 401:
                auth_valid = True
                details = "Authenticated with ActiveProspect TrustedForm API"
            else:
                auth_valid = False
                details = "Authentication failed (HTTP 401 Unauthorized)"
    except Exception as e:
        details = f"Connection error: {str(e)}"

    return {
        "configured": bool(api_key),
        "authenticated": auth_valid,
        "masked_key": masked_key,
        "details": details
    }


@app.get("/api/admin/stats")
async def get_stats():
    return database.get_dashboard_stats()


@app.get("/api/leads")
async def get_leads_list(
    search: str = "", 
    status: str = "", 
    service_type: str = "", 
    page: int = 1, 
    per_page: int = 0,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    return database.get_leads(
        search=search, 
        status=status, 
        service_type=service_type, 
        page=page, 
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order
    )


@app.get("/api/admin/leads/export-csv")
async def export_leads_csv(
    search: str = "",
    status: str = "",
    service_type: str = "",
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    """Export complete leads dataset to CSV with TrustedForm certificate links included."""
    result = database.get_leads(
        search=search,
        status=status,
        service_type=service_type,
        page=1,
        per_page=0,
        sort_by=sort_by,
        sort_order=sort_order
    )
    leads_list = result.get("leads", [])

    output = io.StringIO()
    output.write('\ufeff')  # BOM for UTF-8 Excel compatibility
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "ID", "First Name", "Last Name", "Email", "Phone", "Zip Code",
        "Service Type", "Current Provider", "Income Range", "Household Size",
        "Date of Birth", "Status", "TrustedForm Certificate", "Created At"
    ])

    for l in leads_list:
        cert_url = (l.get("trusted_form_cert_url") or "").strip()
        tf_cell = f'=HYPERLINK("{cert_url}", "{cert_url}")' if cert_url else ""
        writer.writerow([
            l.get("id", ""),
            l.get("first_name", ""),
            l.get("last_name", ""),
            l.get("email", ""),
            l.get("phone", ""),
            l.get("zip_code", ""),
            l.get("service_type", ""),
            l.get("current_provider", "") or "",
            l.get("annual_income_range", "") or "",
            l.get("household_size", "") or "",
            l.get("date_of_birth", "") or "",
            l.get("status", ""),
            tf_cell,
            l.get("created_at", "")
        ])

    csv_data = output.getvalue()
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="evertree_customers_{timestamp_str}.csv"'
        }
    )


@app.post("/api/admin/leads")
async def create_manual_lead(req: ManualLeadCreateRequest):
    lead_id = database.create_lead({
        "first_name": req.first_name,
        "last_name": req.last_name,
        "email": req.email,
        "phone": req.phone,
        "zip_code": req.zip_code,
        "service_type": req.service_type,
        "current_provider": req.current_provider,
        "household_size": "1",
        "annual_income_range": req.annual_income_range,
        "date_of_birth": req.date_of_birth,
        "consent": True,
        "trusted_form_cert_url": "",
        "trusted_form_retained": False,
        "trusted_form_cert_id": "",
    })
    database.update_lead(lead_id, {"status": req.status, "notes": req.notes})
    return {"success": True, "lead_id": lead_id, "lead": database.get_lead_by_id(lead_id)}


@app.post("/api/leads/bulk-status")
async def bulk_update_status(req: BulkStatusRequest):
    count = database.bulk_update_lead_status(req.lead_ids, req.status)
    return {"success": True, "updated_count": count, "message": f"Updated {count} leads to {req.status}"}


@app.post("/api/leads/bulk-delete")
async def bulk_delete(req: BulkDeleteRequest):
    count = database.bulk_delete_leads(req.lead_ids)
    return {"success": True, "deleted_count": count, "message": f"Deleted {count} leads"}


@app.get("/api/leads/{lead_id}")
async def get_lead_details(lead_id: int):
    lead = database.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@app.put("/api/leads/{lead_id}")
async def update_lead_details(lead_id: int, req: LeadUpdateRequest):
    data = req.dict(exclude_none=True)
    success = database.update_lead(lead_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update lead or no fields changed")
    return {"success": True, "message": "Lead updated successfully", "lead": database.get_lead_by_id(lead_id)}


@app.delete("/api/leads/{lead_id}")
async def delete_lead_entry(lead_id: int):
    success = database.delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"success": True, "message": "Lead deleted successfully"}


# ── Flight Bookings API ─────────────────────────────────

@app.post("/api/travel/flight-booking")
async def submit_flight_booking(req: FlightBookingRequest):
    # Validate required fields
    if not req.full_name.strip():
        raise HTTPException(status_code=400, detail="Full Name is required")
    if not req.phone.strip():
        raise HTTPException(status_code=400, detail="Phone Number is required")
    
    departure = (req.departure or req.departure_city or "").strip()
    destination = (req.destination or req.destination_city or "").strip()
    email_val = (req.email or "").strip()

    address = (req.address or "").strip()
    state = (req.state or "").strip()
    zip_code = (req.zip_code or "").strip()

    # TrustedForm Certificate retention
    tf_cert_url = (req.trusted_form_cert_url or req.xxTrustedFormCertUrl or "").strip()
    tf_result = {"retained": False, "cert_id": ""}
    if tf_cert_url:
        tf_result = await retain_trusted_form_cert(tf_cert_url, email=email_val, phone=req.phone)

    booking_id = database.create_flight_booking({
        "full_name": req.full_name.strip(),
        "email": email_val,
        "phone": req.phone.strip(),
        "trip_type": req.trip_type or "Round Trip",
        "departure": departure,
        "destination": destination,
        "departure_city": departure,
        "destination_city": destination,
        "address": address,
        "state": state,
        "zip_code": zip_code,
        "trusted_form_cert_url": tf_cert_url,
        "trusted_form_retained": tf_result.get("retained", False),
        "trusted_form_cert_id": tf_result.get("cert_id", ""),
        "status": "new",
        "notes": req.notes or ""
    })

    # Also mirror into leads table for unified staff visibility
    name_parts = req.full_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    route_desc = f"{departure} -> {destination}" if (departure or destination) else "Direct Flight Assistance"
    flight_notes = f"Trip Type: {req.trip_type} | Service: {route_desc}"
    if address:
        flight_notes += f" | Address: {address}"
    if state:
        flight_notes += f" | State: {state}"
    if zip_code:
        flight_notes += f" | Zip: {zip_code}"
    if req.notes:
        flight_notes += f"\nCustomer Notes: {req.notes}"

    try:
        database.create_lead({
            "first_name": first_name,
            "last_name": last_name,
            "email": email_val or "no-email@evertreesolutions.com",
            "phone": req.phone.strip(),
            "zip_code": zip_code or "00000",
            "date_of_birth": "",
            "service_type": "Flight Booking",
            "current_provider": "Flight Desk",
            "household_size": "1",
            "annual_income_range": "",
            "consent": True,
            "trusted_form_cert_url": tf_cert_url,
            "trusted_form_retained": tf_result.get("retained", False),
            "trusted_form_cert_id": tf_result.get("cert_id", ""),
            "status": "new",
            "notes": flight_notes,
        })
    except Exception as e:
        print(f"[API] Warning: Failed to mirror flight booking into leads: {e}")

    booking = database.get_flight_booking_by_id(booking_id)

    return {
        "success": True,
        "booking_id": booking_id,
        "booking": booking,
        "trusted_form": tf_result,
        "message": f"Thank you, {req.full_name}! Your flight booking request has been received. Our flight desk will send your fare options shortly."
    }


@app.get("/api/travel/flight-bookings")
async def list_flight_bookings(
    search: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    return database.get_flight_bookings(
        search=search,
        status=status,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order
    )


@app.get("/api/travel/flight-bookings/{booking_id}")
async def get_flight_booking(booking_id: int):
    booking = database.get_flight_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Flight booking not found")
    return booking


@app.put("/api/travel/flight-bookings/{booking_id}")
async def update_flight_booking_entry(booking_id: int, req: FlightBookingUpdateRequest):
    data = req.dict(exclude_none=True)
    success = database.update_flight_booking(booking_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update flight booking or no fields changed")
    return {
        "success": True,
        "message": "Flight booking updated successfully",
        "booking": database.get_flight_booking_by_id(booking_id)
    }


@app.delete("/api/travel/flight-bookings/{booking_id}")
async def delete_flight_booking_entry(booking_id: int):
    success = database.delete_flight_booking(booking_id)
    if not success:
        raise HTTPException(status_code=404, detail="Flight booking not found")
    return {"success": True, "message": "Flight booking deleted successfully"}


@app.get("/api/admin/users")
async def list_staff_users():
    return {"users": database.get_all_staff()}


@app.post("/api/admin/users")
async def create_staff_user(req: CreateUserRequest):
    if len(req.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if len(req.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")
    
    hashed = auth.hash_password(req.password)
    user_id = database.create_user(req.username.strip(), hashed, req.role or "staff")
    if user_id == -1:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    return {"success": True, "user_id": user_id, "message": "User created successfully"}


@app.delete("/api/admin/users/{user_id}")
async def delete_staff_user(user_id: int):
    success = database.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete this user (it may be the last remaining admin)")
    return {"success": True, "message": "User deleted successfully"}


@app.get("/api/admin/backup")
async def export_backup():
    return database.get_system_backup()


@app.get("/api/admin/backup/download")
async def download_backup_file():
    import json
    from fastapi.responses import Response
    from datetime import datetime
    backup_data = database.get_system_backup()
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    filename = f"evertree_turso_backup_{date_str}.json"
    content = json.dumps(backup_data, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )


@app.post("/api/admin/restore")
async def import_backup(backup_data: dict):
    if not backup_data or "leads" not in backup_data:
        raise HTTPException(status_code=400, detail="Invalid backup file format")
    result = database.restore_system_backup(backup_data)
    return result


# ── Buyers & Publishers Marketplace APIs ────────────────

@app.post("/api/buyers/register")
async def register_buyer(req: BuyerCreateRequest):
    full_name = (req.full_name or "").strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full Name is required (at least 2 characters).")

    company = (req.company or "").strip()
    if len(company) < 2:
        raise HTTPException(status_code=400, detail="Company Name is required.")

    email = (req.email or "").strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please provide a valid work email address.")

    phone = (req.phone or "").strip()
    clean_digits = "".join(filter(str.isdigit, phone))
    if len(clean_digits) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit contact phone number.")

    buyer_id = database.create_buyer({
        "full_name": req.full_name.strip(),
        "company": req.company.strip(),
        "email": req.email.strip(),
        "phone": req.phone.strip(),
        "vertical": req.vertical.strip() if req.vertical else "Other",
        "message": req.message.strip() if req.message else "",
        "status": "pending",
        "notes": req.notes or ""
    })

    return {
        "success": True,
        "buyer_id": buyer_id,
        "message": f"Thank you, {req.full_name}! Your Buyer Access request for {req.vertical} has been received. Our marketplace manager will reach out within 24 hours."
    }


@app.get("/api/admin/buyers")
async def list_admin_buyers(
    search: str = "",
    status: str = "",
    vertical: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    return database.get_buyers(
        search=search,
        status=status,
        vertical=vertical,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order
    )


@app.get("/api/admin/buyers/export-csv")
async def export_buyers_csv(
    search: str = "",
    status: str = "",
    vertical: str = "",
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    result = database.get_buyers(
        search=search,
        status=status,
        vertical=vertical,
        page=1,
        per_page=0,
        sort_by=sort_by,
        sort_order=sort_order
    )
    buyers_list = result.get("buyers", [])

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "ID", "Full Name", "Company", "Email", "Phone", "Vertical",
        "Message", "Status", "Notes", "Created At"
    ])

    for b in buyers_list:
        writer.writerow([
            b.get("id", ""),
            b.get("full_name", ""),
            b.get("company", ""),
            b.get("email", ""),
            b.get("phone", ""),
            b.get("vertical", ""),
            b.get("message", ""),
            b.get("status", ""),
            b.get("notes", ""),
            b.get("created_at", "")
        ])

    csv_data = output.getvalue()
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="evertree_buyers_{timestamp_str}.csv"'
        }
    )


@app.get("/api/admin/buyers/{buyer_id}")
async def get_buyer_details(buyer_id: int):
    buyer = database.get_buyer_by_id(buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer record not found")
    return buyer


@app.put("/api/admin/buyers/{buyer_id}")
async def update_buyer_details(buyer_id: int, req: BuyerUpdateRequest):
    data = req.dict(exclude_none=True)
    success = database.update_buyer(buyer_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update buyer or no fields changed")
    return {
        "success": True,
        "message": "Buyer record updated successfully",
        "buyer": database.get_buyer_by_id(buyer_id)
    }


@app.delete("/api/admin/buyers/{buyer_id}")
async def delete_buyer_record(buyer_id: int):
    success = database.delete_buyer(buyer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Buyer record not found")
    return {"success": True, "message": "Buyer record deleted successfully"}


@app.post("/api/admin/buyers/bulk-status")
async def bulk_update_buyers_status(req: BulkStatusRequest):
    count = database.bulk_update_buyer_status(req.lead_ids, req.status)
    return {"success": True, "updated_count": count, "message": f"Updated {count} buyers to {req.status}"}


@app.post("/api/admin/buyers/bulk-delete")
async def bulk_delete_buyers_records(req: BulkDeleteRequest):
    count = database.bulk_delete_buyers(req.lead_ids)
    return {"success": True, "deleted_count": count, "message": f"Deleted {count} buyers"}


@app.post("/api/publishers/register")
async def register_publisher(req: PublisherCreateRequest):
    full_name = (req.full_name or "").strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full Name is required (at least 2 characters).")

    company = (req.company or "").strip()
    if len(company) < 2:
        raise HTTPException(status_code=400, detail="Company Name is required.")

    email = (req.email or "").strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please provide a valid business email address.")

    phone = (req.phone or "").strip()
    clean_digits = "".join(filter(str.isdigit, phone))
    if len(clean_digits) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit contact phone number.")

    pub_id = database.create_publisher({
        "full_name": req.full_name.strip(),
        "company": req.company.strip(),
        "email": req.email.strip(),
        "phone": req.phone.strip(),
        "vertical": req.vertical.strip() if req.vertical else "Other",
        "message": req.message.strip() if req.message else "",
        "status": "pending",
        "notes": req.notes or ""
    })

    return {
        "success": True,
        "publisher_id": pub_id,
        "message": f"Thank you, {req.full_name}! Your Publisher application for {req.vertical} has been received. Our partner team will reach out within 24 hours."
    }


@app.get("/api/admin/publishers")
async def list_admin_publishers(
    search: str = "",
    status: str = "",
    vertical: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    return database.get_publishers(
        search=search,
        status=status,
        vertical=vertical,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order
    )


@app.get("/api/admin/publishers/export-csv")
async def export_publishers_csv(
    search: str = "",
    status: str = "",
    vertical: str = "",
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    result = database.get_publishers(
        search=search,
        status=status,
        vertical=vertical,
        page=1,
        per_page=0,
        sort_by=sort_by,
        sort_order=sort_order
    )
    pubs_list = result.get("publishers", [])

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "ID", "Full Name", "Company", "Email", "Phone", "Vertical",
        "Message", "Status", "Notes", "Created At"
    ])

    for p in pubs_list:
        writer.writerow([
            p.get("id", ""),
            p.get("full_name", ""),
            p.get("company", ""),
            p.get("email", ""),
            p.get("phone", ""),
            p.get("vertical", ""),
            p.get("message", ""),
            p.get("status", ""),
            p.get("notes", ""),
            p.get("created_at", "")
        ])

    csv_data = output.getvalue()
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="evertree_publishers_{timestamp_str}.csv"'
        }
    )


@app.get("/api/admin/publishers/{pub_id}")
async def get_publisher_details(pub_id: int):
    publisher = database.get_publisher_by_id(pub_id)
    if not publisher:
        raise HTTPException(status_code=404, detail="Publisher record not found")
    return publisher


@app.put("/api/admin/publishers/{pub_id}")
async def update_publisher_details(pub_id: int, req: PublisherUpdateRequest):
    data = req.dict(exclude_none=True)
    success = database.update_publisher(pub_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update publisher or no fields changed")
    return {
        "success": True,
        "message": "Publisher record updated successfully",
        "publisher": database.get_publisher_by_id(pub_id)
    }


@app.delete("/api/admin/publishers/{pub_id}")
async def delete_publisher_record(pub_id: int):
    success = database.delete_publisher(pub_id)
    if not success:
        raise HTTPException(status_code=404, detail="Publisher record not found")
    return {"success": True, "message": "Publisher record deleted successfully"}


@app.post("/api/admin/publishers/bulk-status")
async def bulk_update_publishers_status(req: BulkStatusRequest):
    count = database.bulk_update_publisher_status(req.lead_ids, req.status)
    return {"success": True, "updated_count": count, "message": f"Updated {count} publishers to {req.status}"}


@app.post("/api/admin/publishers/bulk-delete")
async def bulk_delete_publishers_records(req: BulkDeleteRequest):
    count = database.bulk_delete_publishers(req.lead_ids)
    return {"success": True, "deleted_count": count, "message": f"Deleted {count} publishers"}


# ── Affiliate Signups API (EverTree Solutions) ─────────

@app.get("/api/affiliates/status")
async def get_affiliate_form_status():
    """Public endpoint to check whether affiliate application route is currently blocked or open."""
    return {"blocked": database.get_affiliate_form_blocked()}


@app.post("/api/affiliates/signup")
async def submit_affiliate_signup(req: AffiliateSignupRequest):
    """
    Public endpoint for affiliate signup applications.
    Honors admin route block status.
    """
    if database.get_affiliate_form_blocked():
        raise HTTPException(status_code=403, detail="Affiliate applications are currently closed.")

    # Validation
    if not req.first_name.strip() or not req.last_name.strip():
        raise HTTPException(status_code=400, detail="First and last name are required.")
    
    clean_email = req.email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    if not req.company_name.strip():
        raise HTTPException(status_code=400, detail="Company/Business name is required.")

    if not req.website_url.strip():
        raise HTTPException(status_code=400, detail="Website or social media URL is required.")

    if not req.address.strip() or not req.city.strip() or not req.country.strip() or not req.zip_code.strip():
        raise HTTPException(status_code=400, detail="Complete address information (street, city, country, postal code) is required.")

    if not req.teams_user_id.strip():
        raise HTTPException(status_code=400, detail="Teams User ID is required.")

    if not req.agreed_terms:
        raise HTTPException(status_code=400, detail="You must agree to the Terms of Service to apply.")

    # Format offer_types
    if isinstance(req.offer_types, list):
        offer_types_str = ", ".join(t.strip() for t in req.offer_types if t.strip())
    else:
        offer_types_str = str(req.offer_types).strip()

    if not offer_types_str:
        raise HTTPException(status_code=400, detail="Please select at least one offer type.")

    data = {
        "referral_code": req.referral_code or "",
        "first_name": req.first_name,
        "last_name": req.last_name,
        "email": clean_email,
        "phone": req.phone or "",
        "legal_entity_type": req.legal_entity_type,
        "company_name": req.company_name,
        "website_url": req.website_url,
        "address": req.address,
        "address2": req.address2 or "",
        "country": req.country,
        "city": req.city,
        "zip_code": req.zip_code,
        "payment_method": req.payment_method,
        "tax_id": req.tax_id or "",
        "teams_user_id": req.teams_user_id,
        "offer_types": offer_types_str,
        "traffic_source": req.traffic_source,
        "monthly_ad_budget": req.monthly_ad_budget,
        "other_networks": req.other_networks,
        "monthly_volume_other_networks": req.monthly_volume_other_networks,
        "advertising_methods": req.advertising_methods or "",
        "collects_trustedform_jornaya": req.collects_trustedform_jornaya,
        "agreed_terms": 1,
        "status": "pending",
        "notes": ""
    }

    aff_id = database.create_affiliate_signup(data)
    return {
        "success": True,
        "id": aff_id,
        "message": f"Thank you, {req.first_name}! Your affiliate application for EverTree Solutions has been successfully submitted."
    }


@app.get("/api/admin/affiliates")
async def list_admin_affiliates(
    search: str = "",
    status: str = "",
    page: int = 1,
    per_page: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    result = database.get_affiliate_signups(
        search=search,
        status=status,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order
    )
    result["form_blocked"] = database.get_affiliate_form_blocked()
    return result


@app.get("/api/admin/affiliates/export-csv")
async def export_affiliates_csv(
    search: str = "",
    status: str = "",
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    result = database.get_affiliate_signups(
        search=search,
        status=status,
        page=1,
        per_page=0,
        sort_by=sort_by,
        sort_order=sort_order
    )
    affiliates_list = result.get("affiliates", [])

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "ID", "Referral Code", "First Name", "Last Name", "Email", "Phone",
        "Legal Entity Type", "Company Name", "Website / Social Media",
        "Address", "Address Line 2", "Country", "City", "ZIP Code",
        "Payment Method", "Tax ID / SSN", "Teams User ID", "Offer Types",
        "Primary Traffic Source", "Monthly Ad Budget", "Other Networks",
        "Monthly Volume Other Networks", "Advertising Methods",
        "Collects TrustedForm / Jornaya", "Agreed Terms", "Status", "Notes", "Created At"
    ])

    for a in affiliates_list:
        writer.writerow([
            a.get("id", ""),
            a.get("referral_code", ""),
            a.get("first_name", ""),
            a.get("last_name", ""),
            a.get("email", ""),
            a.get("phone", ""),
            a.get("legal_entity_type", ""),
            a.get("company_name", ""),
            a.get("website_url", ""),
            a.get("address", ""),
            a.get("address2", ""),
            a.get("country", ""),
            a.get("city", ""),
            a.get("zip_code", ""),
            a.get("payment_method", ""),
            a.get("tax_id", ""),
            a.get("teams_user_id", ""),
            a.get("offer_types", ""),
            a.get("traffic_source", ""),
            a.get("monthly_ad_budget", ""),
            a.get("other_networks", ""),
            a.get("monthly_volume_other_networks", ""),
            a.get("advertising_methods", ""),
            a.get("collects_trustedform_jornaya", ""),
            "Yes" if a.get("agreed_terms") in (1, "1", True) else "No",
            a.get("status", ""),
            a.get("notes", ""),
            a.get("created_at", "")
        ])

    csv_data = output.getvalue()
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="evertree_affiliates_{timestamp_str}.csv"'
        }
    )


@app.get("/api/admin/affiliates/{signup_id}")
async def get_affiliate_record(signup_id: int):
    record = database.get_affiliate_signup_by_id(signup_id)
    if not record:
        raise HTTPException(status_code=404, detail="Affiliate application not found")
    return record


@app.put("/api/admin/affiliates/{signup_id}")
async def update_affiliate_record(signup_id: int, req: AffiliateUpdateRequest):
    data = req.dict(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    success = database.update_affiliate_signup(signup_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update affiliate record")
    return {
        "success": True,
        "message": "Affiliate application updated successfully",
        "affiliate": database.get_affiliate_signup_by_id(signup_id)
    }


@app.delete("/api/admin/affiliates/{signup_id}")
async def delete_affiliate_record(signup_id: int):
    success = database.delete_affiliate_signup(signup_id)
    if not success:
        raise HTTPException(status_code=404, detail="Affiliate record not found")
    return {"success": True, "message": "Affiliate record deleted successfully"}


@app.post("/api/admin/affiliates/bulk-status")
async def bulk_update_affiliates_status(req: BulkStatusRequest):
    count = database.bulk_update_affiliate_status(req.lead_ids, req.status)
    return {"success": True, "updated_count": count, "message": f"Updated {count} affiliates to {req.status}"}


@app.post("/api/admin/affiliates/bulk-delete")
async def bulk_delete_affiliates_records(req: BulkDeleteRequest):
    count = database.bulk_delete_affiliates(req.lead_ids)
    return {"success": True, "deleted_count": count, "message": f"Deleted {count} affiliates"}


@app.get("/api/admin/settings/affiliate-form")
async def get_admin_affiliate_form_settings():
    return {"blocked": database.get_affiliate_form_blocked()}


@app.post("/api/admin/settings/affiliate-form")
async def update_admin_affiliate_form_settings(req: AffiliateFormToggleRequest):
    success = database.set_affiliate_form_blocked(req.blocked)
    status_label = "blocked (signups closed)" if req.blocked else "unblocked (signups active)"
    return {
        "success": success,
        "blocked": req.blocked,
        "message": f"Affiliate signup form route is now {status_label}."
    }


# ── Contact Us & Form Redirect Configuration API ────────

@app.get("/api/settings/contact")
async def get_contact_settings():
    """Public endpoint to fetch active contact & redirect settings for consumer form modals."""
    return database.get_contact_config()


@app.post("/api/admin/settings/contact")
async def update_contact_settings(req: ContactConfigRequest):
    """Admin endpoint to update contact phone number and on-screen redirection settings."""
    data = req.dict(exclude_unset=True)
    updated = database.update_contact_config(data)
    return {"success": True, "config": updated, "message": "Contact redirection settings saved successfully"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}



# Serve static frontend production build if present
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exc):
    if exc.status_code == 404:
        if request.url.path.startswith("/api/"):
            return JSONResponse(status_code=404, content={"detail": exc.detail or "Not Found"})
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


