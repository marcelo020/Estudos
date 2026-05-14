from pathlib import Path
import http.server
import socketserver
import threading
import time
import json

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
PORT = 8765
BASE_URL = f"http://127.0.0.1:{PORT}"


def start_server():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, format, *args):
            return

    httpd = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def create_responsavel(page, name, email, password):
    page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
    page.click("#toggleFormBtn")
    page.fill("#registerName", name)
    page.fill("#registerEmail", email)
    page.check('input[name="registerRole"][value="responsavel"]')
    page.fill("#registerPassword", password)
    page.fill("#registerPasswordConfirm", password)
    page.click("#registerForm button[type='submit']")
    page.wait_for_selector("#userSection:not(.hidden)")
    page.click("#goToDashboardBtn")
    page.wait_for_url(f"{BASE_URL}/index.html")


def save_candidate(page, nome, cpf, email):
    page.click('button[data-tab="cadastro"]')
    page.wait_for_selector("#candidateForm")
    page.select_option("#area", label="Gestao Educacional")
    page.fill("#nome", nome)
    page.fill("#cpf", cpf)
    page.fill("#email", email)
    page.fill("#telefone", "(61) 99999-1111")
    page.fill("#razaoSocial", "Empresa Teste Ltda")
    page.fill("#cnpj", "12.345.678/0001-90")
    page.check('input[name="docs"][value="RG"]')
    page.click("#submitBtn")
    page.wait_for_timeout(500)


def logout_index(page):
    page.click("#logoutBtn")
    page.wait_for_url(f"{BASE_URL}/login.html")


def create_candidato_account(page, name, email, password):
    page.goto(f"{BASE_URL}/login.html", wait_until="networkidle")
    page.click("#toggleFormBtn")
    page.fill("#registerName", name)
    page.fill("#registerEmail", email)
    page.check('input[name="registerRole"][value="candidato"]')
    page.fill("#registerPassword", password)
    page.fill("#registerPasswordConfirm", password)
    page.click("#registerForm button[type='submit']")
    page.wait_for_selector("#userSection:not(.hidden)")
    page.click("#goToDashboardBtn")
    page.wait_for_url(f"{BASE_URL}/progresso-candidato.html")


def run_test():
    report = {
        "scenario_1": {},
        "scenario_2": {}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(f"{BASE_URL}/login.html", wait_until="domcontentloaded")
        page.evaluate("localStorage.clear()")

        # Cenario 1: dois responsaveis e persistencia cruzada
        create_responsavel(page, "Responsavel A", "resp.a@test.com", "Senha123")
        save_candidate(page, "Candidato A", "529.982.247-25", "candidato.a@test.com")

        storage_after_a = page.evaluate("""
            () => ({
              users: JSON.parse(localStorage.getItem('sandbox-users-v1') || '[]'),
              candidatos: JSON.parse(localStorage.getItem('modelo-sandbox-candidatos-v1') || '[]')
            })
        """)

        logout_index(page)

        create_responsavel(page, "Responsavel B", "resp.b@test.com", "Senha123")
        save_candidate(page, "Candidato B", "935.411.347-80", "candidato.b@test.com")

        storage_after_b = page.evaluate("""
            () => ({
              users: JSON.parse(localStorage.getItem('sandbox-users-v1') || '[]'),
              candidatos: JSON.parse(localStorage.getItem('modelo-sandbox-candidatos-v1') || '[]')
            })
        """)

        users = storage_after_b["users"]
        candidatos = storage_after_b["candidatos"]

        user_a = next((u for u in users if u.get("email") == "resp.a@test.com"), None)
        user_b = next((u for u in users if u.get("email") == "resp.b@test.com"), None)

        count_a = len([c for c in candidatos if c.get("userId") == (user_a or {}).get("id")])
        count_b = len([c for c in candidatos if c.get("userId") == (user_b or {}).get("id")])

        scenario_1_ok = len(candidatos) >= 2 and count_a >= 1 and count_b >= 1

        report["scenario_1"] = {
            "ok": scenario_1_ok,
            "total_candidatos": len(candidatos),
            "candidatos_responsavel_a": count_a,
            "candidatos_responsavel_b": count_b,
            "emails_candidatos": [c.get("email") for c in candidatos]
        }

        logout_index(page)

        # Cenario 2: conta candidato com mesmo email do cadastro existente
        create_candidato_account(page, "Conta Candidato A", "candidato.a@test.com", "Senha123")

        candidato_nome = page.locator("#candidatoNome").inner_text().strip()
        sem_inscricao_visivel = page.locator("#noInscricao").is_visible()

        linked_data = page.evaluate("""
            () => {
              const currentUser = JSON.parse(localStorage.getItem('sandbox-current-user-v1') || '{}');
              const candidatos = JSON.parse(localStorage.getItem('modelo-sandbox-candidatos-v1') || '[]');
              const vinculado = candidatos.find(c => c.candidateAccountUserId === currentUser.id) || null;
              return {
                currentUser,
                vinculado
              };
            }
        """)

        scenario_2_ok = (
            (not sem_inscricao_visivel)
            and candidato_nome == "Candidato A"
            and linked_data.get("vinculado") is not None
            and linked_data["vinculado"].get("email") == "candidato.a@test.com"
            and linked_data["vinculado"].get("nome") == "Candidato A"
        )

        report["scenario_2"] = {
            "ok": scenario_2_ok,
            "nome_exibido_no_progresso": candidato_nome,
            "no_inscricao_visivel": sem_inscricao_visivel,
            "candidateAccountUserId_vinculado": (linked_data.get("vinculado") or {}).get("candidateAccountUserId"),
            "email_vinculado": (linked_data.get("vinculado") or {}).get("email")
        }

        browser.close()

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    httpd = start_server()
    try:
        time.sleep(0.2)
        run_test()
    finally:
        httpd.shutdown()
