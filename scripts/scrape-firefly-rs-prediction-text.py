#!/usr/bin/env python3
"""Scrape Firefly RS prediction texts.

This script intentionally captures text only. It does not read, download, or
store Firefly audio.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import time
from pathlib import Path
from typing import Any

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_OUTPUT = Path("tmp/firefly/rs-prediction.json")
CHROME_BINARY = os.environ.get("CHROME_BINARY", "/usr/bin/google-chrome")
CHROMEDRIVER_PATH = os.environ.get("CHROMEDRIVER_PATH", "/home/neodev/drivers/chromedriver-linux64/chromedriver")


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def legacy_credentials(path: str | None) -> tuple[str | None, str | None]:
    if not path:
        return None, None

    legacy_path = Path(path)
    if not legacy_path.exists():
        return None, None

    spec = importlib.util.spec_from_file_location("firefly_legacy_rs", legacy_path)
    if spec is None or spec.loader is None:
        return None, None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, "PHONE", None), getattr(module, "PASSWORD", None)


def get_credentials(legacy_config: str | None) -> tuple[str, str]:
    phone = os.environ.get("FIREFLY_PHONE") or os.environ.get("FIREFLYAU_PHONE")
    password = os.environ.get("FIREFLY_PASSWORD") or os.environ.get("FIREFLYAU_PASSWORD")

    if not phone or not password:
      legacy_phone, legacy_password = legacy_credentials(legacy_config)
      phone = phone or legacy_phone
      password = password or legacy_password

    if not phone or not password:
        raise RuntimeError("Missing Firefly credentials. Set FIREFLY_PHONE and FIREFLY_PASSWORD in .env.local.")

    return phone, password


def build_driver() -> webdriver.Chrome:
    options = Options()
    options.binary_location = CHROME_BINARY
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1400,2400")
    options.add_argument("--remote-debugging-port=9223")
    service = Service(CHROMEDRIVER_PATH)
    return webdriver.Chrome(service=service, options=options)


def wait_loading_gone(driver: webdriver.Chrome, timeout: int = 20) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        masks = driver.find_elements(By.CSS_SELECTOR, ".el-loading-mask.is-fullscreen")
        if not any(mask.is_displayed() for mask in masks):
            return
        time.sleep(0.3)


def login(driver: webdriver.Chrome, wait: WebDriverWait, phone: str, password: str) -> None:
    print("Opening Firefly login page...")
    driver.get("https://www.fireflyau.com/login")
    wait_loading_gone(driver)

    try:
        phone_tab = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'手机登录')]")))
        driver.execute_script("arguments[0].click();", phone_tab)
        time.sleep(1)
    except Exception:
        pass

    country_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[contains(@placeholder,'请选择')]")))
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", country_input)
    driver.execute_script("arguments[0].click();", country_input)
    time.sleep(0.5)

    au_option = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(),'+61')]")))
    driver.execute_script("arguments[0].click();", au_option)

    phone_input = visible_input(driver, "//input[contains(@placeholder,'请输入手机号码')]")
    set_input_value(driver, phone_input, phone)

    password_input = visible_input(driver, "//input[contains(@placeholder,'密码') or @type='password']")
    set_input_value(driver, password_input, password)
    password_input.send_keys(Keys.ENTER)

    time.sleep(5)
    print("Logged in, current URL:", driver.current_url)


def visible_input(driver: webdriver.Chrome, xpath: str):
    candidates = driver.find_elements(By.XPATH, xpath)
    for candidate in candidates:
        try:
            if candidate.is_displayed() and candidate.is_enabled():
                return candidate
        except Exception:
            pass
    if candidates:
        return candidates[-1]
    raise RuntimeError(f"No input matched: {xpath}")


def set_input_value(driver: webdriver.Chrome, element: Any, value: str) -> None:
    driver.execute_script(
        """
        const input = arguments[0];
        const value = arguments[1];
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        """,
        element,
        value,
    )


def enter_rs_page(driver: webdriver.Chrome, wait: WebDriverWait) -> None:
    driver.get("https://www.fireflyau.com/ptehome/online-practice?t=speaking")
    wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, "text-item")))
    time.sleep(2)

    for item in driver.find_elements(By.CLASS_NAME, "text-item"):
        text = driver.execute_script("return arguments[0].innerText;", item).strip()
        if "RS" in text or "Repeat Sentence" in text:
            driver.execute_script("arguments[0].click();", item)
            time.sleep(5)
            print("Entered RS page:", driver.current_url)
            return

    raise RuntimeError("Could not find RS / Repeat Sentence entry.")


def scroll_until_all_loaded(driver: webdriver.Chrome, pause_seconds: float = 1.5, max_no_change: int = 4) -> None:
    no_change = 0
    last_count = 0

    while True:
        titles = driver.find_elements(By.CLASS_NAME, "title")
        count = len(titles)
        print("Loaded RS titles:", count)
        if count == 0:
            raise RuntimeError("No .title elements found on current RS page.")

        driver.execute_script("arguments[0].scrollIntoView({block:'end'});", titles[-1])
        time.sleep(pause_seconds)

        new_count = len(driver.find_elements(By.CLASS_NAME, "title"))
        if new_count == last_count:
            no_change += 1
        else:
            no_change = 0
        last_count = new_count

        if no_change >= max_no_change:
            print("Reached end of RS list.")
            return


def clean_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = re.sub(r"^\d+\.\s*", "", text)
    return text.strip()


def extract_predictions(driver: webdriver.Chrome) -> list[dict[str, Any]]:
    predictions: list[dict[str, Any]] = []
    seen: set[str] = set()
    titles = driver.find_elements(By.CLASS_NAME, "title")
    print("Total title elements:", len(titles))

    for index, title in enumerate(titles):
        sentence = clean_sentence(title.text)
        if not sentence:
            continue

        try:
            block = title.find_element(By.XPATH, "./..")
            block_text = driver.execute_script("return arguments[0].innerText;", block).strip()
        except Exception:
            block_text = title.text.strip()

        if "预测" not in block_text:
            continue

        if sentence in seen:
            continue

        seen.add(sentence)
        source_id_match = re.search(r"#\d+", block_text)
        predictions.append({
            "index": len(predictions) + 1,
            "text": sentence,
            "sourceId": source_id_match.group(0) if source_id_match else None,
            "rawBlockText": block_text,
        })
        print(f"Prediction {len(predictions)}: {sentence}")

    return predictions


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--legacy-config", default="/home/neodev/selenium/speaking/rs/find_rs.py")
    args = parser.parse_args()

    load_dotenv(Path(".env.local"))
    phone, password = get_credentials(args.legacy_config)

    driver = build_driver()
    wait = WebDriverWait(driver, 25)

    try:
        login(driver, wait, phone, password)
        enter_rs_page(driver, wait)
        scroll_until_all_loaded(driver)
        predictions = extract_predictions(driver)
    finally:
        driver.quit()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps({
        "source": "firefly",
        "questionType": "rs",
        "scrapedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(predictions),
        "items": predictions,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output_path} with {len(predictions)} RS prediction texts.")


if __name__ == "__main__":
    main()
