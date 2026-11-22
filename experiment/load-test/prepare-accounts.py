"""Create or verify the dedicated accounts using the normal application API."""

import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8102")
PASSWORD = os.environ["BENCH_PASSWORD"]


def post(path, payload):
    request = Request(
        BASE_URL + path,
        json.dumps(payload).encode(),
        {"Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=10) as response:
            return json.load(response)
    except HTTPError:
        return {}


def prepare():
    for number in range(1, 25):
        email = f"flow-k6-{number}@example.com"
        signup = post(
            "/api/accounts/signup/applicant",
            {
                "email": email,
                "password": PASSWORD,
                "name": f"Flow Benchmark {number}",
                "phone": f"0109900{number:04}",
                "totalExperienceYears": 1,
            },
        )
        if signup.get("status") is True:
            continue
        login = post(
            "/api/auth/login",
            {"email": email, "password": PASSWORD, "expectedRole": "APPLICANT"},
        )
        if login.get("status") is not True:
            raise SystemExit(f"Fixture account {number} unavailable. Check BENCH_PASSWORD.")
    print("24 benchmark accounts ready")


if __name__ == "__main__":
    prepare()
